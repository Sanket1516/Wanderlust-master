const express    = require("express");
const router     = express.Router();
const wrapAsync  = require("../utils/wrapAsync.js");
const { isAdmin } = require("../middleware.js");
const adminController = require("../controller/admin.js");

// All admin routes are protected by isAdmin middleware
router.get("/admin",                    isAdmin, wrapAsync(adminController.renderDashboard));
router.get("/admin/listings",           isAdmin, wrapAsync(adminController.renderListings));
router.delete("/admin/listings/:id",    isAdmin, wrapAsync(adminController.deleteListing));
router.get("/admin/users",              isAdmin, wrapAsync(adminController.renderUsers));
router.delete("/admin/users/:id",       isAdmin, wrapAsync(adminController.deleteUser));
router.post("/admin/users/:id/toggle-admin", isAdmin, wrapAsync(adminController.toggleAdmin));
router.get("/admin/bookings",           isAdmin, wrapAsync(adminController.renderBookings));
router.delete("/admin/bookings/:id",    isAdmin, wrapAsync(adminController.deleteBooking));

module.exports = router;
