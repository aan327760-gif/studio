
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// تهيئة الخلفية للسيادة الرقمية
firebase.initializeApp({
  apiKey: "AIzaSyBe8DNJNHJDaaZBTjZl0cZwLf8-Y0FpWs0",
  authDomain: "unbound-460f3.firebaseapp.com",
  projectId: "unbound-460f3",
  storageBucket: "unbound-460f3.firebasestorage.app",
  messagingSenderId: "209179781618",
  appId: "1:209179781618:web:66d31df45f4ca8704ea36b"
});

const messaging = firebase.messaging();

// التعامل مع الرسائل في الخلفية (والتطبيق مغلق)
messaging.onBackgroundMessage((payload) => {
  console.log('[Sovereign Background Message]', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png', // تأكد من وجود أيقونة
    badge: '/icons/icon-192x192.png',
    tag: 'unbound-notif',
    renotify: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
