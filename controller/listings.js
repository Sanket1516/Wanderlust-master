const Listing = require("../models/listing");
// const mbxTilesets = require('@mapbox/mapbox-sdk/services/tilesets');
//just replacem the type of service we use in the place of tilesets we will use geocoding of mapbox
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });//we have now created a box which will allow us to do the geocoding stuff and also oythers in mapbox if we want

module.exports.index = async (req, res, next) => {
        const { minPrice, maxPrice, country, category, sort, page } = req.query;

        // Build dynamic MongoDB filter from query params
        let filter = {};

        // Price range
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice && !isNaN(minPrice)) filter.price.$gte = Number(minPrice);
            if (maxPrice && !isNaN(maxPrice)) filter.price.$lte = Number(maxPrice);
        }

        // Country filter (partial, case-insensitive)
        if (country && country.trim()) {
            filter.country = { $regex: country.trim(), $options: "i" };
        }

        // Category filter (exact match; "All" means no filter)
        if (category && category !== "All") {
            filter.category = category;
        }

        // Sort option
        let sortOption = {};
        if (sort === "price_asc")       sortOption = { price:  1 };
        else if (sort === "price_desc") sortOption = { price: -1 };
        else if (sort === "newest")     sortOption = { _id:   -1 };

        // ── PAGINATION ────────────────────────────────────────────────────
        // How many listings to show per page — changing this one constant
        // automatically adjusts skip, totalPages, and the result-count label in the view.
        const LIMIT = 12;

        // Parse the ?page= query param; fall back to 1 if missing or non-numeric.
        // Math.max(1, ...) ensures the page never goes below 1 even if someone passes ?page=0.
        const currentPage = Math.max(1, parseInt(page) || 1);

        // Count how many documents match the current filter WITHOUT fetching them.
        // This is a lightweight MongoDB operation — no documents are loaded into memory.
        // We need this number to calculate totalPages and to show "Showing X–Y of Z" in the view.
        const totalCount = await Listing.countDocuments(filter);

        // Calculate how many pages are needed.
        // Math.ceil rounds up so a partial last page still counts (e.g. 13 docs → 2 pages).
        // The "|| 1" fallback ensures totalPages is never 0 when there are no listings.
        const totalPages = Math.ceil(totalCount / LIMIT) || 1;

        // Clamp the requested page to the valid range [1, totalPages].
        // Protects against ?page=9999 when only 3 pages exist — instead of an empty result
        // it silently shows the last page.
        const safePage = Math.min(currentPage, totalPages);

        // Fetch only the listings for the current page using skip + limit.
        // skip((safePage - 1) * LIMIT) — jump past all listings on earlier pages.
        // limit(LIMIT) — take at most LIMIT documents from that offset.
        const allListings = await Listing.find(filter)
            .sort(sortOption)
            .skip((safePage - 1) * LIMIT)  // offset: how many docs to skip before this page
            .limit(LIMIT);                  // cap: maximum docs to return for this page

        // ── PAGE NUMBER ARRAY ─────────────────────────────────────────────
        // Build the array that the EJS template loops over to render page buttons.
        // Entries are either integers (clickable page numbers) or the string "..."
        // (non-clickable ellipsis gap).  All logic lives here so the template stays clean.
        const pageNumbers = [];

        if (totalPages <= 7) {
            // Fewer than 8 pages — show every page number with no ellipsis needed.
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            // Many pages — use the smart condensed pattern:
            // [1, '...', prev, current, next, '...', last]

            pageNumbers.push(1);  // first page is always visible

            // Add a leading ellipsis when the current page is far from the start
            // (gap of more than 1 between page 1 and the window start)
            if (safePage > 3) pageNumbers.push("...");

            // Window of pages around the current page: [current-1, current, current+1]
            // Math.max(2, ...) stops the window from overlapping page 1.
            // Math.min(totalPages-1, ...) stops it from overlapping the last page.
            const start = Math.max(2, safePage - 1);           // first page in the window
            const end   = Math.min(totalPages - 1, safePage + 1); // last page in the window
            for (let i = start; i <= end; i++) pageNumbers.push(i); // push window pages

            // Add a trailing ellipsis when the current page is far from the end
            if (safePage < totalPages - 2) pageNumbers.push("...");

            pageNumbers.push(totalPages); // last page is always visible
        }

        // Build a JavaScript Set of the logged-in user's wishlisted listing IDs (as strings).
        const wishlistSet = new Set(
            req.user ? req.user.wishlist.map(id => id.toString()) : []
        );

        res.render("listings/index.ejs", {
            allListings,
            wishlistSet,
            filters: req.query,
            // Pass the full pagination object so the template can render the bar
            // and the "Showing X–Y of Z" result count without doing any math itself.
            pagination: {
                currentPage: safePage, // the actual page being shown (clamped)
                totalPages,            // total number of pages for this filter
                totalCount,            // total matching listings (for result count label)
                LIMIT,                 // docs per page (used in the view for from/to calc)
                pageNumbers            // pre-built array of numbers + "..." for the page buttons
            }
        });
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
            return res.redirect("/listings"); // "return" is critical — prevents Express from continuing to res.render below
        }

        // Build wishlistSet so the show page knows whether to render a filled or outline heart button.
        // Same pattern as the index controller — Set of stringified ObjectIds for O(1) template lookup.
        const wishlistSet = new Set(
            req.user ? req.user.wishlist.map(id => id.toString()) : []
        );

        res.render("listings/show.ejs", { data, wishlistSet }); // Render the show page with listing data
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

        const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1506974210756-8e1b8985d348?w=1200&auto=format&fit=crop";
        const DEFAULT_FILENAME  = "default_listing";
        let url      = req.file ? req.file.path     : DEFAULT_IMAGE_URL;
        let filename = req.file ? req.file.filename : DEFAULT_FILENAME;
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