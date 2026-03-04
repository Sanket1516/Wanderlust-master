const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// POST /listings/:id/book
// Validates dates, checks for overlapping bookings, then creates a Stripe Checkout Session
// and redirects the user to Stripe's hosted payment page.
module.exports.createBooking = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const { checkIn, checkOut } = req.body.booking;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate dates
    if (checkInDate < today) {
        req.flash("error", "Check-in date cannot be in the past.");
        return res.redirect(`/listings/${req.params.id}`);
    }
    if (checkOutDate <= checkInDate) {
        req.flash("error", "Check-out date must be after check-in date.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    // Check for overlapping confirmed bookings on this listing
    const overlap = await Booking.findOne({
        listing: listing._id,
        status: "confirmed",
        checkIn:  { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
    });

    if (overlap) {
        req.flash("error", "This listing is already booked for the selected dates. Please choose different dates.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalNights = Math.round((checkOutDate - checkInDate) / msPerDay);
    const totalPrice = totalNights * listing.price;

    // Create a Stripe Checkout Session
    // Stripe expects amounts in the smallest currency unit (paise for INR), so multiply by 100
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: listing.title,
                        description: `${totalNights} night${totalNights > 1 ? "s" : ""} at ${listing.location}, ${listing.country}`,
                        images: [listing.image.url]
                    },
                    unit_amount: totalPrice * 100 // Convert rupees to paise
                },
                quantity: 1
            }
        ],
        mode: "payment",
        // Store booking details in session metadata so we can create the booking after payment
        metadata: {
            listingId: listing._id.toString(),
            guestId: req.user._id.toString(),
            checkIn: checkIn,
            checkOut: checkOut,
            totalNights: totalNights.toString(),
            totalPrice: totalPrice.toString()
        },
        success_url: `${req.protocol}://${req.get("host")}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/listings/${listing._id}`
    });

    // Redirect user to Stripe's hosted checkout page
    res.redirect(303, session.url);
};

// GET /bookings/success?session_id=...
// Called by Stripe after successful payment. Retrieves session, verifies payment, creates booking.
module.exports.paymentSuccess = async (req, res) => {
    const { session_id } = req.query;
    if (!session_id) {
        req.flash("error", "Invalid payment session.");
        return res.redirect("/listings");
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify payment was successful
    if (session.payment_status !== "paid") {
        req.flash("error", "Payment was not completed. Please try again.");
        return res.redirect("/listings");
    }

    // Prevent duplicate booking creation if user refreshes the success page
    const existingBooking = await Booking.findOne({ stripeSessionId: session.id });
    if (existingBooking) {
        req.flash("success", "Your booking is already confirmed!");
        return res.redirect("/bookings");
    }

    // Extract booking details from session metadata
    const { listingId, guestId, checkIn, checkOut, totalNights, totalPrice } = session.metadata;

    // Verify the logged-in user matches the guest who initiated the payment
    if (guestId !== req.user._id.toString()) {
        req.flash("error", "Unauthorized access to this booking.");
        return res.redirect("/listings");
    }

    // Create the booking in the database
    const booking = new Booking({
        listing: listingId,
        guest: guestId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        totalNights: Number(totalNights),
        totalPrice: Number(totalPrice),
        stripeSessionId: session.id,
        status: "confirmed"
    });

    await booking.save();
    req.flash("success", `Payment successful! Booking confirmed — ${totalNights} night${Number(totalNights) > 1 ? "s" : ""} at ₹${Number(totalPrice).toLocaleString("en-IN")}`);
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
    req.flash("success", "Booking cancelled successfully.");
    res.redirect("/bookings");
};
