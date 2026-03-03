const mongoose = require("mongoose");
const schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new schema({
    email : {
        type : String,
        required : true
    },
    wishlist: [
        {
            // ObjectId reference to the "listing" model (lowercase — must match mongoose.model("listing",...) in listing.js)
            // This stores an array of listing IDs that the user has saved/hearted
            // Many-to-Many relationship: one user can save many listings, one listing can be saved by many users
            type: schema.Types.ObjectId,
            ref: "listing"
        }
    ]
    // NOTE: No migration needed — Mongoose returns [] by default for missing array fields on existing documents
})
//no need to add the username and password fields saltfield and hashfield it will be handled by the plugin automatically
userSchema.plugin(passportLocalMongoose);
//it will also add a method to the user model called authenticate which can be used to authenticate users and also the various methods for our object
module.exports = mongoose.model("User", userSchema);