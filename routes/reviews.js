const express = require("express");
const router = express.Router({ mergeParams: true });
 const Listing = require("../models/listing.js"); 
 const Review = require("../models/review.js");
 const wrapAsync = require("../utils/wrapAsync.js");
 const {validateReview, isLoggedIn,isReviewAuthor} = require("../middleware.js");
 const reviewController = require("../controller/reviews.js");
    
    //reviews
    router.post("/",isLoggedIn,validateReview ,wrapAsync(reviewController.createReview))

    //delete review route for deleting a review
    router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewController.destroyReview));

module.exports = router;