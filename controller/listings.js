const Listing = require("../models/listing");
// const mbxTilesets = require('@mapbox/mapbox-sdk/services/tilesets');
//just replacem the type of service we use in the place of tilesets we will use geocoding of mapbox
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });//we have now created a box which will allow us to do the geocoding stuff and also oythers in mapbox if we want






module.exports.index = async (req, res,next) => {
        const allListings = await Listing.find({}); // Fetch all listings from the database
        res.render("listings/index.ejs", { allListings }); // Render the index page with all listings
        return;
};

module.exports.renderNewForm = (req, res) => {
        // //To check if the user which is trying to create the new listing must be authenticated or login to create a new listing
        // //We have the passport method is authenticated to check whether the user is logged in or not in current session
        // if(!req.isAuthenticated()){
        //     req.flash("error", "You must be logged in to create a listing.");
        //     return res.redirect("/login");
        // }
        //Transferred this logic to middleware
        res.render("listings/newlisting.ejs");
        return;
};

module.exports.showListing = async (req, res) => {
        let { id } = req.params; // Destructure ID from URL parameters
        let data = await Listing.findById(id)
        //it says populate the author field of each review and for each reviews also populate the author which is assosciated to that review
        .populate({
            path : "reviews",
            populate : {
                path : "author",
        },
     })
     .populate("owner");

        // Important: Handle case where a listing with the given ID is not found
        if (!data) {
            req.flash("error", "Listing Not Found!");
            res.redirect("/listings");
        }
        res.render("listings/show.ejs", { data }); // Render the show page with listing data
        return;
    };

module.exports.createNewListing = async (req, res) => {
        let response = await geocodingClient.forwardGeocode({
        // query: 'New Delhi, India', //this is just for testing purpose we will replace it with the location which the user has entered in the form
        query: req.body.listing.location, //we will get the location from the form which the user has entered
        limit: 1 ,// it says how much posibble coordinates can we get
        })
        .send();

        // console.log(response.body.features[0].geometry); //in response there is body in that there is features array in that the first element of that array there is geometry object which has the coordinates
        // res.send("geo coding done");
        
        let url = req.file.path;
        let filename = req.file.filename;
        //if we validate like this every time it it repetative task so we will make an middelware for it forst it will called then async function will be called
        // let result = listingSchema.validate(req.body);
        // if (result.error) {
        //     throw new ExpressError(400, result.error.message);
        // }
        let newlisting = new Listing( // Create a new listing instance
            req.body.listing
        );
        newlisting.owner = req.user._id; // Set the owner of the listing to the authenticated user
        newlisting.image = {url,filename}; // Set the image URL and filename from the uploaded file
        newlisting.geometry = response.body.features[0].geometry; // Set the geometry from the geocoding response   
        let savedListing = await newlisting.save(); // Save the new listing to the database
        
        req.flash("success", "New Listing Created!");
        res.redirect("/listings"); // Redirect to the listings index page after saving
        return;
    };

module.exports.renderEditForm = async (req, res) => {
        let { id } = req.params; // Destructure ID from URL parameters
        let data = await Listing.findById(id); // Find listing by ID

        // Important: Handle case where a listing with the given ID is not found
        if (!data) {
            req.flash("error", "Listing Not Found!");
            res.redirect("/listings");
        }
         
        let OriginalImageURL = data.image.url;
        OriginalImageURL = OriginalImageURL.replace("/upload","/upload/w_250"); // Resize the image for display purposes 
        res.render("listings/edit.ejs", { data , OriginalImageURL }); // Render the edit page with listing data
        return;
    };

module.exports.updateListing = async (req, res) => {
        let { id } = req.params; // Destructure ID from URL parameters
        // Find and update the listing with data from the request body

        //this is logic for the server side validation
        // let listing = await Listing.findById(id);
        // if(!listing.owner.equals(res.locals.currUser._id)){
        //     req.flash("error", "You do not have permission to edit this listing!");
        //     return res.redirect(`/listings/${id}`);
        // }
        
       let listing = await Listing.findByIdAndUpdate(id, {
           ...req.body.listing
       });

       //First it will save all the data else than the image then it will check if the image is there or not
       //if it is there then only it will update the image
       if(typeof req.file !== 'undefined'){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename}; // Update the image URL and filename from the uploaded file
        await listing.save(); // Save the updated listing to the database
       }

       req.flash("success", "Successfully updated listing!");
       res.redirect(`/listings/${id}`); // Redirect to the updated listing's show page
       return;
    }

    module.exports.destroyListing = async (req, res) => {
        let { id } = req.params; // Destructure ID from URL parameters
        let deleted_listing = await Listing.findByIdAndDelete(id); // Find and delete the listing
        req.flash("success", `Successfully deleted ${deleted_listing.title}`);
        res.redirect("/listings"); // Redirect to the listings index page after deletion

        return;
    }