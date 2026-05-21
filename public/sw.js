// LifeTraker Service Worker — push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '💪 LifeTraker';
  const options = {
    body: data.body || 'Time to check your progress!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'lifetraker',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// Install & activate — no caching, keep it simple
self.addEventListener('install',   () => self.skipWaiting());
self.addEventListener('activate',  (e) => e.waitUntil(clients.claim()));
