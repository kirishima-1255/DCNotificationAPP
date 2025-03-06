// Firebase Messaging Service Workerの実装

// Firebaseの設定
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// Firebase構成オブジェクト
// 注: これはFirebaseコンソールから取得する必要があります
firebase.initializeApp({
  apiKey: "AIzaSyBSaIIQe9bqF6Mfh2F3vGqvKPmDPrKtQqA",
  authDomain: "docomo-certified-notification.firebaseapp.com",
  projectId: "docomo-certified-notification",
  storageBucket: "docomo-certified-notification.firebasestorage.app",
  messagingSenderId: "716682348648",
  appId: "1:716682348648:web:ea00b080c3c6a56f5c53dd",
  measurementId: "G-11FDW1VMX5"
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
