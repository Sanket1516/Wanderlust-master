// Require the User model to query and update the logged-in user's wishlist
const User = require("../models/user.js");

// Require the Listing model to verify the listing exists before toggling
const Listing = require("../models/listing.js");


// ─────────────────────────────────────────────
// POST /wishlist/:listingId/toggle
// Adds the listing to wishlist if not present, removes it if already present.
// Works for both AJAX calls (returns JSON) and plain form POST (redirects).
// ─────────────────────────────────────────────
module.exports.toggleWishlist = async (req, res) => {
    // Extract the listing ID from the URL parameter (e.g. /wishlist/abc123/toggle)
    const { listingId } = req.params;

    // Verify the listing actually exists in the DB before touching the user document
    // If someone sends a fake/deleted listing ID, we catch it here
    const listing = await Listing.findById(listingId);
    if (!listing) {
        // If the request came from AJAX (fetch), return a JSON error response
        if (req.headers["x-requested-with"] === "XMLHttpRequest") {
            return res.status(404).json({ error: "Listing not found" });
        }
        // If the request came from a normal form POST, show a flash message and redirect
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    // Fetch a FRESH copy of the user from MongoDB.
    // We don't use req.user directly because it is the session-deserialized snapshot —
    // modifying it won't persist without calling .save() on the actual DB document.
    const user = await User.findById(req.user._id);

    // Check if this listing is already in the user's wishlist.
    // We compare as strings because wishlist contains ObjectIds (not plain strings).
    const existingIndex = user.wishlist.findIndex(
        (id) => id.toString() === listingId
    );

    let wishlisted; // tracks the RESULT of the toggle (true = added, false = removed)

    if (existingIndex === -1) {
        // Listing is NOT in wishlist — ADD it
        user.wishlist.push(listingId);
        wishlisted = true;
    } else {
        // Listing IS already in wishlist — REMOVE it using its array index
        user.wishlist.splice(existingIndex, 1);
        wishlisted = false;
    }

    // Persist the updated wishlist array to MongoDB
    await user.save();

    // ── AJAX path ──────────────────────────────────────────────────────────
    // If the request was made via fetch() with the custom header, return JSON.
    // The front-end JS will use this to update the heart icon and badge count
    // without doing a full page reload.
    if (req.headers["x-requested-with"] === "XMLHttpRequest") {
        return res.json({
            wishlisted,                         // true (heart filled) or false (heart outline)
            wishlistCount: user.wishlist.length // new total count for the navbar badge
        });
    }

    // ── Form POST path ──────────────────────────────────────────────────────
    // If the request came from a normal HTML form (used on the show page),
    // show a flash message and redirect back to the listing detail page.
    req.flash("success", wishlisted ? "Saved to your wishlist!" : "Removed from wishlist.");
    res.redirect(`/listings/${listingId}`);
};


// ─────────────────────────────────────────────
// GET /wishlist
// Fetches and renders the "My Wishlist" page showing all saved listings.
// ─────────────────────────────────────────────
module.exports.renderWishlist = async (req, res) => {
    // Populate the wishlist array: replace each ObjectId with the full listing document.
    // This is equivalent to a JOIN — req.user only has IDs, we need the actual listing data.
    const user = await User.findById(req.user._id).populate("wishlist");

    // Guard against listings that were deleted after being wishlisted.
    // .populate() returns null for documents that no longer exist — filter those out.
    const allListings = user.wishlist.filter((l) => l !== null);

    // Build a Set of wishlisted listing IDs (as strings) for fast O(1) lookups in the template.
    // On the wishlist page every listing IS already saved, so the Set contains all of them.
    // We still build it for API consistency with index.ejs and show.ejs.
    const wishlistSet = new Set(allListings.map((l) => l._id.toString()));

    // Render the wishlist page and pass both the listings array and the Set
    res.render("users/wishlist.ejs", { allListings, wishlistSet });
};
