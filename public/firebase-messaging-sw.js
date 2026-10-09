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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.data?.title || 'ClassSync Update';
  const notificationOptions = {
    body: payload.data?.body,
    icon: '/icons/icon-192x192.png', // Primary logo
    badge: '/icons/icon-192x192.png', // Small icon in status bar
    image: '/icons/icon-512x512.png', // Large colorful image
    vibrate: [200, 100, 200, 100, 200], // Custom vibration pattern
    tag: payload.data?.postId || 'classsync-update',
    renotify: true,
    requireInteraction: true, // Keeps notification on screen until user interacts
    actions: [
      { action: 'open', title: '👀 View Now' },
      { action: 'dismiss', title: '✖ Dismiss' }
    ],
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  // Determine URL, default to root or use specific path if provided
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
