/**
 * Push Notification Utilities for LifeTraker
 * Uses browser Notification API (no server push key needed).
 * Schedules local setTimeout-based reminders relative to current time of day.
 */

const STORAGE_KEY = 'lifetraker_notif_setup';

// Show a local browser notification immediately
function showNotif(title, body, tag = 'lifetraker') {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag,
    renotify: true,
    vibrate: [200, 100, 200]
  });
}

/**
 * Schedule a notification to fire at a specific hour:minute today.
 * If that time has already passed today, skip it (don't fire yesterday's).
 * Returns the timeout ID so it can be cleared if needed.
 */
function scheduleAt(hour, minute, title, body, tag) {
  const now    = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  const ms     = target.getTime() - now.getTime();
  if (ms <= 0) return null; // already passed
  return setTimeout(() => showNotif(title, body, tag), ms);
}

/**
 * Request notification permission from the user.
 * Resolves to true if granted, false otherwise.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Schedule all daily reminders for the rest of today.
 * Call this once on app mount (after permission is granted).
 * Returns an array of timeout IDs to clear on unmount.
 */
export function scheduleDailyReminders(todayPlanLabel = '') {
  if (Notification.permission !== 'granted') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === new Date().toDateString()) return []; // already set up today

  const ids = [
    scheduleAt(8,  0,  '🌅 Good Morning!',        'Time for breakfast — stick to your meal plan! 💪',               'morning'),
    scheduleAt(9,  0,  '💪 Workout Time!',          todayPlanLabel ? `Today: ${todayPlanLabel} — let\'s go! 🔥` : 'Time to hit the gym! 🏋️', 'workout'),
    scheduleAt(13, 0,  '🍽️ Lunch Reminder',         'Don\'t skip lunch — log your meals and hit your protein! 🥗',    'lunch'),
    scheduleAt(17, 30, '⚡ Pre-Workout Snack',       'Have your pre-workout meal if you train in the evening!',         'preworkout'),
    scheduleAt(19, 0,  '🍴 Dinner Time',             'Log your dinner and check today\'s macros!',                      'dinner'),
    scheduleAt(21, 0,  '🎯 Evening Check-in',        'Log your study session & review today\'s progress! 📚',           'checkin'),
  ].filter(Boolean);

  localStorage.setItem(STORAGE_KEY, new Date().toDateString());
  return ids;
}

/**
 * Register the service worker (for future server-push upgrades).
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.warn('SW registration failed:', e);
  }
}
