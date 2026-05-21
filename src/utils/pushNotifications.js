// Push notification utilities deprecated and removed at user request.
export async function requestNotificationPermission() { return false; }
export async function subscribeUserToPush() { return null; }
export async function unsubscribeUserFromPush() { return false; }
export async function registerServiceWorker() { return null; }
export function showLocalNotification() {}
