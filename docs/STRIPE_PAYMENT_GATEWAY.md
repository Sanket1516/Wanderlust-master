# Stripe Payment Gateway — Implementation Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Flow Diagram](#architecture--flow-diagram)
3. [Prerequisites & Setup](#prerequisites--setup)
4. [Files Modified / Created](#files-modified--created)
5. [Detailed Code Walkthrough](#detailed-code-walkthrough)
   - [Booking Model](#1-booking-model---modelsbookingjs)
   - [Booking Controller](#2-booking-controller---controllerbookingjs)
   - [Booking Routes](#3-booking-routes---routesbookingjs)
   - [Show Page (Frontend)](#4-show-page---viewslistingsshowejs)
6. [Stripe Checkout Session — How It Works](#stripe-checkout-session--how-it-works)
7. [Security Measures](#security-measures)
8. [Edge Cases Handled](#edge-cases-handled)
9. [Testing with Stripe Test Mode](#testing-with-stripe-test-mode)
10. [Environment Variables](#environment-variables)
11. [Common Errors & Troubleshooting](#common-errors--troubleshooting)
12. [Future Improvements](#future-improvements)

---

## Overview

Wanderlust uses **Stripe Checkout** (hosted payment page) to process booking payments. When a user clicks "Pay & Book Now" on a listing page, they are redirected to a Stripe-hosted payment form. After successful payment, Stripe redirects back to our app, where we verify the payment and create the booking in MongoDB.

**Why Stripe Checkout (hosted page) instead of Stripe Elements (embedded form)?**

| Approach | Pros | Cons |
|---|---|---|
| **Stripe Checkout (what we use)** | PCI compliant out of the box, no card data touches our server, built-in UI for mobile/desktop, handles 3D Secure automatically | User leaves our site briefly |
| Stripe Elements (embedded) | Card form stays on our page | More code, PCI responsibility, must handle 3D Secure manually |

We chose Stripe Checkout because it is the simplest, most secure approach — especially for a project that doesn't need a custom payment form.

---

## Architecture & Flow Diagram

```
User clicks "Pay & Book Now"
        |
        v
POST /listings/:id/book
        |
        v
+---------------------------+
| createBooking() handler   |
| 1. Validate dates         |
| 2. Check overlap          |
| 3. Calculate price        |
| 4. Create Stripe Session  |
+---------------------------+
        |
        v
res.redirect(303, session.url)
        |
        v
+---------------------------+
| STRIPE HOSTED CHECKOUT    |
| - Card number             |
| - Expiry, CVV             |
| - Billing details         |
| - 3D Secure (if needed)   |
+---------------------------+
        |
   +---------+---------+
   |                   |
   v                   v
SUCCESS             CANCEL
   |                   |
   v                   v
GET /bookings/      GET /listings/:id
success?session_id= (back to listing,
   |                no booking created)
   v
+---------------------------+
| paymentSuccess() handler  |
| 1. Retrieve session       |
| 2. Verify payment_status  |
| 3. Check duplicate        |
| 4. Create Booking in DB   |
+---------------------------+
        |
        v
redirect /bookings
(flash: "Payment successful!")
```

---

## Prerequisites & Setup

### 1. Create a Stripe Account

Go to [https://stripe.com](https://stripe.com) and sign up for a free account. No business verification is needed for test mode.

### 2. Get Your API Keys

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure the **"Test mode"** toggle (top-right) is turned ON
3. Go to **Developers** > **API keys**
4. Copy the **Secret key** (starts with `sk_test_...`)

### 3. Add the Key to `.env`

Open the `.env` file in the project root and replace the placeholder:

```env
STRIPE_SECRET_KEY=sk_test_51ABC123...your_actual_key_here
```

### 4. Install the Stripe npm Package

Already installed. If starting fresh:

```bash
npm install stripe
```

This adds `"stripe": "^20.4.0"` to `package.json`.

### 5. Start the Server

```bash
node app.js
```

The server reads `STRIPE_SECRET_KEY` from `.env` via `dotenv` (already configured in `app.js`).

---

## Files Modified / Created

| File | Action | What Changed |
|---|---|---|
| `models/booking.js` | Modified | Added `stripeSessionId: String` field |
| `controller/booking.js` | Modified | Rewrote `createBooking` to use Stripe; added `paymentSuccess` handler |
| `routes/booking.js` | Modified | Added `GET /bookings/success` route |
| `views/listings/show.ejs` | Modified | Button text → "Pay & Book Now"; added "Powered by Stripe" note |
| `.env` | Modified | Added `STRIPE_SECRET_KEY` variable |
| `package.json` | Modified (auto) | `stripe` added to dependencies |

---

## Detailed Code Walkthrough

### 1. Booking Model — `models/booking.js`

```js
const bookingSchema = new schema({
    listing: {
        type: schema.Types.ObjectId,
        ref: "listing",
        required: true
    },
    guest: {
        type: schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkIn:     { type: Date, required: true },
    checkOut:    { type: Date, required: true },
    totalNights: { type: Number, required: true, min: 1 },
    totalPrice:  { type: Number, required: true, min: 0 },

    // NEW FIELD — stores the Stripe Checkout Session ID
    // Used to:
    //   1. Link our booking record to the Stripe payment
    //   2. Prevent duplicate bookings if user refreshes the success page
    stripeSessionId: { type: String },

    status: {
        type: String,
        enum: ["confirmed", "cancelled"],
        default: "confirmed"
    },
    createdAt: { type: Date, default: Date.now }
});
```

**Why `stripeSessionId`?**
- Every Stripe Checkout Session has a unique ID (e.g., `cs_test_a1b2c3...`)
- Before creating a booking in `paymentSuccess`, we check: "Does a booking with this session ID already exist?"
- If yes → skip creation (user probably refreshed the success page)
- If no → create the booking
- This is our **idempotency guard** — it prevents double bookings from one payment

---

### 2. Booking Controller — `controller/booking.js`

This is the core of the implementation. Three key functions:

#### a) `createBooking` — Creates Stripe Checkout Session

```js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
```

The Stripe SDK is initialized once at the top of the file using the secret key from environment variables.

```js
module.exports.createBooking = async (req, res) => {
```

**Step-by-step breakdown:**

**1. Find the listing:**
```js
const listing = await Listing.findById(req.params.id);
if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
}
```
If someone tampers with the URL or the listing was deleted between page load and form submit, we handle it gracefully.

**2. Parse and validate dates:**
```js
const { checkIn, checkOut } = req.body.booking;
const checkInDate  = new Date(checkIn);   // e.g., "2025-03-15" → Date object
const checkOutDate = new Date(checkOut);
const today = new Date();
today.setHours(0, 0, 0, 0);              // Normalize to midnight for fair comparison

if (checkInDate < today) { /* reject: past date */ }
if (checkOutDate <= checkInDate) { /* reject: checkout must be after checkin */ }
```

**3. Check for overlapping bookings:**
```js
const overlap = await Booking.findOne({
    listing: listing._id,
    status: "confirmed",
    checkIn:  { $lt: checkOutDate },   // existing booking starts before our checkout
    checkOut: { $gt: checkInDate }     // existing booking ends after our checkin
});
```
This is a standard date-range overlap query. If any confirmed booking overlaps with the requested dates, we reject the request.

**4. Calculate price:**
```js
const msPerDay = 1000 * 60 * 60 * 24;
const totalNights = Math.round((checkOutDate - checkInDate) / msPerDay);
const totalPrice = totalNights * listing.price;
```
Price is always calculated server-side using the listing's price from the database — never trusting client-side values.

**5. Create the Stripe Checkout Session:**
```js
const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
        price_data: {
            currency: "inr",
            product_data: {
                name: listing.title,
                description: `3 nights at Mumbai, India`,
                images: [listing.image.url]
            },
            unit_amount: totalPrice * 100   // ₹5000 → 500000 paise
        },
        quantity: 1
    }],
    mode: "payment",
    metadata: {
        listingId:   listing._id.toString(),
        guestId:     req.user._id.toString(),
        checkIn:     checkIn,        // "2025-03-15"
        checkOut:    checkOut,        // "2025-03-18"
        totalNights: totalNights.toString(),
        totalPrice:  totalPrice.toString()
    },
    success_url: `${req.protocol}://${req.get("host")}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${req.protocol}://${req.get("host")}/listings/${listing._id}`
});
```

**Key details:**

| Parameter | Explanation |
|---|---|
| `payment_method_types: ["card"]` | Only accept card payments (Visa, Mastercard, etc.) |
| `currency: "inr"` | Indian Rupees — Stripe supports 135+ currencies |
| `unit_amount: totalPrice * 100` | Stripe uses the **smallest currency unit**. For INR, that's **paise** (1 ₹ = 100 paise). So ₹5000 = 500000 paise |
| `mode: "payment"` | One-time payment (not subscription) |
| `metadata` | Custom key-value pairs stored on the session. We retrieve these after payment to create the booking. Stripe doesn't interpret these — they're purely for our use |
| `success_url` | Where Stripe redirects after payment succeeds. `{CHECKOUT_SESSION_ID}` is a Stripe template variable — Stripe replaces it with the actual session ID |
| `cancel_url` | Where Stripe redirects if user clicks "Back" or closes the checkout page |

**6. Redirect to Stripe:**
```js
res.redirect(303, session.url);
```
HTTP 303 (See Other) is the correct status code for redirecting a POST to a GET (Stripe's checkout URL).

---

#### b) `paymentSuccess` — Handles Stripe's Redirect After Payment

```js
module.exports.paymentSuccess = async (req, res) => {
    const { session_id } = req.query;
```

**Step-by-step breakdown:**

**1. Validate session_id exists:**
```js
if (!session_id) {
    req.flash("error", "Invalid payment session.");
    return res.redirect("/listings");
}
```

**2. Retrieve the session from Stripe's API:**
```js
const session = await stripe.checkout.sessions.retrieve(session_id);
```
This makes an API call to Stripe to get the full session object, including payment status and our metadata.

**3. Verify payment succeeded:**
```js
if (session.payment_status !== "paid") {
    req.flash("error", "Payment was not completed.");
    return res.redirect("/listings");
}
```
`payment_status` can be: `"paid"`, `"unpaid"`, or `"no_payment_required"`. We only proceed on `"paid"`.

**4. Duplicate check (idempotency):**
```js
const existingBooking = await Booking.findOne({ stripeSessionId: session.id });
if (existingBooking) {
    req.flash("success", "Your booking is already confirmed!");
    return res.redirect("/bookings");
}
```
If user refreshes `/bookings/success?session_id=cs_test_...`, we don't create a second booking.

**5. Verify user identity:**
```js
if (guestId !== req.user._id.toString()) {
    req.flash("error", "Unauthorized access to this booking.");
    return res.redirect("/listings");
}
```
Prevents user A from accessing user B's success URL.

**6. Create the booking:**
```js
const booking = new Booking({
    listing:         listingId,
    guest:           guestId,
    checkIn:         new Date(checkIn),
    checkOut:        new Date(checkOut),
    totalNights:     Number(totalNights),
    totalPrice:      Number(totalPrice),
    stripeSessionId: session.id,
    status:          "confirmed"
});
await booking.save();
```
The booking is only created AFTER payment is verified. This means:
- No booking exists during the payment process
- If payment fails or user cancels, no orphan bookings are left in the database

---

#### c) `renderMyBookings` and `cancelBooking`

These functions remain unchanged from before. They work the same whether the booking was created via Stripe or directly. The `cancelBooking` function marks `status: "cancelled"` but does **not** issue a Stripe refund (that would require additional implementation — see [Future Improvements](#future-improvements)).

---

### 3. Booking Routes — `routes/booking.js`

```js
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controller/booking.js");

// My Bookings page
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.renderMyBookings));

// Stripe redirects here after successful payment
router.get("/bookings/success", isLoggedIn, wrapAsync(bookingController.paymentSuccess));

// User submits booking form → creates Stripe Checkout Session
router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));

// Cancel a booking (marks as cancelled, doesn't refund)
router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
```

**Route order matters:** `/bookings/success` is defined BEFORE `/bookings/:bookingId` to prevent Express from treating `"success"` as a `:bookingId` parameter.

All routes use `isLoggedIn` middleware — guests cannot access any booking functionality.

---

### 4. Show Page — `views/listings/show.ejs`

The booking form itself didn't change — it still POSTs `booking[checkIn]` and `booking[checkOut]` to `/listings/:id/book`. The key UI changes:

**Button:**
```html
<button type="submit" class="btn btn-add w-100 mt-3">
    <i class="fa-solid fa-lock me-1"></i> Pay & Book Now
</button>
```
The lock icon and "Pay" text signal to users that they'll be taken to a payment page.

**Stripe branding:**
```html
<p class="text-center text-muted mt-2 mb-0" style="font-size:0.78rem;">
    <i class="fa-brands fa-stripe me-1"></i> Secure payment powered by Stripe
</p>
```
Builds trust by showing Stripe branding. Uses Font Awesome's `fa-brands fa-stripe` icon.

---

## Stripe Checkout Session — How It Works

When we call `stripe.checkout.sessions.create(...)`, Stripe:

1. Creates a temporary checkout page at a unique URL (e.g., `https://checkout.stripe.com/c/pay/cs_test_...`)
2. This page collects card details, handles 3D Secure authentication, and processes the payment
3. Card numbers **never touch our server** — they go directly to Stripe
4. After payment, Stripe redirects the user's browser to our `success_url`
5. The session is available for retrieval via API for 24 hours

### Metadata

We store booking details in the session's `metadata` field:

```js
metadata: {
    listingId:   "6789abc...",
    guestId:     "1234def...",
    checkIn:     "2025-03-15",
    checkOut:    "2025-03-18",
    totalNights: "3",
    totalPrice:  "15000"
}
```

**Why metadata?** Because between `createBooking` and `paymentSuccess`, the user leaves our site. We can't rely on session/cookies to carry booking details. Stripe metadata is the secure way to pass data through the payment flow.

**Important:** All metadata values must be strings (Stripe requirement). We convert back to numbers/dates in `paymentSuccess`.

### The `{CHECKOUT_SESSION_ID}` Template Variable

In the `success_url`:
```
/bookings/success?session_id={CHECKOUT_SESSION_ID}
```

`{CHECKOUT_SESSION_ID}` is a Stripe template literal. Stripe replaces it with the actual session ID before redirecting. So the user lands on:
```
/bookings/success?session_id=cs_test_a1b2c3d4e5...
```

---

## Security Measures

| Measure | Where | Why |
|---|---|---|
| Server-side price calculation | `createBooking` | Never trust client-side price. We calculate `totalNights * listing.price` on the server |
| `isLoggedIn` middleware | All routes | Only authenticated users can book |
| Guest ID verification | `paymentSuccess` | Ensures logged-in user matches the payment initiator |
| Stripe session retrieval | `paymentSuccess` | We verify payment status by calling Stripe's API, not by trusting query params |
| Duplicate booking guard | `paymentSuccess` | `stripeSessionId` uniqueness check prevents double-booking on page refresh |
| Date overlap check | `createBooking` | Prevents double-booking the same dates on the same listing |
| HTTPS in production | `success_url` / `cancel_url` | `req.protocol` returns `https` in production (when behind a proxy with `trust proxy` enabled) |
| Secret key in `.env` | `controller/booking.js` | Stripe secret key is never committed to Git or exposed to the frontend |
| Card data isolation | Stripe Checkout | Card numbers, CVV, expiry never reach our server — Stripe handles PCI compliance |

---

## Edge Cases Handled

| Scenario | What Happens |
|---|---|
| User refreshes success page | `stripeSessionId` check prevents duplicate booking. Flash says "already confirmed" |
| User cancels on Stripe checkout | Redirected to listing page. No booking created. No charge |
| Listing deleted mid-payment | `paymentSuccess` creates booking with the listing ID from metadata. The booking will show as "listing deleted" in My Bookings |
| User A tries to access User B's success URL | `guestId` verification rejects with "Unauthorized" |
| Past check-in date submitted | Server-side validation rejects before Stripe session is created |
| Overlapping dates with existing booking | Overlap query rejects before Stripe session is created |
| Check-out date before check-in | Server-side validation rejects |
| Invalid/missing session_id in success URL | Returns "Invalid payment session" and redirects to /listings |
| Payment fails (card declined) | Stripe shows error on its checkout page. User can retry or go back. No redirect to success URL |
| 3D Secure required | Stripe Checkout handles 3DS authentication automatically |
| Network error during Stripe API call | `wrapAsync` catches the error → Express error handler renders the error page |

---

## Testing with Stripe Test Mode

### Test Card Numbers

Stripe provides test card numbers that work in test mode:

| Card Number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0000 0000 0002` | Generic decline |

For all test cards:
- **Expiry:** Any future date (e.g., `12/34`)
- **CVV:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

### Testing Steps

1. Make sure `.env` has your `sk_test_...` key
2. Start the server: `node app.js`
3. Log in to the app
4. Go to any listing's show page
5. Select check-in and check-out dates
6. Click "Pay & Book Now"
7. On the Stripe checkout page, enter test card `4242 4242 4242 4242`
8. Click "Pay"
9. You should be redirected to `/bookings` with a success flash message
10. The booking should appear in "My Bookings"

### Viewing Payments in Stripe Dashboard

After a test payment:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/payments)
2. You'll see the payment with the listing title, amount, and status
3. Click on a payment to see metadata (listingId, guestId, dates, etc.)

---

## Environment Variables

| Variable | Required | Example | Notes |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | `sk_test_51ABC...` | Get from Stripe Dashboard > Developers > API keys |

**Where it's used:**
- `controller/booking.js` line 3: `const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);`

**Where it's loaded:**
- `app.js` line 3: `require("dotenv").config();` loads all `.env` variables into `process.env`

**Important:** Never use `pk_test_...` (publishable key) for server-side operations. The `sk_test_...` (secret key) is required for creating checkout sessions and retrieving payment data.

---

## Common Errors & Troubleshooting

### 1. "Invalid API Key provided"
```
Error: Invalid API Key provided: sk_test_YOUR_STRIPE_SECRET_KEY_HERE
```
**Cause:** You haven't replaced the placeholder in `.env`.
**Fix:** Replace `sk_test_YOUR_STRIPE_SECRET_KEY_HERE` with your actual Stripe test secret key.

### 2. "Amount must be at least ₹0.50"
```
Error: Amount must be at least 50.
```
**Cause:** Stripe requires a minimum charge of ₹0.50 (50 paise). If a listing has `price: 0` or the calculated total is less than ₹0.50.
**Fix:** Ensure all listings have a price of at least ₹1.

### 3. "No such checkout.session"
**Cause:** The `session_id` in the URL is invalid or expired (sessions expire after 24 hours).
**Fix:** Have the user book again. Sessions are one-time use.

### 4. Redirect Loop or 404 on `/bookings/success`
**Cause:** Route order in `routes/booking.js` — if `/bookings/:bookingId` is defined before `/bookings/success`, Express treats `"success"` as a bookingId.
**Fix:** Ensure the success route is defined before the parameterized route (this is already correct in our implementation).

### 5. "req.user is undefined" in paymentSuccess
**Cause:** User's session expired while on Stripe's checkout page.
**Fix:** The `isLoggedIn` middleware redirects to `/login`. After login, the user would need to book again.

---

## Future Improvements

These are optional enhancements that could be added later:

### 1. Stripe Webhooks
Instead of relying on the success URL redirect, use Stripe webhooks (`checkout.session.completed` event) for a more reliable payment confirmation. Webhooks fire even if the user closes their browser after payment.

### 2. Automatic Refunds on Cancellation
Currently, `cancelBooking` only marks `status: "cancelled"` — it doesn't issue a Stripe refund. To add refunds:
```js
// In cancelBooking handler, after changing status:
if (booking.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
    await stripe.refunds.create({ payment_intent: session.payment_intent });
}
```

### 3. Email Receipts
Stripe can automatically send email receipts. Add `customer_email` to the session:
```js
const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    // ... rest of config
});
```

### 4. Publishable Key for Frontend
If you want to show the Stripe logo or use Stripe.js on the frontend, add `STRIPE_PUBLIC_KEY` to `.env` and pass it to the template:
```js
res.locals.stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
```

### 5. Multiple Payment Methods
Expand `payment_method_types` to include UPI, net banking, or wallets:
```js
payment_method_types: ["card", "upi", "netbanking"]
```
(Requires Stripe India activation)

---

## Summary

The payment flow is:

1. **Form submit** → server validates dates and checks overlaps
2. **Stripe Checkout Session** created with listing details and metadata
3. **User redirected** to Stripe's secure payment page
4. **After payment** → Stripe redirects to `/bookings/success`
5. **Server verifies** payment via Stripe API and creates booking in MongoDB
6. **User sees** confirmation flash message on My Bookings page

This approach ensures that:
- Card data never touches our server (PCI compliant)
- Bookings are only created after verified payment
- Duplicate bookings are prevented via `stripeSessionId`
- The existing booking UI (My Bookings, cancellation) works without changes
