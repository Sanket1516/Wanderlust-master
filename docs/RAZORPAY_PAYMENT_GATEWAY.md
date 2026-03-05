# Razorpay Payment Gateway — Implementation Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Flow Diagram](#architecture--flow-diagram)
3. [Prerequisites & Setup](#prerequisites--setup)
4. [Files Modified](#files-modified)
5. [Detailed Code Walkthrough](#detailed-code-walkthrough)
   - [Booking Model](#1-booking-model---modelsbookingjs)
   - [Booking Controller](#2-booking-controller---controllerbookingjs)
   - [Booking Routes](#3-booking-routes---routesbookingjs)
   - [App.js Changes](#4-appjs-changes)
   - [Show Page (Frontend)](#5-show-page---viewslistingsshowejs)
6. [Razorpay Order + Checkout — How It Works](#razorpay-order--checkout--how-it-works)
7. [Signature Verification — How It Works](#signature-verification--how-it-works)
8. [Security Measures](#security-measures)
9. [Edge Cases Handled](#edge-cases-handled)
10. [Testing with Razorpay Test Mode](#testing-with-razorpay-test-mode)
11. [Environment Variables](#environment-variables)
12. [Common Errors & Troubleshooting](#common-errors--troubleshooting)
13. [Future Improvements](#future-improvements)

---

## Overview

Wanderlust uses **Razorpay Checkout** (in-page modal) to process booking payments. When a user clicks "Pay & Book Now" on a listing page, the Razorpay payment modal opens **on the same page** — the user never leaves the site. After successful payment, the frontend sends the payment details to our server, which verifies the cryptographic signature and creates the booking in MongoDB.

**Why Razorpay?**

| Feature | Razorpay | Stripe |
|---|---|---|
| **UPI / Google Pay / PhonePe** | Built-in | Limited in India |
| **Net Banking** | 58+ Indian banks | Limited |
| **User stays on site** | Yes (modal) | No (redirect) |
| **INR support** | Native | Supported |
| **Test mode** | Free, unlimited | Free, unlimited |
| **Indian developer docs** | Excellent | Good |
| **Min transaction** | ₹1 | ₹0.50 |

We chose Razorpay because:
1. **User stays on our page** — the Razorpay modal overlays on top of our site
2. **Indian payment methods** — UPI, wallets, net banking are built-in
3. **Free for test mode** — no charges during development
4. **Simple 3-step flow** — create order → pay → verify signature

---

## Architecture & Flow Diagram

```
User clicks "Pay & Book Now"
        |
        v
JavaScript intercepts form submit (e.preventDefault)
        |
        v
fetch POST /listings/:id/book  (AJAX — JSON request)
        |
        v
+-------------------------------+
| createOrder() handler         |
| 1. Validate dates             |
| 2. Check date overlap         |
| 3. Calculate totalPrice       |
| 4. razorpay.orders.create()   |
| 5. Return JSON to frontend    |
+-------------------------------+
        |
        v
Frontend receives JSON: { order.id, key, amount, ... }
        |
        v
+-------------------------------+
| RAZORPAY CHECKOUT MODAL       |
| (opens on same page)          |
| - Card / UPI / Net Banking    |
| - OTP / 3D Secure if needed   |
| - Wallet options               |
+-------------------------------+
        |
   +---------+---------+
   |                   |
   v                   v
SUCCESS             DISMISSED
   |                   |
   v                   v
handler()           ondismiss()
callback            (button re-enabled,
   |                 no charge)
   v
fetch POST /bookings/verify  (AJAX — JSON request)
        |
        v
+-------------------------------+
| verifyPayment() handler       |
| 1. HMAC SHA256 signature      |
|    verification                |
| 2. Check duplicate order ID   |
| 3. Fetch order notes from     |
|    Razorpay API                |
| 4. Verify guest ID            |
| 5. Create Booking in MongoDB  |
+-------------------------------+
        |
        v
Return JSON: { success: true, redirect: "/bookings" }
        |
        v
Frontend does: window.location.href = "/bookings"
(flash message: "Payment successful!")
```

### Key Difference from Stripe

| | Stripe Checkout | Razorpay Checkout |
|---|---|---|
| Payment UI | User **leaves** our site → goes to stripe.com | Modal **opens on** our site |
| Communication | Server-to-server redirect flow | **AJAX** (fetch) for both steps |
| Verification | Retrieve session from Stripe API | **HMAC SHA256** signature check |
| Data passing | Stripe metadata (stored on session) | Razorpay order **notes** |

---

## Prerequisites & Setup

### 1. Create a Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com) and sign up
2. **No business verification needed** for test mode — you can start immediately

### 2. Get Your API Keys

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Make sure you're in **Test Mode** (toggle at top-left)
3. Go to **Account & Settings** → **API Keys** → **Generate Key**
4. Copy both:
   - **Key ID** (starts with `rzp_test_...`) — public, safe for frontend
   - **Key Secret** — private, server-only

### 3. Add Keys to `.env`

Open `.env` in the project root and replace the placeholders:

```env
RAZORPAY_KEY_ID=rzp_test_ABC123yourKeyId
RAZORPAY_KEY_SECRET=yourKeySecretHere123
```

### 4. Install the Razorpay npm Package

Already installed. If starting fresh:

```bash
npm install razorpay
```

This adds `"razorpay": "^2.9.6"` to `package.json`.

### 5. Start the Server

```bash
node app.js
```

The server reads `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from `.env` via `dotenv` (already configured in `app.js`).

---

## Files Modified

| File | What Changed |
|---|---|
| `models/booking.js` | Added `razorpayOrderId` and `razorpayPaymentId` fields |
| `controller/booking.js` | Complete rewrite — `createOrder` (creates Razorpay order, returns JSON), `verifyPayment` (HMAC verification, creates booking) |
| `routes/booking.js` | Changed to `POST /listings/:id/book` → `createOrder`, added `POST /bookings/verify` |
| `app.js` | Added `express.json()` middleware for parsing AJAX JSON requests |
| `views/listings/show.ejs` | Added Razorpay Checkout SDK `<script>`, replaced form submit with AJAX flow, button shows loading spinner |
| `.env` | Replaced `STRIPE_SECRET_KEY` with `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` |
| `package.json` | Replaced `stripe` with `razorpay` dependency |

---

## Detailed Code Walkthrough

### 1. Booking Model — `models/booking.js`

```js
const bookingSchema = new Schema({
    listing:      { type: Schema.Types.ObjectId, ref: "listing", required: true },
    guest:        { type: Schema.Types.ObjectId, ref: "User", required: true },
    checkIn:      { type: Date, required: true },
    checkOut:     { type: Date, required: true },
    totalNights:  { type: Number, required: true, min: 1 },
    totalPrice:   { type: Number, required: true, min: 0 },

    // Razorpay fields — link our booking to the Razorpay payment
    razorpayOrderId:   { type: String },  // e.g., "order_P1234abcdef"
    razorpayPaymentId: { type: String },  // e.g., "pay_P5678ghijkl"

    status:    { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    createdAt: { type: Date, default: Date.now }
});
```

**Why two fields?**

| Field | What It Is | Why We Store It |
|---|---|---|
| `razorpayOrderId` | The Razorpay Order ID (created before payment) | **Idempotency guard** — prevents duplicate bookings if `verifyPayment` is called twice |
| `razorpayPaymentId` | The Razorpay Payment ID (created after payment succeeds) | Links to the actual payment in Razorpay Dashboard. Needed for refunds |

---

### 2. Booking Controller — `controller/booking.js`

This is the core of the implementation. Four functions:

#### a) Initialization

```js
const Razorpay = require("razorpay");
const crypto = require("crypto");        // Node.js built-in — for HMAC signature verification

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

The Razorpay SDK is initialized once with both keys. `crypto` is a **built-in Node.js module** — no extra install needed.

---

#### b) `createOrder` — Creates Razorpay Order (AJAX endpoint)

```js
module.exports.createOrder = async (req, res) => {
```

**This endpoint returns JSON** (not a page redirect) because the frontend calls it via `fetch()`.

**Step-by-step breakdown:**

**1. Find the listing and validate dates:**
```js
const listing = await Listing.findById(req.params.id);
const { checkIn, checkOut } = req.body;       // JSON body (not form-encoded)
const checkInDate = new Date(checkIn);
const checkOutDate = new Date(checkOut);
```
Note: `req.body` contains `{ checkIn, checkOut }` as plain JSON because the frontend sends `Content-Type: application/json`. This is why `express.json()` middleware was added to `app.js`.

**2. Check for overlapping bookings:**
```js
const overlap = await Booking.findOne({
    listing: listing._id,
    status: "confirmed",
    checkIn:  { $lt: checkOutDate },
    checkOut: { $gt: checkInDate }
});
```

**3. Calculate price (server-side only):**
```js
const totalNights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
const totalPrice = totalNights * listing.price;
```

**4. Create the Razorpay Order:**
```js
const order = await razorpay.orders.create({
    amount: totalPrice * 100,           // ₹5000 → 500000 paise
    currency: "INR",
    receipt: `booking_${listing._id}_${Date.now()}`,
    notes: {
        listingId: listing._id.toString(),
        guestId: req.user._id.toString(),
        checkIn, checkOut,
        totalNights: totalNights.toString(),
        totalPrice: totalPrice.toString()
    }
});
```

| Parameter | Explanation |
|---|---|
| `amount` | In **paise** (smallest currency unit). ₹5000 = 500000 paise |
| `currency` | `"INR"` — Indian Rupees |
| `receipt` | Unique identifier for our records (internal reference) |
| `notes` | Key-value pairs stored on the order. We retrieve these during verification to create the booking without trusting frontend data |

**5. Return JSON to frontend:**
```js
res.json({
    success: true,
    order: { id: order.id, amount: order.amount, currency: order.currency },
    key: process.env.RAZORPAY_KEY_ID,        // Public key — safe for frontend
    listing: { title: listing.title, image: listing.image.url },
    user: { name: req.user.username, email: req.user.email },
    booking: { checkIn, checkOut, totalNights, totalPrice }
});
```

The `key` (Key ID) is intentionally sent to the frontend — it's a **public key**, not the secret. Razorpay requires it to open the checkout modal.

---

#### c) `verifyPayment` — Verifies Signature and Creates Booking (AJAX endpoint)

```js
module.exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
```

**Step-by-step breakdown:**

**1. Verify the HMAC SHA256 signature:**
```js
const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed." });
}
```
This is the **most critical security step**. See [Signature Verification](#signature-verification--how-it-works) for a detailed explanation.

**2. Duplicate check:**
```js
const existingBooking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
if (existingBooking) {
    return res.json({ success: true, redirect: "/bookings", message: "Booking already confirmed!" });
}
```

**3. Fetch order from Razorpay to get booking data from notes:**
```js
const order = await razorpay.orders.fetch(razorpay_order_id);
const { listingId, guestId, checkIn, checkOut, totalNights, totalPrice } = order.notes;
```
We deliberately fetch booking details from **Razorpay's server** (where we stored them in `notes`), NOT from the frontend request. This way, even if someone tampers with the frontend, the booking data comes from our originally stored values.

**4. Verify user and create booking:**
```js
if (guestId !== req.user._id.toString()) {
    return res.status(403).json({ error: "Unauthorized." });
}

const booking = new Booking({
    listing: listingId,
    guest: guestId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    totalNights: Number(totalNights),
    totalPrice: Number(totalPrice),
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    status: "confirmed"
});
await booking.save();

req.flash("success", "Payment successful! Booking confirmed...");
res.json({ success: true, redirect: "/bookings" });
```

---

#### d) `renderMyBookings` and `cancelBooking`

These functions remain unchanged. They work the same regardless of payment gateway.

---

### 3. Booking Routes — `routes/booking.js`

```js
// GET  /bookings           → My Bookings page
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.renderMyBookings));

// POST /listings/:id/book  → Create Razorpay Order (AJAX, returns JSON)
router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createOrder));

// POST /bookings/verify    → Verify payment signature + create booking (AJAX, returns JSON)
router.post("/bookings/verify", isLoggedIn, wrapAsync(bookingController.verifyPayment));

// DELETE /bookings/:id     → Cancel a booking
router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.cancelBooking));
```

All routes require `isLoggedIn`. The two POST routes return **JSON responses** (not HTML) since they're called via `fetch()`.

---

### 4. App.js Changes

**Added:**
```js
app.use(express.json());
```
Right after `express.urlencoded()`. This allows Express to parse `Content-Type: application/json` request bodies. Without this, `req.body` would be `undefined` for our AJAX requests.

---

### 5. Show Page — `views/listings/show.ejs`

The frontend script handles the entire Razorpay flow in 3 steps:

**1. Razorpay Checkout SDK loaded:**
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**2. Form submit intercepted — creates order via AJAX:**
```js
bookingForm.addEventListener("submit", async function(e) {
    e.preventDefault();   // Stop normal form POST

    // Disable button, show spinner
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Processing...';

    // AJAX call to create Razorpay Order
    const res = await fetch("/listings/" + listingId + "/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn: "2025-03-15", checkOut: "2025-03-18" })
    });
    const data = await res.json();
```

**3. Razorpay modal opened with order details:**
```js
    const options = {
        key: data.key,                    // Our Razorpay Key ID (public)
        amount: data.order.amount,         // In paise
        currency: data.order.currency,     // "INR"
        name: "Wanderlust",               // Displayed in the modal header
        description: "3 nights — Beach Villa",
        image: data.listing.image,         // Listing image shown in modal
        order_id: data.order.id,           // Razorpay Order ID

        handler: async function(response) {
            // Called ONLY on successful payment
            // response.razorpay_order_id
            // response.razorpay_payment_id
            // response.razorpay_signature
            // → Send to /bookings/verify
        },

        prefill: { name: "username", email: "user@email.com" },
        theme: { color: "#fe424d" },       // Wanderlust accent color

        modal: {
            ondismiss: function() {
                // User closed modal without paying → re-enable button
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();  // Opens the payment modal
```

**4. After payment succeeds — verify on server:**
```js
    handler: async function(response) {
        const verifyRes = await fetch("/bookings/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
            })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
            window.location.href = verifyData.redirect;  // → /bookings
        }
    }
```

---

## Razorpay Order + Checkout — How It Works

### What is a Razorpay "Order"?

A Razorpay Order is a server-side object that represents "intent to collect payment". It's created via the Razorpay SDK **before** the user pays.

Think of it like a restaurant check — the waiter writes the bill (Order) first, then the customer pays it.

```
Order Created (server)  →  Payment Made (user)  →  Payment Verified (server)
  order_P1234abcdef         pay_P5678ghijkl         booking saved to DB
```

### Order vs Payment

| | Order | Payment |
|---|---|---|
| **When created** | Before payment (by our server) | After payment (by Razorpay) |
| **Who creates it** | Our backend via SDK | Razorpay when card/UPI succeeds |
| **ID format** | `order_...` | `pay_...` |
| **Status** | starts as `created` → becomes `paid` | `captured` / `failed` |
| **Contains** | amount, currency, notes | card/UPI details, order_id reference |

### Order Notes

We store booking details in the order's `notes` field:

```js
notes: {
    listingId:   "6789abc...",
    guestId:     "1234def...",
    checkIn:     "2025-03-15",
    checkOut:    "2025-03-18",
    totalNights: "3",
    totalPrice:  "15000"
}
```

**Why notes?** Because the frontend Razorpay modal only returns `order_id`, `payment_id`, and `signature`. We can't pass custom booking data through the modal. So we attach it to the order as `notes` on creation, then retrieve it during verification via `razorpay.orders.fetch()`.

---

## Signature Verification — How It Works

This is the **most important security step**. It proves the payment actually happened and wasn't fabricated.

### The Problem

After payment, the Razorpay modal gives our frontend:
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`

The frontend sends these to `/bookings/verify`. But **anyone could fake these values** with curl or Postman. We need to verify they're legitimate.

### The Solution: HMAC SHA256

Razorpay creates the signature using:
```
signature = HMAC-SHA256(order_id + "|" + payment_id, your_key_secret)
```

We recreate the same computation on our server:
```js
const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

if (expectedSignature !== razorpay_signature) {
    // FAKE — reject!
}
```

### Why This Works

1. Only Razorpay and our server know the `RAZORPAY_KEY_SECRET`
2. Razorpay uses it to create the signature
3. We use the same secret to recreate the signature
4. If they match → the payment is real
5. An attacker can't forge the signature without the secret key

### Visual Explanation

```
Razorpay's side:                    Our side:
HMAC("order_123|pay_456", secret)   HMAC("order_123|pay_456", secret)
         ↓                                   ↓
  "a1b2c3d4e5..."                     "a1b2c3d4e5..."
         ↓                                   ↓
  Sent to frontend                    Computed on server
         ↓                                   ↓
              Do they match?  ✓ YES → Payment is real!
```

---

## Security Measures

| Measure | Where | Why |
|---|---|---|
| **HMAC SHA256 signature verification** | `verifyPayment` | Proves payment is real, not fabricated |
| **Server-side price calculation** | `createOrder` | Never trust client-side price. We compute `totalNights * listing.price` on the server |
| **Booking data from order notes** | `verifyPayment` | Booking details fetched from Razorpay API (server-side), not from frontend request |
| **`isLoggedIn` middleware** | All routes | Only authenticated users can book |
| **Guest ID verification** | `verifyPayment` | Ensures logged-in user matches the payment initiator |
| **Duplicate booking guard** | `verifyPayment` | `razorpayOrderId` uniqueness check prevents double-booking |
| **Date overlap check** | `createOrder` | Prevents double-booking the same dates on the same listing |
| **Secret key in `.env`** | `controller/booking.js` | Secret never committed to Git or exposed to frontend |
| **Key ID is public** | `show.ejs` | Only the Key ID (public) goes to frontend. The Key Secret stays on the server |
| **Card data isolation** | Razorpay Checkout | Card/UPI/bank details handled entirely by Razorpay's modal — never touches our server |

---

## Edge Cases Handled

| Scenario | What Happens |
|---|---|
| **User closes Razorpay modal** | `ondismiss` callback re-enables the button. No payment, no booking |
| **User double-clicks "Pay & Book Now"** | Button is disabled immediately on first click (shows spinner) |
| **`verifyPayment` called twice** (race condition) | `razorpayOrderId` duplicate check prevents second booking |
| **Fake signature sent to `/bookings/verify`** | HMAC check fails → returns 400 error |
| **User A sends User B's payment details** | `guestId` check rejects with 403 |
| **Past check-in date** | Server-side validation in `createOrder` rejects with 400 |
| **Overlapping dates** | Overlap query in `createOrder` rejects with 409 |
| **Check-out before check-in** | Server-side validation rejects |
| **Card declined / payment fails** | Razorpay shows error in modal. User can retry. `handler` is never called |
| **Network error during AJAX** | `catch` block shows alert, re-enables button |
| **Session expired during payment** | `isLoggedIn` middleware on verify route redirects to login |
| **Listing deleted between order creation and payment** | Booking is still created (listing ID stored in notes). Shows as deleted listing in My Bookings |

---

## Testing with Razorpay Test Mode

### Test Card Numbers

Razorpay provides test credentials that work in test mode:

**Card Payments:**

| Card Number | Name | Expiry | CVV | Result |
|---|---|---|---|---|
| `4111 1111 1111 1111` | Any name | Any future date | Any 3 digits | **Success** |
| `5267 3181 8797 5449` | Any name | Any future date | Any 3 digits | **Success** (Mastercard) |

**UPI (Test Mode):**
- Enter any UPI ID like `success@razorpay` — auto-succeeds in test mode

**Net Banking (Test Mode):**
- Select any bank → automatically succeeds in test mode

### Testing Steps

1. Make sure `.env` has your actual Razorpay test keys:
   ```
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```
2. Start the server: `node app.js`
3. Log in to the app
4. Go to any listing's show page
5. Select check-in and check-out dates
6. Click "Pay & Book Now" — button shows "Processing..."
7. Razorpay modal opens on the same page
8. Enter test card `4111 1111 1111 1111`, any name, any future expiry, any CVV
9. Click "Pay" in the modal
10. Button shows "Confirming booking..."
11. You should be redirected to `/bookings` with a success flash message
12. The booking should appear in "My Bookings"

### Viewing Payments in Razorpay Dashboard

After a test payment:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/app/transactions/payments) (in Test Mode)
2. You'll see the payment with amount, status, and payment method
3. Click on a payment → **Notes** tab shows your booking metadata (listingId, guestId, dates, price)

---

## Environment Variables

| Variable | Required | Example | Exposed to Frontend? |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | Yes | `rzp_test_ABC123...` | Yes (it's a public key) |
| `RAZORPAY_KEY_SECRET` | Yes | `secret_XYZ789...` | **NEVER** |

**Where they're used:**
- `controller/booking.js` line 7-10: Razorpay SDK initialization
- `controller/booking.js` line 77: Key ID sent to frontend in JSON response
- `controller/booking.js` line 104: Key Secret used for HMAC signature verification

**Where they're loaded:**
- `app.js` line 4: `require("dotenv").config()` loads all `.env` variables into `process.env`

**Key ID vs Key Secret:**

| | Key ID (`rzp_test_...`) | Key Secret |
|---|---|---|
| **Purpose** | Identifies your Razorpay account | Signs/verifies payment signatures |
| **Visibility** | Public — sent to frontend | **Private — server-only** |
| **If leaked** | They know your account ID (no harm) | They could forge payment signatures (critical!) |

---

## Common Errors & Troubleshooting

### 1. "The api key/secret provided is invalid"
```
Error: The api key/secret provided is invalid
```
**Cause:** Placeholder values still in `.env`.
**Fix:** Replace `rzp_test_YOUR_KEY_ID_HERE` and `YOUR_KEY_SECRET_HERE` with your actual keys from the Razorpay Dashboard.

### 2. "SyntaxError: Unexpected token < in JSON"
**Cause:** The AJAX `fetch` received an HTML page instead of JSON. Usually means the user is logged out (Express returned the login page).
**Fix:** Ensure `isLoggedIn` middleware is working and the user's session hasn't expired.

### 3. "req.body is undefined" in createOrder or verifyPayment
**Cause:** `express.json()` middleware is missing from `app.js`.
**Fix:** Add `app.use(express.json());` right after `app.use(express.urlencoded({ extended: true }));`.

### 4. "Payment verification failed. Invalid signature."
**Cause:** The HMAC signature doesn't match. Either:
- Wrong `RAZORPAY_KEY_SECRET` in `.env`
- The `razorpay_order_id` or `razorpay_payment_id` was tampered with
**Fix:** Double-check your Key Secret. In test mode, ensure you're using test keys (not live keys).

### 5. Razorpay modal doesn't open
**Cause:** The Razorpay Checkout SDK script didn't load, or the `createOrder` request failed.
**Fix:**
- Check browser console for errors
- Verify `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` is present
- Check that the server returned valid JSON from `/listings/:id/book`

### 6. "Amount must be atleast 100 (i.e., ₹1)"
**Cause:** Razorpay requires a minimum order amount of 100 paise (₹1).
**Fix:** Ensure all listings have a price of at least ₹1.

---

## Future Improvements

### 1. Razorpay Webhooks
Instead of relying only on the frontend `handler` callback, add a webhook endpoint. Razorpay will POST to your server when payment status changes — even if the user closed their browser.

```js
// routes/booking.js
router.post("/bookings/webhook", express.raw({ type: "application/json" }), wrapAsync(bookingController.handleWebhook));
```

### 2. Automatic Refunds on Cancellation
Currently `cancelBooking` only marks `status: "cancelled"`. To issue a refund:
```js
if (booking.razorpayPaymentId) {
    await razorpay.payments.refund(booking.razorpayPaymentId, {
        amount: booking.totalPrice * 100  // full refund in paise
    });
}
```

### 3. UPI Intent (Mobile)
For mobile users, Razorpay can open UPI apps (Google Pay, PhonePe) directly. This is handled automatically by the Razorpay Checkout modal on mobile browsers.

### 4. Email Receipts
Send a receipt email after payment by adding `customer.email` to the order:
```js
const order = await razorpay.orders.create({
    ...
    customer: { email: req.user.email }
});
```

### 5. Partial Refunds
For cancellations close to the check-in date, issue a partial refund:
```js
await razorpay.payments.refund(paymentId, {
    amount: partialAmount * 100
});
```

---

## Summary

The payment flow is:

1. **User clicks "Pay & Book Now"** → JavaScript intercepts the form submit
2. **AJAX POST** to server → validates dates, creates Razorpay Order, returns JSON
3. **Razorpay modal opens** on the same page (card / UPI / net banking / wallets)
4. **User pays** → Razorpay modal calls our `handler` with order_id, payment_id, signature
5. **AJAX POST** to `/bookings/verify` → server verifies HMAC signature
6. **Booking created** in MongoDB → user redirected to My Bookings page

This approach ensures that:
- **User never leaves the site** — Razorpay modal overlays on the page
- **Card/UPI data never touches our server** — handled entirely by Razorpay
- **Payments are cryptographically verified** — HMAC SHA256 signature check
- **Bookings are only created after verification** — no orphan bookings
- **Duplicate bookings are prevented** — `razorpayOrderId` uniqueness check
- **Indian payment methods (UPI, wallets, net banking)** are all supported
