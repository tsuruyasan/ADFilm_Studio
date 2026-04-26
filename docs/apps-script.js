// ==================================================
// AD filmstudio — Google Apps Script (Secured)
// Deploy as web app from analogtodigitalfilmstudio@gmail.com
//
// Setup:
// 1. Go to https://script.google.com and create a new project
// 2. Replace the default Code.gs content with this file
// 3. Replace SPREADSHEET_ID with your Google Sheet ID
// 4. Deploy > Manage deployments > Edit (pencil icon)
//    - Version: New version
//    - Execute as: Me
//    - Who has access: Anyone
//    - Click Deploy
// 5. Copy the deployment URL and paste it into js/app.js as APPS_SCRIPT_URL
//
// IMPORTANT: Every time you edit this script, you must create a
// NEW VERSION via Deploy > Manage deployments > Edit > Version: New version
// ==================================================

var SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';
var SHEET_NAME = 'Orders';
var ORDER_TOKEN = 'adf1lm_2026_s3cure_t0ken';
var RATE_LIMIT_SECONDS = 30;

// ---- Product catalog (server-side source of truth) ----
var PRODUCTS = {
  small: {
    basePrice: 45000,
    glassPrice: 65000,
    tubePrice: 15000,
    rollerPrice: 8000,
    price110: 0,
    priceAPS: 0,
    allow110: false,
    allowAPS: false,
  },
  medium: {
    basePrice: 55000,
    glassPrice: 78000,
    tubePrice: 18000,
    rollerPrice: 10000,
    price110: 0,
    priceAPS: 0,
    allow110: false,
    allowAPS: false,
  },
  multi: {
    basePrice: 75000,
    glassPrice: 98000,
    tubePrice: 20000,
    rollerPrice: 12000,
    price110: 8000,
    priceAPS: 8000,
    allow110: true,
    allowAPS: true,
  },
};

var SHIPPING_FEE = 4000;

// ---- Price calculation (server-side, tamper-proof) ----
function calculatePrice(productKey, item) {
  var prod = PRODUCTS[productKey];
  if (!prod) return -1;

  var price = item.isGlass ? prod.glassPrice : prod.basePrice;

  if (item.scanTube) {
    price += prod.tubePrice;
    var tubeVal = parseInt(item.tubeLengthVal) || 100;
    // Clamp to valid range
    tubeVal = Math.max(50, Math.min(200, tubeVal));
    var extraLength = Math.max(0, tubeVal - 100);
    price += Math.floor(extraLength / 10) * 1000;
  }

  if (item.roller) price += prod.rollerPrice;
  if (prod.allow110 && item.film110) price += prod.price110;
  if (prod.allowAPS && item.filmAPS) price += prod.priceAPS;

  return price;
}

// ---- Rate limiting ----
function isRateLimited(email) {
  var cache = CacheService.getScriptCache();
  var key = 'rate_' + email.toLowerCase().trim();
  if (cache.get(key)) return true;
  cache.put(key, 'true', RATE_LIMIT_SECONDS);
  return false;
}

// ---- Endpoints ----

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Token validation
    if (data.token !== ORDER_TOKEN) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }

    // Basic field validation
    if (!data.name || !data.phone || !data.email || !data.zip || !data.address || !data.detailAddress) {
      return jsonResponse({ success: false, error: 'Missing required fields' });
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return jsonResponse({ success: false, error: 'No items in order' });
    }

    if (data.items.length > 20) {
      return jsonResponse({ success: false, error: 'Too many items' });
    }

    // Rate limiting by email
    if (isRateLimited(data.email)) {
      return jsonResponse({ success: false, error: 'Please wait before placing another order' });
    }

    // Server-side price calculation
    var subtotal = 0;
    var validatedItems = [];

    for (var i = 0; i < data.items.length; i++) {
      var item = data.items[i];
      var productKey = item.productKey;

      if (!PRODUCTS[productKey]) {
        return jsonResponse({ success: false, error: 'Invalid product: ' + productKey });
      }

      var price = calculatePrice(productKey, item);
      subtotal += price;

      validatedItems.push({
        name: String(item.name || '').substring(0, 100),
        productKey: productKey,
        version: item.isGlass ? 'Glass' : 'Standard',
        scanTube: !!item.scanTube,
        tubeLength: item.scanTube ? (parseInt(item.tubeLengthVal) || 100) + 'mm' : null,
        adapterSize: item.scanTube ? (item.adapterSize || '52mm') : null,
        roller: !!item.roller,
        film110: !!item.film110,
        filmAPS: !!item.filmAPS,
        price: price,
      });
    }

    var total = subtotal + SHIPPING_FEE;

    // Sanitize string fields
    var sanitized = {
      orderId: String(data.orderId || '').substring(0, 30),
      name: String(data.name).substring(0, 100),
      phone: String(data.phone).substring(0, 20),
      email: String(data.email).substring(0, 100),
      zip: String(data.zip).substring(0, 10),
      address: String(data.address).substring(0, 200),
      detailAddress: String(data.detailAddress).substring(0, 200),
      lang: data.lang === 'en' ? 'en' : 'ko',
    };

    // Write to spreadsheet
    writeToSheet(sanitized, validatedItems, subtotal, total);

    // Send confirmation email with server-calculated prices
    sendConfirmationEmail(sanitized, validatedItems, subtotal, total);

    return jsonResponse({ success: true });

  } catch (error) {
    Logger.log('doPost error: ' + error.message + '\n' + error.stack);
    return jsonResponse({ success: false, error: 'Server error' });
  }
}

