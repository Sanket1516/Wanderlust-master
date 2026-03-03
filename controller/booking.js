const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

// POST /listings/:id/book
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

    const booking = new Booking({
        listing: listing._id,
        guest: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalNights,
        totalPrice
    });

    await booking.save();
    req.flash("success", `Booking confirmed! ${totalNights} night${totalNights > 1 ? "s" : ""} at ₹${totalPrice.toLocaleString("en-IN")}`);
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
