const Listing = require("../models/listing.js");
const User    = require("../models/user.js");
const Booking = require("../models/booking.js");
const Review  = require("../models/review.js");

// GET /admin — Dashboard with stats
module.exports.renderDashboard = async (req, res) => {
    const [totalListings, totalUsers, allBookings] = await Promise.all([
        Listing.countDocuments(),
        User.countDocuments(),
        Booking.find({ status: "confirmed" })
    ]);

    const totalBookings = await Booking.countDocuments();
    const totalRevenue  = allBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Recent activity: last 5 bookings
    const recentBookings = await Booking.find()
        .populate("listing", "title")
        .populate("guest", "username")
        .sort({ createdAt: -1 })
        .limit(5);

    res.render("admin/dashboard.ejs", {
        totalListings,
        totalUsers,
        totalBookings,
        totalRevenue,
        recentBookings
    });
};

// GET /admin/listings — All listings table
module.exports.renderListings = async (req, res) => {
    const listings = await Listing.find()
        .populate("owner", "username")
        .sort({ _id: -1 });
    res.render("admin/listings.ejs", { listings });
};

// DELETE /admin/listings/:id — Force delete any listing
module.exports.deleteListing = async (req, res) => {
    await Listing.findByIdAndDelete(req.params.id);
    req.flash("success", "Listing deleted by admin.");
    res.redirect("/admin/listings");
};

// GET /admin/users — All users table
module.exports.renderUsers = async (req, res) => {
    const users = await User.find().sort({ _id: -1 });

    // Count listings and bookings per user efficiently
    const [listingCounts, bookingCounts] = await Promise.all([
        Listing.aggregate([
            { $group: { _id: "$owner", count: { $sum: 1 } } }
        ]),
        Booking.aggregate([
            { $group: { _id: "$guest", count: { $sum: 1 } } }
        ])
    ]);

    const listingMap = Object.fromEntries(listingCounts.map(l => [l._id.toString(), l.count]));
    const bookingMap = Object.fromEntries(bookingCounts.map(b => [b._id.toString(), b.count]));

    res.render("admin/users.ejs", { users, listingMap, bookingMap });
};

// DELETE /admin/users/:id — Delete a user and their bookings
module.exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    // Prevent admin from deleting themselves
    if (req.user._id.equals(userId)) {
        req.flash("error", "You cannot delete your own admin account.");
        return res.redirect("/admin/users");
    }
    await Promise.all([
        User.findByIdAndDelete(userId),
        Booking.deleteMany({ guest: userId })
    ]);
    req.flash("success", "User deleted.");
    res.redirect("/admin/users");
};

// GET /admin/bookings — All bookings table
module.exports.renderBookings = async (req, res) => {
    const bookings = await Booking.find()
        .populate("listing", "title price")
        .populate("guest", "username")
        .sort({ createdAt: -1 });
    res.render("admin/bookings.ejs", { bookings });
};

// DELETE /admin/bookings/:id — Hard delete any booking
module.exports.deleteBooking = async (req, res) => {
    await Booking.findByIdAndDelete(req.params.id);
    req.flash("success", "Booking deleted.");
    res.redirect("/admin/bookings");
};

// POST /admin/users/:id/toggle-admin — Promote or demote a user
module.exports.toggleAdmin = async (req, res) => {
    const userId = req.params.id;
    // Prevent admin from demoting themselves
    if (req.user._id.equals(userId)) {
        req.flash("error", "You cannot change your own admin status.");
        return res.redirect("/admin/users");
    }
    const user = await User.findById(userId);
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/admin/users");
    }
    user.isAdmin = !user.isAdmin;
    await user.save();
    req.flash("success", `@${user.username} is now ${user.isAdmin ? "an Admin" : "a regular User"}.`);
    res.redirect("/admin/users");
};
