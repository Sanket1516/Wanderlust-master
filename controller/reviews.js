const Listing = require("../models/listing");
const Review = require("../models/review");


module.exports.createReview = async (req, res) => {
        let listing = await Listing.findById(req.params.id)
        let newreview = new Review(req.body.review);
        newreview.author = req.user._id;
        listing.reviews.push(newreview);

        await newreview.save();
        await listing.save();
        req.flash("success", "New Review Created!");
        res.redirect(`/listings/${req.params.id}`);
    };

module.exports.destroyReview = async (req, res) => {
        let {id, reviewId} = req.params;
        /*
* This command finds a specific listing using its unique 'id'.
* It then removes (using the '$pull' operator) the review that matches 'reviewId'
* it updates the 'reviews' array by removing the specified review.
* from the 'reviews' array associated with that listing.
*/
        await Listing.findByIdAndUpdate(id,{$pull : {reviews : reviewId}});
        await Review.findByIdAndDelete(reviewId);
        req.flash("success", "Review Deleted!");
        res.redirect(`/listings/${id}`);
    };

