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
  
  const notificationTitle = payload.notification?.title || 'ClassSync Update';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
