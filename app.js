// Firebase構成オブジェクト
const firebaseConfig = {
  apiKey: "AIzaSyBSaIIQe9bqF6Mfh2F3vGqvKPmDPrKtQqA",
  authDomain: "docomo-certified-notification.firebaseapp.com",
  projectId: "docomo-certified-notification",
  storageBucket: "docomo-certified-notification.firebasestorage.app",
  messagingSenderId: "716682348648",
  appId: "1:716682348648:web:ea00b080c3c6a56f5c53dd",
  measurementId: "G-11FDW1VMX5"
};

// サイトのベースパス（GitHub Pagesのサブディレクトリ）
const BASE_PATH = '/DCNotificationAPP/';

// VAPIDキー
const VAPID_KEY = 'BFNkceGmuQGI52dOMTsknpnEzV-0wKRvqmpQbBdd08Ik-RBNVKdoDPRZJaJfdJiFUNgMPcd7tXxw-HMRCdDVTAc';

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);

// FCMインスタンスを取得
const messaging = firebase.messaging();

let isSubscribed = false;
const subscribeButton = document.getElementById('subscribe-button');
const statusDiv = document.getElementById('status');

// Service Workerを先に登録してから他の処理を実行
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Service Workerを明示的に登録
      const registration = await navigator.serviceWorker.register(
        `${BASE_PATH}firebase-messaging-sw.js`, 
        { scope: BASE_PATH }
      );
      
      console.log('Service Worker registered: ', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed: ', error);
      throw error;
    }
  } else {
    throw new Error('Service Worker is not supported in this browser');
  }
}

// 購読状況を初期化する関数
async function initializeSubscription() {
  // プッシュ通知がサポートされているかチェック
  if (!('Notification' in window)) {
    statusDiv.textContent = 'プッシュ通知はこのブラウザでサポートされていません。';
    subscribeButton.disabled = true;
    return;
  }

  try {
    // 最初にService Workerを登録
    await registerServiceWorker();
    
    // トークンの取得を試みる
    try {
      const token = await messaging.getToken({ vapidKey: VAPID_KEY });
      
      if (token) {
        isSubscribed = true;
        // トークンをサーバーに送信
        await saveTokenToServer(token);
      } else {
        isSubscribed = false;
      }
    } catch (err) {
      console.log('トークンの取得に失敗しました。', err);
      isSubscribed = false;
    }
    
    updateSubscriptionUI();
  } catch (error) {
    console.error('初期化に失敗しました：', error);
    statusDiv.textContent = '通知の初期化に失敗しました。';
  }
}

// 購読UIを更新する関数
function updateSubscriptionUI() {
  if (isSubscribed) {
    subscribeButton.textContent = '通知を無効にする';
    statusDiv.textContent = '通知が有効になっています！';
  } else {
    subscribeButton.textContent = '通知を有効にする';
    statusDiv.textContent = '通知は現在無効です。';
  }
}

// 購読処理を行う関数
async function subscribeUser() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Service Workerが登録されていることを再確認
      await registerServiceWorker();
      
      const token = await messaging.getToken({ vapidKey: VAPID_KEY });
      
      if (token) {
        // トークンをサーバーに送信
        await saveTokenToServer(token);
        isSubscribed = true;
        updateSubscriptionUI();
      } else {
        throw new Error('トークンが取得できませんでした');
      }
    } else {
      console.log('通知の許可が得られませんでした。');
      statusDiv.textContent = '通知を有効にするには、通知の許可が必要です。';
    }
  } catch (err) {
    console.error('購読処理中にエラーが発生しました:', err);
    status
