self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Eous AI Mentor', body: event.data.text() };
    }
  }

  const title = data.title || 'Eous AI Mentor';
  const options = {
    body: data.body || 'You have new updates!',
    icon: '/vite.svg', // Fallback to vite logo if available
    badge: '/vite.svg',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
