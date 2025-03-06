// Firebase Messaging Service Workerの実装

// Firebaseの設定
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// Firebase構成オブジェクト
// 注: これはFirebaseコンソールから取得する必要があります
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

// FCMインスタンスを取得
const messaging = firebase.messaging();

// バックグラウンドメッセージの処理
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 受信されたメッセージ:', payload);

  const notificationTitle = payload.notification.title || '在庫通知';
  const notificationOptions = {
    body: payload.notification.body || '在庫が入荷しました！',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge.png',
    data: {
      url: payload.data && payload.data.url ? payload.data.url : '/'
    },
    click_action: payload.notification.click_action
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリックイベントのリスナー
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // 通知がクリックされたときの動作
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.notification.click_action) {
    event.waitUntil(
      clients.openWindow(event.notification.click_action)
    );
  }
});