function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'AD filmstudio order API is running' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Spreadsheet ----
function writeToSheet(data, items, subtotal, total) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Order ID', 'Date', 'Name', 'Phone', 'Email',
      'Postal Code', 'Address', 'Detail Address',
      'Items', 'Subtotal', 'Shipping', 'Total', 'Payment Status'
    ]);
    sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
  }

  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

  sheet.appendRow([
    data.orderId,
    dateStr,
    data.name,
    data.phone,
    data.email,
    data.zip,
    data.address,
    data.detailAddress,
    JSON.stringify(items),
    subtotal,
    SHIPPING_FEE,
    total,
    '미확인'
  ]);
}

// ---- Confirmation Email ----
function sendConfirmationEmail(data, items, subtotal, total) {
  var isKo = data.lang === 'ko';

  var itemRows = '';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var details = item.version;
    if (item.scanTube) details += ' / Scan Tube ' + item.tubeLength;
    if (item.roller) details += ' / Metal Roller';
    if (item.film110) details += ' / 110';
    if (item.filmAPS) details += ' / APS';

    itemRows += '<tr>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + escapeHtml(item.name) + '<br><span style="color:#888;font-size:12px;">' + escapeHtml(details) + '</span></td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">₩' + item.price.toLocaleString() + '</td>' +
      '</tr>';
  }

  var subject = '[AD filmstudio] ' + (isKo ? '주문 확인' : 'Order Confirmation') + ' - ' + escapeHtml(data.orderId);

  var body = '<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;">' +
    '<h1 style="font-size:24px;border-bottom:2px solid #000;padding-bottom:12px;">AD filmstudio</h1>' +
    '<h2 style="font-size:18px;">' + (isKo ? '주문이 접수되었습니다' : 'Order Confirmed') + '</h2>' +
    '<p><strong>' + (isKo ? '주문번호' : 'Order ID') + ':</strong> ' + escapeHtml(data.orderId) + '</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:20px 0;">' +
    '<thead><tr style="background:#f5f5f5;"><th style="padding:8px 12px;text-align:left;">' + (isKo ? '상품' : 'Item') + '</th><th style="padding:8px 12px;text-align:right;">' + (isKo ? '가격' : 'Price') + '</th></tr></thead>' +
    '<tbody>' + itemRows + '</tbody>' +
    '<tfoot>' +
    '<tr><td style="padding:8px 12px;">' + (isKo ? '상품 금액' : 'Subtotal') + '</td><td style="padding:8px 12px;text-align:right;">₩' + subtotal.toLocaleString() + '</td></tr>' +
    '<tr><td style="padding:8px 12px;">' + (isKo ? '배송비' : 'Shipping') + '</td><td style="padding:8px 12px;text-align:right;">₩' + SHIPPING_FEE.toLocaleString() + '</td></tr>' +
    '<tr style="font-weight:bold;border-top:2px solid #000;"><td style="padding:12px 12px;">' + (isKo ? '총 결제 금액' : 'Total') + '</td><td style="padding:12px 12px;text-align:right;">₩' + total.toLocaleString() + '</td></tr>' +
    '</tfoot></table>' +
    '<div style="border:2px solid #000;padding:20px;margin:20px 0;">' +
    '<h3 style="margin:0 0 8px;">' + (isKo ? '입금 안내' : 'Payment Instructions') + '</h3>' +
    '<p style="font-size:16px;font-weight:600;margin:0 0 8px;">토스뱅크 1002-3677-6269 (가은율)</p>' +
    '<p style="margin:0 0 4px;"><strong>' + (isKo ? '입금 금액' : 'Amount') + ':</strong> ₩' + total.toLocaleString() + '</p>' +
    '<p style="color:#888;font-size:13px;margin:8px 0 0;">' + (isKo ? '입금 시 주문번호를 기재해주세요' : 'Please include your Order ID in the transfer memo') + '</p>' +
    '</div>' +
    '<p style="color:#888;">' + (isKo ? '입금 확인 후 발송됩니다. 문의: hello@adfilmstudio.com' : 'Your order will ship after payment is confirmed. Contact: hello@adfilmstudio.com') + '</p>' +
    '</body></html>';

  GmailApp.sendEmail(data.email, subject, '', { htmlBody: body });
}

// ---- HTML escaping for email content ----
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
