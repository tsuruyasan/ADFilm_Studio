# Checkout Page Design Spec

## Overview

Add a checkout flow to the ADFilm Studio SPA. Customers complete an order form with name, phone, email, and Korean address (via Daum Postcode API). Orders are logged to a Google Sheet and a confirmation email is sent, both via a Google Apps Script web app. Payment is bank transfer — the confirmation displays account info for the customer to send money, and the sheet has a status column for manual verification.

## User Flow

1. Cart sidebar gains a "주문하기" button (visible when cart is non-empty)
2. Button navigates to `page-checkout` (new SPA page, nav not highlighted)
3. Checkout page shows: order form (left) + order summary (right)
4. User fills in required fields: name, phone, email, address
5. Address is entered via Daum Postcode API popup (fills postal code + base address), plus a manual detail address field
6. Order summary lists cart items, subtotal, shipping (₩4,000), and total
7. "주문 제출" button POSTs to Google Apps Script
8. On success, page shows confirmation view with order ID, bank transfer info, and total
9. Cart is cleared after successful submission

## Checkout Page Layout

Two-column grid (stacks on mobile):
- **Left**: Order form fields
- **Right**: Order summary (sticky on desktop, like the product configurator pattern)

### Form Fields

| Field | Element | Validation | i18n keys |
|-------|---------|------------|-----------|
| 이름 | text input | required | checkout_name |
| 전화번호 | tel input | required, pattern `01[016789]-?\d{3,4}-?\d{4}` | checkout_phone |
| 이메일 | email input | required, valid email | checkout_email |
| 우편번호 | text input (readonly) + search button | required, filled by Daum API | checkout_zip, checkout_zip_search |
| 주소 | text input (readonly) | required, filled by Daum API | checkout_address |
| 상세주소 | text input | required | checkout_detail_address |

### Order Summary

- List of cart items (name, version/options, price)
- Subtotal line
- Shipping: ₩4,000
- Total (bold)
- "주문 제출" submit button

## Address Lookup

Daum Postcode API (Kakao):
- Script: `//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js`
- No API key required
- Opens a popup overlay. On complete, fills postal code (`zonecode`) and base address (`roadAddress` or `jibunAddress`)
- User manually types detail address (apartment/unit number etc.)

## Order ID Format

`AD-YYYYMMDD-HHmmss` generated client-side from submission timestamp. Example: `AD-20260426-143022`.

## Google Apps Script

Single script deployed as web app from `analogtodigitalfilmstudio@gmail.com`.

### `doPost(e)` handler

1. Parse JSON body from `e.postData.contents`
2. Open spreadsheet by ID (hardcoded after creation)
3. Append row: `[orderId, date, name, phone, email, zip, address, detailAddress, itemsJSON, subtotal, 4000, total, "미확인"]`
4. Send confirmation email via `GmailApp.sendEmail()` to customer email
5. Return `ContentService.createTextOutput(JSON.stringify({success: true}))` with MIME type JSON

### Deployment

- Execute as: me (analogtodigitalfilmstudio@gmail.com)
- Access: Anyone (even anonymous)
- Returns a URL like `https://script.google.com/macros/s/.../exec`

## Confirmation Email

- From: analogtodigitalfilmstudio@gmail.com
- To: customer's email
- Subject: `[AD filmstudio] 주문 확인 - {orderId}`
- HTML body containing:
  - Order ID
  - Ordered items with options and prices
  - Subtotal, shipping, total
  - Bank transfer instructions: 토스뱅크 / 가은율 / 1002-3677-6269
  - Note: include order ID in transfer memo (입금자명에 주문번호 기재)
  - Contact info for questions

## Google Sheet Columns

| Column | Content |
|--------|---------|
| A | Order ID |
| B | Date (YYYY-MM-DD HH:mm) |
| C | Name |
| D | Phone |
| E | Email |
| F | Postal Code |
| G | Address |
| H | Detail Address |
| I | Items (JSON string) |
| J | Subtotal |
| K | Shipping |
| L | Total |
| M | Payment Status ("미확인" default) |

## Confirmation View (post-submission)

Replaces the checkout form on success. Shows:
- Check/success icon
- "주문이 접수되었습니다" heading
- Order ID
- Bank transfer box: 토스뱅크 가은율 1002-3677-6269 with total amount
- "입금 확인 후 발송됩니다" message
- Button to return to shop

## i18n

All new user-facing strings get `data-i18n` attributes with entries in both `ko` and `en` translation objects. Key prefix: `checkout_*` for form labels, `confirm_*` for confirmation view.

## Error Handling

- Client-side validation before submission (required fields, email/phone format)
- If Apps Script POST fails: show error toast, keep form data intact so user can retry
- No loading spinner needed beyond disabling the submit button during the request

## Files Modified

- `index.html` — add checkout section, Daum Postcode script tag, checkout button in cart
- `css/style.css` — checkout page styles
- `js/app.js` — checkout logic, form handling, Apps Script POST, confirmation view
- `js/i18n.js` — all new KO/EN strings
- New: `docs/apps-script.js` — Google Apps Script code for user to deploy manually

## Out of Scope

- Online payment integration (card, PayPal, etc.)
- Automatic payment verification
- Order tracking/history page
- Account/login system
