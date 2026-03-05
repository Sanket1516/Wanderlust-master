const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controller/booking.js");

// GET /bookings — My Bookings page
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.renderMyBookings));

// POST /listings/:id/book — Create Razorpay Order and return JSON (AJAX)
router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createOrder));

// POST /bookings/verify — Verify Razorpay payment signature and create booking (AJAX)
router.post("/bookings/verify", isLoggedIn, wrapAsync(bookingController.verifyPayment));

// DELETE /bookings/:bookingId — Cancel a booking
router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
