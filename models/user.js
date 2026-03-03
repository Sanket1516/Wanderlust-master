const mongoose = require("mongoose");
const schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new schema({
    email : {
        type : String,
        required : true
    }
})
//no need to add the username and password fields saltfield and hashfield it will be handled by the plugin automatically
userSchema.plugin(passportLocalMongoose);
//it will also add a method to the user model called authenticate which can be used to authenticate users and also the various methods for our object
module.exports = mongoose.model("User", userSchema);