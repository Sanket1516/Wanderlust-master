const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controller/booking.js");

// GET /bookings — My Bookings page
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.renderMyBookings));

// GET /bookings/success — Stripe redirects here after successful payment
router.get("/bookings/success", isLoggedIn, wrapAsync(bookingController.paymentSuccess));

// POST /listings/:id/book — Create Stripe Checkout Session and redirect to payment
router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));

// DELETE /bookings/:bookingId — Cancel a booking
router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
