const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError");
const {listingSchema,reviewSchema} = require("./schema");
const Review = require("./models/review");

let isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        //we store the url where the user have clicked and asked for login
        req.session.redirectUrl = req.originalUrl;
        //now we can use this url anywhere as it is stored in session
           req.flash("error", "You must be logged in to do that.");
            res.redirect("/login");
    } else {
        next();
    }
};

module.exports = {isLoggedIn};

module.exports.saveRedirectUrl = (req,res,next)=>{
if(req.session.redirectUrl){
    res.locals.redirectUrl = req.session.redirectUrl;
    //So we store them in the locals and passport dont have authority to access them
}
next();
};

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
     if(!listing.owner.equals(res.locals.currUser._id)){
            req.flash("error", "You do not have permission to edit this listing you are not the owner");
            return res.redirect(`/listings/${id}`);
        }
    next();
};

 module.exports.validateListing = (req, res, next) => {
        //we have directly extracted error object from result
        //we are validating it by joi
        let {error} = listingSchema.validate(req.body);
        if(error){
            //The details object is carraying the list of additional details about the error
            //the below fuction means every element from the details object remove it message and join them with comma
            let errmsg = error.details.map((el) => el.message).join(",");
            throw new ExpressError(400, errmsg);
        }else{
            next();
        }
    }

module.exports.validateReview = (req, res, next) => {
        let {error} = reviewSchema.validate(req.body);
        if(error){
            let errmsg = error.details.map((el) => el.message).join(", ");
            throw new ExpressError(400, errmsg);
        }else{
            next();
        }
    }

    module.exports.isReviewAuthor = async (req, res, next) => {
    const {id,reviewId } = req.params;
    let review = await Review.findById(reviewId);
     if(!review.author.equals(res.locals.currUser._id)){
            req.flash("error", "You are not the author you dont have permission to delete this listing");
            return res.redirect(`/listings/${id}`);
        }
    next();
};