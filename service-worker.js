// プッシュ通知の購読情報を保存するスプレッドシート
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // スプレッドシートIDを設定

// Webアプリケーションとしてリクエストを処理
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'subscribe') {
      // 購読情報を保存
      saveSubscription(data.subscription);
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);
    } 
    else if (data.action === 'unsubscribe') {
      // 購読情報を削除
      deleteSubscription(data.subscription);
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 購読情報をスプレッドシートに保存
function saveSubscription(subscription) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Subscriptions') || 
                SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('Subscriptions');
  
  // 既存の同じエンドポイントがあるか確認
  const data = sheet.getDataRange().getValues();
  const endpoint = subscription.endpoint;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === endpoint) {
      // 既に存在する場合は更新
      sheet.getRange(i+1, 2).setValue(JSON.stringify(subscription.keys));
      return;
    }
  }
  
  // 新規追加
  if (data.length <= 1) {
    // ヘッダーがなければ追加
    sheet.getRange(1, 1, 1, 2).setValues([['Endpoint', 'Keys']]);
  }
  
  sheet.appendRow([endpoint, JSON.stringify(subscription.keys)]);
}

// 購読情報をスプレッドシートから削除
function deleteSubscription(subscription) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Subscriptions');
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const endpoint = subscription.endpoint;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === endpoint) {
      sheet.deleteRow(i+1);
      return;
    }
  }
}

// Webページの監視と通知送信（定期実行）
function checkWebPageAndNotify() {
  // ターゲットURLからコンテンツを取得
  const url = 'ターゲットURL'; // 監視したいURLを設定
  const response = UrlFetchApp.fetch(url);
  const content = response.getContentText();
  
  // 在庫状態の確認
  // <img class="dispNone" src="https://d2tfhz5takygeh.cloudfront.net/contents/img/common/icon_no_stock.png" alt=""> があれば在庫あり
  if (content.indexOf('<img class="dispNone" src="https://d2tfhz5takygeh.cloudfront.net/contents/img/common/icon_no_stock.png" alt="">') !== -1) {
    // 在庫があるので通知
    sendPushNotifications('在庫が入荷しました！', url);
    
    // 通知を送信したことを記録（オプション）
    logNotification(url);
  }
}

// すべての購読者に通知を送信
function sendPushNotifications(message, targetUrl) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Subscriptions');
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  
  // ヘッダー行をスキップ
  for (let i = 1; i < data.length; i++) {
    try {
      const endpoint = data[i][0];
      const keys = JSON.parse(data[i][1]);
      
      const subscription = {
        endpoint: endpoint,
        keys: keys
      };
      
      // 暗号化を省略して直接エンドポイントにPOSTリクエストを送信
      sendSimplePushNotification(subscription, {
        title: '在庫通知',
        body: message,
        url: targetUrl
      });
    } catch (error) {
      console.error('通知の送信に失敗しました: ' + error);
    }
  }
}

// 簡略化したプッシュ通知送信（暗号化なし - 動作しない場合あり）
function sendSimplePushNotification(subscription, payload) {
  // 注意: この方法は多くのブラウザで動作しません。実際には暗号化が必要です。
  // デモ用・学習用としてのみ提供しています。
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(subscription.endpoint, options);
    Logger.log('通知送信結果: ' + response.getResponseCode());
    
    // 購読が期限切れの場合は削除
    if (response.getResponseCode() === 404 || response.getResponseCode() === 410) {
      deleteSubscription(subscription);
    }
  } catch (error) {
    Logger.log('通知の送信に失敗しました: ' + error);
  }
}

// 通知送信を記録する関数（オプション）
function logNotification(url) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('NotificationLog') || 
                Sprea
