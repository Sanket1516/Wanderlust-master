const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const crypto = require("crypto");
const { sendMail } = require("../utils/mailer.js");
const emailTemplates = require("../utils/emailTemplates.js");

let razorpayClient = null;

function getRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes("YOUR_") || keySecret.includes("YOUR_")) {
        return { error: "Payments are temporarily unavailable. Razorpay is not configured yet." };
    }

    if (!razorpayClient) {
        let Razorpay;
        try {
            Razorpay = require("razorpay");
        } catch (err) {
            return { error: "Payments are temporarily unavailable." };
        }

        razorpayClient = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }

    return { client: razorpayClient };
}

// POST /listings/:id/book  (AJAX — called via fetch from show.ejs)
// Validates dates, checks for overlapping bookings, then creates a Razorpay Order
// and returns the order details as JSON so the frontend can open the Razorpay checkout modal.
module.exports.createOrder = async (req, res) => {
    const { client: razorpay, error: paymentInitError } = getRazorpayClient();
    if (paymentInitError) {
        return res.status(503).json({ error: paymentInitError });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        return res.status(404).json({ error: "Listing not found." });
    }

    const { checkIn, checkOut } = req.body;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate dates
    if (checkInDate < today) {
        return res.status(400).json({ error: "Check-in date cannot be in the past." });
    }
    if (checkOutDate <= checkInDate) {
        return res.status(400).json({ error: "Check-out date must be after check-in date." });
    }

    // Check for overlapping confirmed bookings on this listing
    const overlap = await Booking.findOne({
        listing: listing._id,
        status: "confirmed",
        checkIn:  { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
    });

    if (overlap) {
        return res.status(409).json({ error: "This listing is already booked for the selected dates. Please choose different dates." });
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalNights = Math.round((checkOutDate - checkInDate) / msPerDay);
    const totalPrice = totalNights * listing.price;

    // Create a Razorpay Order
    // Razorpay expects amount in the smallest currency unit (paise for INR), so multiply by 100
    const order = await razorpay.orders.create({
        amount: totalPrice * 100,   // e.g., ₹5000 → 500000 paise
        currency: "INR",
        receipt: `booking_${listing._id}_${Date.now()}`,
        // notes are stored on the order and can be retrieved during verification
        notes: {
            listingId: listing._id.toString(),
            guestId: req.user._id.toString(),
            checkIn: checkIn,
            checkOut: checkOut,
            totalNights: totalNights.toString(),
            totalPrice: totalPrice.toString()
        }
    });

    // Return order details + Razorpay key to the frontend
    // The frontend will use these to open the Razorpay checkout modal
    res.json({
        success: true,
        order: {
            id: order.id,
            amount: order.amount,
            currency: order.currency
        },
        key: process.env.RAZORPAY_KEY_ID,
        listing: {
            title: listing.title,
            image: listing.image.url
        },
        user: {
            name: req.user.username,
            email: req.user.email
        },
        booking: {
            checkIn,
            checkOut,
            totalNights,
            totalPrice
        }
    });
};

// POST /bookings/verify  (AJAX — called after Razorpay payment succeeds)
// Verifies the Razorpay payment signature using HMAC SHA256,
// then creates the booking in MongoDB.
module.exports.verifyPayment = async (req, res) => {
    const { client: razorpay, error: paymentInitError } = getRazorpayClient();
    if (paymentInitError) {
        return res.status(503).json({ error: paymentInitError });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: "Payments are temporarily unavailable." });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify the payment signature
    // Razorpay sends: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
    }

    // Prevent duplicate booking if this order was already processed
    const existingBooking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
    if (existingBooking) {
        return res.json({ success: true, redirect: "/bookings", message: "Booking already confirmed!" });
    }

    // Fetch the order from Razorpay to get the booking details from notes
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { listingId, guestId, checkIn, checkOut, totalNights, totalPrice } = order.notes;

    // Verify the logged-in user matches the guest who initiated the payment
    if (guestId !== req.user._id.toString()) {
        return res.status(403).json({ error: "Unauthorized access to this booking." });
    }

    // Create the booking in the database
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

    // Send booking confirmation emails (non-blocking — don't fail the request if email fails)
    const listing = await Listing.findById(listingId).populate("owner");
    const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    // Email to guest
    sendMail({
        to: req.user.email,
        subject: `Booking Confirmed — ${listing.title}`,
        html: emailTemplates.bookingConfirmation({
            listingTitle: listing.title,
            checkIn: formatDate(checkIn),
            checkOut: formatDate(checkOut),
            totalNights: Number(totalNights),
            totalPrice: Number(totalPrice)
        })
    });

    // Email to host
    if (listing.owner && listing.owner.email) {
        sendMail({
            to: listing.owner.email,
            subject: `New Booking — ${listing.title}`,
            html: emailTemplates.newBookingAlert({
                guestName: req.user.username,
                listingTitle: listing.title,
                checkIn: formatDate(checkIn),
                checkOut: formatDate(checkOut),
                totalNights: Number(totalNights),
                totalPrice: Number(totalPrice)
            })
        });
    }

    req.flash("success", `Payment successful! Booking confirmed — ${totalNights} night${Number(totalNights) > 1 ? "s" : ""} at ₹${Number(totalPrice).toLocaleString("en-IN")}`);
    res.json({ success: true, redirect: "/bookings" });
};

