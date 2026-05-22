const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { DateTime } = require("luxon");

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const messaging = getMessaging();

/**
 * Scheduled Cloud Function to dispatch active fitness/health reminders.
 * Runs every 15 minutes. Analyzes user timezone preferences and matches schedules.
 */
exports.dispatchScheduledReminders = onSchedule({
  schedule: "*/15 * * * *",
  timeZone: "UTC",
  memory: "256MiB",
  timeoutSeconds: 300
}, async (event) => {
  logger.info("Initializing timezone-aware reminder check...");
  const nowUtc = DateTime.utc();

  try {
    const usersSnapshot = await db.collection("users").get();
    logger.info(`Checking schedules for ${usersSnapshot.size} users.`);

    let totalSent = 0;
    let staleRemoved = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const reminders = userData.reminders || [];
      const userTimezone = userData.timezone || "UTC";

      if (!reminders || reminders.length === 0) {
        continue;
      }

      // Check if user has active notification subscriptions
      const subsSnapshot = await db.collection("users").doc(userId).collection("subscriptions").get();
      if (subsSnapshot.empty) {
        continue;
      }

      // Calculate current user local time using Luxon
      let userLocalTime;
      try {
        userLocalTime = nowUtc.setZone(userTimezone);
      } catch (err) {
        logger.error(`Invalid timezone "${userTimezone}" for user ${userId}. Defaulting to UTC.`);
        userLocalTime = nowUtc.setZone("UTC");
      }

      const localHour = userLocalTime.hour;
      const localMin = userLocalTime.minute;
      const userTotalMinutes = localHour * 60 + localMin;

      logger.debug(`User ${userId} local time in ${userTimezone}: ${userLocalTime.toFormat("HH:mm")}`);

      for (const reminder of reminders) {
        if (!reminder.enabled || !reminder.time || !reminder.message) {
          continue;
        }

        // Parse reminder time (format assumed "HH:mm")
        const timeParts = reminder.time.split(":");
        if (timeParts.length !== 2) {
          logger.warn(`User ${userId} has malformed reminder time: ${reminder.time}`);
          continue;
        }

        const remHour = parseInt(timeParts[0], 10);
        const remMin = parseInt(timeParts[1], 10);
        const reminderTotalMinutes = remHour * 60 + remMin;

        // timezone-aware sliding window check:
        // Reminders trigger if their scheduled time is in the past 15-minute interval.
        // We include wrapping math to support midnight scheduling (e.g. at 00:05 local time)
        let isMatch = false;
        const startMinutes = userTotalMinutes - 15;

        if (startMinutes >= 0) {
          isMatch = reminderTotalMinutes > startMinutes && reminderTotalMinutes <= userTotalMinutes;
        } else {
          // Wrap-around case (e.g. from 23:45 to 00:00)
          const wrappedStart = startMinutes + 1440;
          isMatch = reminderTotalMinutes > wrappedStart || reminderTotalMinutes <= userTotalMinutes;
        }

        if (isMatch) {
          logger.info(`Reminder Match! User: ${userId}, Title: "${reminder.title}", Time: ${reminder.time}`);

          // Extract tokens
          const tokens = [];
          const docIds = [];
          subsSnapshot.forEach((subDoc) => {
            const subData = subDoc.data();
            if (subData.token) {
              tokens.push(subData.token);
              docIds.push(subDoc.id);
            }
          });

          if (tokens.length === 0) continue;

          // Prepare FCM payload matching sw.js layout
          const payload = {
            data: {
              title: reminder.title || "🏋️ LifeTraker Reminder",
              body: reminder.message,
              tag: reminder.id || "gym-reminder",
              url: "/"
            },
            tokens: tokens
          };

          try {
            const response = await messaging.sendEachForMulticast(payload);
            logger.info(`Multicast complete for user ${userId}. Success: ${response.successCount}, Failure: ${response.failureCount}`);
            totalSent += response.successCount;

            // Remove expired or invalid FCM subscription tokens from Firestore
            for (let i = 0; i < response.responses.length; i++) {
              const res = response.responses[i];
              if (!res.success) {
                const errorCode = res.error?.code;
                if (
                  errorCode === "messaging/registration-token-not-registered" ||
                  errorCode === "messaging/invalid-registration-token"
                ) {
                  const staleDocId = docIds[i];
                  logger.warn(`Removing stale token subscription "${staleDocId}" for user ${userId}`);
                  await db.collection("users").doc(userId).collection("subscriptions").doc(staleDocId).delete();
                  staleRemoved++;
                }
              }
            }
          } catch (sendErr) {
            logger.error(`Error sending multicast reminders to user ${userId}:`, sendErr);
          }
        }
      }
    }

    logger.info(`Reminder sweep finished. Dispatched: ${totalSent}, Stale tokens removed: ${staleRemoved}`);
  } catch (error) {
    logger.error("Global crash in dispatchScheduledReminders function:", error);
  }
  return null;
});

/**
 * Callable Cloud Function to easily test background push notifications.
 * Triggered from developer options or client settings panel.
 */
exports.sendTestPush = onCall(async (request) => {
  // Ensure the user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to send a test notification.");
  }

  const userId = request.auth.uid;
  const { title, message } = request.data || {};

  try {
    const subsSnapshot = await db.collection("users").doc(userId).collection("subscriptions").get();
    if (subsSnapshot.empty) {
      throw new HttpsError("failed-precondition", "No active device registrations found. Enable notifications first.");
    }

    const tokens = [];
    subsSnapshot.forEach((subDoc) => {
      const data = subDoc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });

    if (tokens.length === 0) {
      throw new HttpsError("failed-precondition", "No active registration tokens found.");
    }

    const payload = {
      data: {
        title: title || "💪 LifeTraker Test",
        body: message || "Push Notifications are configured correctly! 🔥",
        tag: "test-alert",
        url: "/"
      },
      tokens: tokens
    };

    const response = await messaging.sendEachForMulticast(payload);
    logger.info(`Test push multicast sent to ${userId}. Success: ${response.successCount}, Failure: ${response.failureCount}`);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (err) {
    logger.error(`Error in sendTestPush function for user ${userId}:`, err);
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError("internal", "An error occurred while dispatching the test push notification.");
  }
});
