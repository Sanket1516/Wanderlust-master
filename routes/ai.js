const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const aiController = require("../controller/ai");

// Generate a listing description suggestion from form inputs.
router.post(
    "/ai/listings/description",
    isLoggedIn,
    wrapAsync(aiController.generateListingDescription)
);

// Generate an AI summary from current listing reviews.
router.get(
    "/ai/listings/:id/review-summary",
    wrapAsync(aiController.generateReviewSummary)
);

module.exports = router;