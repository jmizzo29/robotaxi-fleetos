self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'ROBOAGENT';
  const options = {
    body: data.body || 'Your Tesla needs you.',
    tag: data.tag || `${data.vin || 'fleet'}-${data.trigger || 'alert'}`,
    renotify: false,
    icon: '/favicon.svg',
    data: {
      url: data.url || '/#/overview',
      vin: data.vin || null,
      trigger: data.trigger || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/#/overview';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => 'focus' in client);
      if (existing) {
        if (typeof existing.navigate === 'function') {
          existing.navigate(url);
        }
        return existing.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
