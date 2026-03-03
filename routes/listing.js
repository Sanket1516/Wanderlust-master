const express = require('express');
//express.router is a class provided by express helps you break your Express router into smaller, manageable pieces by grouping related routes together.
const router = express.Router({ mergeParams: true });
//also require all the dependencies required in this file just copy paste from the app.js let them there also
 const wrapAsync = require("../utils/wrapAsync.js");
 const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
 const Listing = require("../models/listing.js"); // Mongoose model for your listings
 const Review = require("../models/review.js");
const {isLoggedIn,isOwner,validateListing} = require("../middleware.js");
const listingContoller = require("../controller/listings.js");
const multer = require("multer");
const { storage } = require("../cloudconfig.js");
const upload = multer({ storage });  //now uploads will store the new file in the cloudinary storage


 //Replaced all the app with the router
 //also replaced if only /listings as a / and removed the /listngs from all the routes only in the http request not in callbacks

// GET Route: Display form to create a new listing
// This must come BEFORE '/listings/:id' to ensure '/listings/new' is correctly matched.
router.get("/new", isLoggedIn, wrapAsync(listingContoller.renderNewForm));



// GET Route: Display all listings
// POST Route: Save a new listing
router.route("/")
.get(wrapAsync(listingContoller.index))
.post(isLoggedIn,upload.single('listing[image]'),validateListing,wrapAsync(listingContoller.createNewListing));
// GET Route: Display details of a specific listing
// This route is more general and should come after specific static routes (like /listings/new).
// PUT Route: Update a specific listing
// DELETE Route: Delete a specific listing

router.get("/search", async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.redirect("/listings");
    }

// $or → match if ANY field matches
// $regex → partial text search
// "i" → case-insensitive
const listings = await Listing.find({
    $or: [
        { title: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
    ]
});


    res.render("listings/index", { allListings: listings });
});


router.route("/:id")
.get(wrapAsync(listingContoller.showListing))
.put(isLoggedIn,isOwner,upload.single('listing[image]'),validateListing, wrapAsync(listingContoller.updateListing))
.delete(isLoggedIn,isOwner, wrapAsync(listingContoller.destroyListing));







 


// GET Route: Display form to edit a specific listing
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingContoller.renderEditForm));

    

module.exports = router;