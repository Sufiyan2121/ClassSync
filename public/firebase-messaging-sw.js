importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Parse client configuration from registration query parameters
const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey');
const projectId = params.get('projectId');
const messagingSenderId = params.get('messagingSenderId');
const appId = params.get('appId');
const authDomain = params.get('authDomain') || (projectId ? `${projectId}.firebaseapp.com` : '');
const storageBucket = params.get('storageBucket') || (projectId ? `${projectId}.firebasestorage.app` : '');

if (apiKey && projectId && !firebase.apps.length) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });
}

// Force the service worker to activate immediately so updates apply instantly
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

if (firebase.apps.length) {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    'ClassSync Announcement';

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    '';

  const targetUrl =
    payload.data?.url ||
    payload.fcmOptions?.link ||
    '/student';

  const icon =
    payload.notification?.icon ||
    payload.data?.icon ||
    '/icons/icon-192x192.png';

  const options = {
    body: body,
    icon: icon,
    badge: '/icons/icon-192x192.png',
    data: {
      url: targetUrl,
      postId: payload.data?.postId,
    },
    tag: payload.data?.postId || 'classsync-notification',
    renotify: true,
  };

  return self.registration.showNotification(title, options);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/student';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && urlToOpen) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
