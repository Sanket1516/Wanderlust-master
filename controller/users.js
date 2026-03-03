const User = require("../models/user.js");


module.exports.signup = async (req, res,next)=>{
    try{
    let {username, email, password} = req.body;
    const newUser = new User({email, username});
    const registeredUser = await User.register(newUser, password);
    //added auto login after signup functionality
    req.login(registeredUser, (err)=>{
        if(err){
            next(err);
        }
        req.flash("success", "Welcome to wanderlust");
        res.redirect("/listings");
    });
} catch(error){
    req.flash("error", error.message);
    res.redirect("/signup");
}

//here we used try catch because to impliment the functionality of if name is already exists then dont show only eror and stuck redirect to the teh signup again and fill the info again
};

module.exports.renderSignupForm = (req,res)=>{
    res.render("users/signup.ejs");
};

module.exports.renderLoginForm = (req,res)=>{
    res.render("users/login.ejs");
};

module.exports.login = async(req,res)=>{
    req.flash("success","Welcome Back To wanderlust ");
    //we have redirected to the particular path
    // res.redirect(req.sesion.redirectUrl);
    //we have problem with the passport that it resets the session after every login so the session related info will be deleted
    //so now the the req.seesion.redirect url is  empty and unacccible
    //so we will store it in locals
    //  res.redirect(res.locals.redirectUrl);
     //now it is also having one flaw if we dircrtly login then we are getting the reirect url undefined
     //so
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next)=>{
    //if we are any error while logging out then it will be tackled here if passport middleware gets failed
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success", "You are logged out");
        res.redirect("/listings");
    });
};