// Express Router for all wishlist-related routes
const express = require("express");
const router = express.Router();

// wrapAsync catches any unhandled promise rejections in async route handlers
// and forwards them to Express's global error handler (in app.js)
const wrapAsync = require("../utils/wrapAsync.js");

// isLoggedIn middleware checks req.isAuthenticated()
// If the user is not logged in, it stores the requested URL in the session
// and redirects them to /login — after login they come back to the original page
const { isLoggedIn } = require("../middleware.js");

// Wishlist controller functions (business logic lives there, not in route files)
const wishlistController = require("../controller/wishlist.js");


// ──────────────────────────────────────────────────────
// GET /wishlist
// Shows the "My Wishlist" page — all listings the user has saved
// Requires login: guests cannot have a wishlist
// ──────────────────────────────────────────────────────
router.get("/wishlist", isLoggedIn, wrapAsync(wishlistController.renderWishlist));


// ──────────────────────────────────────────────────────
// POST /wishlist/:listingId/toggle
// Single endpoint for both adding AND removing a listing from the wishlist.
// If the listing is already saved → removes it (unsave)
// If the listing is not saved yet → saves it (add)
// Requires login: guests cannot wishlist items
// ──────────────────────────────────────────────────────
router.post(
    "/wishlist/:listingId/toggle",
    isLoggedIn,                                     // block unauthenticated users first
    wrapAsync(wishlistController.toggleWishlist)     // then run the toggle logic
);

module.exports = router;
