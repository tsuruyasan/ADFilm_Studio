// ==================================================
// AD filmstudio — Google Apps Script
// Deploy as web app from analogtodigitalfilmstudio@gmail.com
//
// Setup:
// 1. Go to https://script.google.com and create a new project
// 2. Replace the default Code.gs content with this file
// 3. Replace SPREADSHEET_ID with your Google Sheet ID
// 4. Deploy > New deployment > Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the deployment URL and paste it into js/app.js as APPS_SCRIPT_URL
// ==================================================

const SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'Orders';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Write to spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Order ID', 'Date', 'Name', 'Phone', 'Email',
        'Postal Code', 'Address', 'Detail Address',
        'Items', 'Subtotal', 'Shipping', 'Total', 'Payment Status'
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
    }

    const now = new Date();
    const dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

    sheet.appendRow([
      data.orderId,
      dateStr,
      data.name,
      data.phone,
      data.email,
      data.zip,
      data.address,
      data.detailAddress,
      JSON.stringify(data.items),
      data.subtotal,
      data.shipping,
      data.total,
      '미확인'
    ]);

    // Send confirmation email
    sendConfirmationEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendConfirmationEmail(data) {
  const isKo = data.lang === 'ko';

  let itemRows = '';
  data.items.forEach(function(item) {
    let details = item.version;
    if (item.scanTube) details += ' / Scan Tube ' + item.tubeLength;
    if (item.roller) details += ' / Metal Roller';
    if (item.film110) details += ' / 110';
    if (item.filmAPS) details += ' / APS';

    itemRows += '<tr>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + item.name + '<br><span style="color:#888;font-size:12px;">' + details + '</span></td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">₩' + item.price.toLocaleString() + '</td>' +
      '</tr>';
  });

  const subject = '[AD filmstudio] ' + (isKo ? '주문 확인' : 'Order Confirmation') + ' - ' + data.orderId;

  const body = '<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;">' +
    '<h1 style="font-size:24px;border-bottom:2px solid #000;padding-bottom:12px;">AD filmstudio</h1>' +
    '<h2 style="font-size:18px;">' + (isKo ? '주문이 접수되었습니다' : 'Order Confirmed') + '</h2>' +
    '<p><strong>' + (isKo ? '주문번호' : 'Order ID') + ':</strong> ' + data.orderId + '</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:20px 0;">' +
    '<thead><tr style="background:#f5f5f5;"><th style="padding:8px 12px;text-align:left;">' + (isKo ? '상품' : 'Item') + '</th><th style="padding:8px 12px;text-align:right;">' + (isKo ? '가격' : 'Price') + '</th></tr></thead>' +
    '<tbody>' + itemRows + '</tbody>' +
    '<tfoot>' +
    '<tr><td style="padding:8px 12px;">' + (isKo ? '상품 금액' : 'Subtotal') + '</td><td style="padding:8px 12px;text-align:right;">₩' + data.subtotal.toLocaleString() + '</td></tr>' +
    '<tr><td style="padding:8px 12px;">' + (isKo ? '배송비' : 'Shipping') + '</td><td style="padding:8px 12px;text-align:right;">₩' + data.shipping.toLocaleString() + '</td></tr>' +
    '<tr style="font-weight:bold;border-top:2px solid #000;"><td style="padding:12px 12px;">' + (isKo ? '총 결제 금액' : 'Total') + '</td><td style="padding:12px 12px;text-align:right;">₩' + data.total.toLocaleString() + '</td></tr>' +
    '</tfoot></table>' +
    '<div style="border:2px solid #000;padding:20px;margin:20px 0;">' +
    '<h3 style="margin:0 0 8px;">' + (isKo ? '입금 안내' : 'Payment Instructions') + '</h3>' +
    '<p style="font-size:16px;font-weight:600;margin:0 0 8px;">토스뱅크 1002-3677-6269 (가은율)</p>' +
    '<p style="margin:0 0 4px;"><strong>' + (isKo ? '입금 금액' : 'Amount') + ':</strong> ₩' + data.total.toLocaleString() + '</p>' +
    '<p style="color:#888;font-size:13px;margin:8px 0 0;">' + (isKo ? '입금 시 주문번호를 기재해주세요' : 'Please include your Order ID in the transfer memo') + '</p>' +
    '</div>' +
    '<p style="color:#888;">' + (isKo ? '입금 확인 후 발송됩니다. 문의: hello@adfilmstudio.com' : 'Your order will ship after payment is confirmed. Contact: hello@adfilmstudio.com') + '</p>' +
    '</body></html>';

  GmailApp.sendEmail(data.email, subject, '', { htmlBody: body });
}
