// アプリケーションサーバーのキー（実際には暗号化は省略するため不要ですが、
// プッシュサービスの仕様上、何らかの値が必要です）
const applicationServerPublicKey = 'BPLzQll6KUvG4KH78lIcqRwxoRNaO426KqHGMRibxFA780JAxsleCwmeO7_qadF-rHigItS7-X8kwslw8stZ0R4';

let isSubscribed = false;
const subscribeButton = document.getElementById('subscribe-button');
const statusDiv = document.getElementById('status');

// Base64文字列をUInt8Arrayに変換する関数（プッシュ通知の仕様で必要）
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// 購読状況を初期化する関数
function initializeSubscription() {
    // プッシュ通知がサポートされているかチェック
    if (!('PushManager' in window)) {
        statusDiv.textContent = 'プッシュ通知はこのブラウザでサポートされていません。';
        subscribeButton.disabled = true;
        return;
    }

    // Service Workerの状態を確認
    navigator.serviceWorker.ready
        .then(serviceWorkerRegistration => {
            // 既存の購読を確認
            serviceWorkerRegistration.pushManager.getSubscription()
                .then(subscription => {
                    isSubscribed = !(subscription === null);
                    updateSubscriptionUI();
                });
        });
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
    const applicationServerKey = urlBase64ToUint8Array(applicationServerPublicKey);
    
    navigator.serviceWorker.ready
        .then(serviceWorkerRegistration => {
            return serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
        })
        .then(subscription => {
            console.log('User is subscribed:', subscription);
            
            // 購読情報をサーバーに送信
            return saveSubscription(subscription);
        })
        .then(() => {
            isSubscribed = true;
            updateSubscriptionUI();
        })
        .catch(error => {
            console.error('Failed to subscribe the user: ', error);
            updateSubscriptionUI();
        });
}

// 購読解除処理を行う関数
function unsubscribeUser() {
    navigator.serviceWorker.ready
        .then(serviceWorkerRegistration => {
            return serviceWorkerRegistration.pushManager.getSubscription();
        })
        .then(subscription => {
            if (subscription) {
                // サーバーから購読を削除
                deleteSubscription(subscription);
                
                // ブラウザから購読を削除
                return subscription.unsubscribe();
            }
        })
        .then(() => {
            isSubscribed = false;
            updateSubscriptionUI();
        })
        .catch(error => {
            console.error('Error unsubscribing', error);
            updateSubscriptionUI();
        });
}

// 購読情報をサーバーに保存する関数
function saveSubscription(subscription) {
    // ここではGoogle Apps Scriptのウェブアプリケーションとして公開したURLに送信
    const subscriptionJson = subscription.toJSON();
    
    return fetch('https://script.google.com/macros/s/AKfycbxLp0eSFU2q9SsFqpQ7RdP7byjr7ObyzgAEa62A_8yDJgJIhoZoll_WPcKOmTlXZ-PZ/exec', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'subscribe',
            subscription: subscriptionJson
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Bad status code from server.');
        }
        return response.json();
    })
    .then(responseData => {
        if (!(responseData && responseData.success)) {
            throw new Error('Bad response from server.');
        }
    });
}

// 購読情報をサーバーから削除する関数
function deleteSubscription(subscription) {
    const subscriptionJson = subscription.toJSON();
    
    return fetch('YOUR_GAS_WEB_APP_URL', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'unsubscribe',
            subscription: subscriptionJson
        })
    });
}

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
