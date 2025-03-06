{
    "name": "在庫通知アプリ",
    "short_name": "在庫通知",
    "start_url": "/index.html",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#4285f4",
    "gcm_sender_id": "YOUR_SENDER_ID",
    "icons": [
        {
            "src": "images/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },// Firebase構成オブジェクト
// 注: これはFirebaseコンソールから取得する必要があります
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID", 
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);

// FCMインスタンスを取得
const messaging = firebase.messaging();

let isSubscribed = false;
const subscribeButton = document.getElementById('subscribe-button');
const statusDiv = document.getElementById('status');

// 購読状況を初期化する関数
function initializeSubscription() {
  // プッシュ通知がサポートされているかチェック
  if (!('Notification' in window)) {
    statusDiv.textContent = 'プッシュ通知はこのブラウザでサポートされていません。';
    subscribeButton.disabled = true;
    return;
  }

  // Service Workerの登録
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
        
        // FCMにService Workerを設定
        messaging.useServiceWorker(registration);
        
        // 現在のトークンを取得
        messaging.getToken({ vapidKey: 'YOUR_VAPID_PUBLIC_KEY' })
          .then(token => {
            if (token) {
              isSubscribed = true;
              // トークンをサーバーに送信
              saveTokenToServer(token);
            } else {
              isSubscribed = false;
            }
            updateSubscriptionUI();
          })
          .catch(err => {
            console.log('トークンの取得に失敗しました。', err);
            updateSubscriptionUI();
          });
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
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
function subscribeUser() {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      messaging.getToken({ vapidKey: 'YOUR_VAPID_PUBLIC_KEY' })
        .then(token => {
          // トークンをサーバーに送信
          saveTokenToServer(token);
          isSubscribed = true;
          updateSubscriptionUI();
        })
        .catch(err => {
          console.log('トークンの取得に失敗しました。', err);
        });
    } else {
      console.log('通知の許可が得られませんでした。');
    }
  });
}

// 購読解除処理を行う関数
function unsubscribeUser() {
  messaging.getToken()
    .then(token => {
      // サーバーからトークンを削除
      deleteTokenFromServer(token);
      
      // FCMトークンを削除
      return messaging.deleteToken();
    })
    .then(() => {
      isSubscribed = false;
      updateSubscriptionUI();
    })
    .catch(error => {
      console.error('トークンの削除に失敗しました', error);
    });
}

// トークンをサーバーに保存する関数
function saveTokenToServer(token) {
  // GASのWebアプリケーションURL
  const gasWebAppUrl = 'YOUR_GAS_WEB_APP_URL';
  
  return fetch(gasWebAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'subscribe',
      token: token
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('サーバーからのレスポンスに問題があります。');
    }
    return response.json();
  })
  .then(responseData => {
    if (!(responseData && responseData.success)) {
      throw new Error('サーバーからのレスポンスが不正です。');
    }
    console.log('トークンがサーバーに保存されました。');
  })
  .catch(error => {
    console.error('トークンの保存に失敗しました: ', error);
  });
}

// トークンをサーバーから削除する関数
function deleteTokenFromServer(token) {
  const gasWebAppUrl = 'YOUR_GAS_WEB_APP_URL';
  
  return fetch(gasWebAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'unsubscribe',
      token: token
    })
  })
  .catch(error => {
    console.error('トークンの削除リクエストに失敗しました: ', error);
  });
}

// FCMのフォアグラウンドメッセージを処理
messaging.onMessage((payload) => {
  console.log('Message received:', payload);
  
  // フォアグラウンドでの通知表示（オプション）
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/images/icon-192x192.png',
    data: {
      url: payload.data && payload.data.url ? payload.data.url : '/'
    }
  };

  if (Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(registration => {
      registration.showNotification(notificationTitle, notificationOptions);
    });
  }
});

// クリックイベントのリスナー
subscribeButton.addEventListener('click', () => {
  if (isSubscribed) {
    unsubscribeUser();
  } else {
    subscribeUser();
  }
});

// 初期化
window.addEventListener('load', initializeSubscription);
        {
            "src": "images/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
