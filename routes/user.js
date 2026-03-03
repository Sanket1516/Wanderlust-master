const express = require("express");
const router = express.Router();
const User =  require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const {saveRedirectUrl} = require("../middleware.js");
const userController = require("../controller/users.js");
const user = require("../models/user.js");


router.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup))


//we use passort authenticate middleware before login to check eeather it exists or not
//It takes two parameters 
//1st strategy
//2nd If the authentication fails then where to redirect on which page
//flash = true if autyh fails then the flash message will be created and displayed
router.route("/login")
.get(userController.renderLoginForm)
.post(
    //we will first save the redirected url then we will go for the login
    saveRedirectUrl,
    passport.authenticate("local",
        {
        failureRedirect : "/login" , 
        failureFlash : true,
    }
),
userController.login);

//To logout the user
router.get("/logout",userController.logout);

module.exports = router;