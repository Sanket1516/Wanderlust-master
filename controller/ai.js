const Listing = require("../models/listing");
const Review = require("../models/review");
const { generateGeminiText, isAiConfigured } = require("../utils/ai");
const { chatWithGroq, isGroqConfigured, SYSTEM_PROMPT } = require("../utils/groqChat");

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

// ── Listings cache for chatbot context ────────────────────────────
let _listingsCache = null;
let _listingsCacheTime = 0;
const LISTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedListings() {
    const now = Date.now();
    if (_listingsCache && (now - _listingsCacheTime) < LISTINGS_CACHE_TTL) {
        return _listingsCache;
    }
    const listings = await Listing.find({})
        .select("title price location country category")
        .lean();
    _listingsCache = listings;
    _listingsCacheTime = now;
    return listings;
}

function formatListingsForPrompt(listings) {
    if (!listings || listings.length === 0) return "";
    const header = `\n\nCURRENT WANDERLUST LISTINGS (${listings.length} total):`;
    const lines = listings.map((l) => {
        const price = l.price ? `${l.price}/night` : "Price N/A";
        return `- ${l.title} | ${l.location}, ${l.country} | ${price} | ${l.category}`;
    });
    return header + "\n" + lines.join("\n");
}

// ── Chatbot (Groq) ────────────────────────────────────────────────
module.exports.chatMessage = async (req, res) => {
    if (!isGroqConfigured()) {
        return res.status(503).json({ error: "Chat is currently unavailable." });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Message is required." });
    }

    // Keep conversation history in the session (last 20 messages max)
    if (!req.session.chatHistory) {
        req.session.chatHistory = [];
    }

    req.session.chatHistory.push({ role: "user", content: message.trim() });

    // Trim to last 20 messages to keep token usage low
    if (req.session.chatHistory.length > 20) {
        req.session.chatHistory = req.session.chatHistory.slice(-20);
    }

    // Build listing-aware system prompt
    const listings = await getCachedListings();
    const listingsBlock = formatListingsForPrompt(listings);
    const systemPrompt = SYSTEM_PROMPT + listingsBlock;

    const result = await chatWithGroq(req.session.chatHistory, { systemPrompt });

    if (!result.ok) {
        return res.status(result.status || 500).json({ error: result.error });
    }

    req.session.chatHistory.push({ role: "assistant", content: result.message });

    return res.json({ success: true, reply: result.message });
};

module.exports.clearChat = (req, res) => {
    req.session.chatHistory = [];
    return res.json({ success: true });
};