// POST /listings/:id/book  (direct booking without payment)
module.exports.directBook = async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("owner");
    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const { checkIn, checkOut } = req.body;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!checkIn || !checkOut || checkInDate < today || checkOutDate <= checkInDate) {
        req.flash("error", "Please select valid check-in and check-out dates.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    // Check for overlapping confirmed bookings
    const overlap = await Booking.findOne({
        listing: listing._id,
        status: "confirmed",
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
    });

    if (overlap) {
        req.flash("error", "This listing is already booked for the selected dates. Please choose different dates.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalNights = Math.round((checkOutDate - checkInDate) / msPerDay);
    const totalPrice = totalNights * listing.price;

    const booking = new Booking({
        listing: listing._id,
        guest: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalNights,
        totalPrice,
        status: "confirmed"
    });

    await booking.save();

    // Send booking confirmation emails
    const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    sendMail({
        to: req.user.email,
        subject: `Booking Confirmed — ${listing.title}`,
        html: emailTemplates.bookingConfirmation({
            listingTitle: listing.title,
            checkIn: formatDate(checkInDate),
            checkOut: formatDate(checkOutDate),
            totalNights,
            totalPrice
        })
    });

    if (listing.owner && listing.owner.email) {
        sendMail({
            to: listing.owner.email,
            subject: `New Booking — ${listing.title}`,
            html: emailTemplates.newBookingAlert({
                guestName: req.user.username,
                listingTitle: listing.title,
                checkIn: formatDate(checkInDate),
                checkOut: formatDate(checkOutDate),
                totalNights,
                totalPrice
            })
        });
    }

    req.flash("success", `Booking confirmed — ${totalNights} night${totalNights > 1 ? "s" : ""} at ₹${totalPrice.toLocaleString("en-IN")}`);
    res.redirect("/bookings");
};

// GET /bookings
module.exports.renderMyBookings = async (req, res) => {
    const bookings = await Booking.find({ guest: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });

    // Guard: filter out bookings whose listing was deleted
    const validBookings = bookings.filter(b => b.listing !== null);
    res.render("bookings/myBookings.ejs", { bookings: validBookings });
};

// DELETE /bookings/:bookingId
module.exports.cancelBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/bookings");
    }
    // Only the guest who made the booking can cancel it
    if (!booking.guest.equals(req.user._id)) {
        req.flash("error", "You do not have permission to cancel this booking.");
        return res.redirect("/bookings");
    }
    // Cannot cancel past bookings
    if (booking.checkIn <= new Date()) {
        req.flash("error", "Cannot cancel a booking that has already started or passed.");
        return res.redirect("/bookings");
    }
    booking.status = "cancelled";
    await booking.save();

    // Send cancellation emails to both guest and host
    const listing = await Listing.findById(booking.listing).populate("owner");
    if (listing) {
        const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        const cancelHtml = emailTemplates.bookingCancellation({
            listingTitle: listing.title,
            checkIn: formatDate(booking.checkIn),
            checkOut: formatDate(booking.checkOut),
            cancelledBy: "guest"
        });

        // Email to guest
        sendMail({ to: req.user.email, subject: `Booking Cancelled — ${listing.title}`, html: cancelHtml });

        // Email to host
        if (listing.owner && listing.owner.email) {
            sendMail({ to: listing.owner.email, subject: `Booking Cancelled — ${listing.title}`, html: cancelHtml });
        }
    }

    req.flash("success", "Booking cancelled successfully.");
    res.redirect("/bookings");
};
