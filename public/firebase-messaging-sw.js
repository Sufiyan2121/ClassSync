importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBRSXCVM4TnWJVmEZ5GyiYPxcOR_Io7tMQ",
  authDomain: "classsync-83f62.firebaseapp.com",
  projectId: "classsync-83f62",
  storageBucket: "classsync-83f62.firebasestorage.app",
  messagingSenderId: "639926257766",
  appId: "1:639926257766:web:408d6f1fe385aed11c05a7"
});

const messaging = firebase.messaging();

// Force the service worker to activate immediately so updates apply instantly
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || 'ClassSync Update';
  const body = payload.data?.body || 'New message received.';

  const icon = payload.data?.icon || '/icons/icon-192x192.png';
  const image = payload.data?.image || '/icons/icon-512x512.png';

  return self.registration.showNotification(title, {
    body: body,
    icon: icon,
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: payload.data?.postId || 'classsync-update',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: '🚀 Open App' }
    ],
    data: { url: payload.data?.url || '/' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
