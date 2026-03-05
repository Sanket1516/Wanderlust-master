const Listing = require("../models/listing");
const Review = require("../models/review");
const { generateGeminiText, isAiConfigured } = require("../utils/ai");

module.exports.generateListingDescription = async (req, res) => {
    const { title, location, country, category, price } = req.body || {};

    if (!title || !location || !country || !category) {
        return res.status(400).json({
            error: "Title, location, country, and category are required.",
        });
    }

    if (!isAiConfigured()) {
        return res.status(503).json({
            error: "AI features are currently unavailable.",
        });
    }

    const prompt = [
        "You write Airbnb-style listing descriptions.",
        "Generate one compelling property description in plain text.",
        "Constraints:",
        "- 90 to 130 words",
        "- warm, clear, trustworthy tone",
        "- no markdown, no bullet points, no emojis",
        "- avoid fake claims",
        "- include nearby vibe and ideal guests",
        "- end with one inviting sentence",
        "",
        `Title: ${title}`,
        `Location: ${location}`,
        `Country: ${country}`,
        `Category: ${category}`,
        `Price per night (INR): ${price || "Not provided"}`,
    ].join("\n");

    const result = await generateGeminiText(prompt, {
        temperature: 0.7,
        maxOutputTokens: 260,
    });

    if (!result.ok) {
        return res.status(result.status || 500).json({ error: result.error });
    }

    return res.json({ success: true, description: result.text });
};

module.exports.generateReviewSummary = async (req, res) => {
    const listingId = req.params.id;

    const listing = await Listing.findById(listingId).select("title location country reviews");
    if (!listing) {
        return res.status(404).json({ error: "Listing not found." });
    }

    const reviewIds = Array.isArray(listing.reviews) ? listing.reviews : [];
    if (!reviewIds.length) {
        return res.status(400).json({ error: "No reviews available for summary yet." });
    }

    const reviews = await Review.find({ _id: { $in: reviewIds } })
        .populate("author", "username")
        .sort({ createdAt: -1 })
        .limit(40);

    if (!reviews.length) {
        return res.status(400).json({ error: "No reviews available for summary yet." });
    }

    if (!isAiConfigured()) {
        return res.status(503).json({ error: "AI features are currently unavailable." });
    }

    const avgRating = (
        reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
    ).toFixed(1);

    const compactReviews = reviews.map((review) => {
        const author = review.author && review.author.username ? review.author.username : "Guest";
        const comment = (review.comment || "").replace(/\s+/g, " ").trim();
        return `- ${author} (${review.rating || "N/A"}/5): ${comment}`;
    });

    const prompt = [
        "You summarize travel stay reviews for guests.",
        "Create a concise, balanced summary in plain text.",
        "Output format (exactly):",
        "1) One 2-sentence overall summary.",
        "2) Line starting with 'Highlights:' followed by 3 short comma-separated positives.",
        "3) Line starting with 'Watch-outs:' followed by up to 2 short caveats (or 'None noted').",
        "Rules: no markdown, no bullets, no fabricated details.",
        "",
        `Listing: ${listing.title} (${listing.location}, ${listing.country})`,
        `Review count: ${reviews.length}`,
        `Average rating: ${avgRating}/5`,
        "Recent reviews:",
        ...compactReviews,
    ].join("\n");

    const result = await generateGeminiText(prompt, {
        temperature: 0.4,
        maxOutputTokens: 320,
    });

    if (!result.ok) {
        return res.status(result.status || 500).json({ error: result.error });
    }

    return res.json({
        success: true,
        summary: result.text,
        meta: {
            reviewCount: reviews.length,
            averageRating: Number(avgRating),
        },
    });
};