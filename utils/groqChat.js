const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function getGroqApiKey() {
    return process.env.GROQ_API_KEY;
}

function isGroqConfigured() {
    return Boolean(getGroqApiKey());
}

const SYSTEM_PROMPT = [
    "You are WanderBot, a friendly and helpful travel assistant for Wanderlust — an Airbnb-style travel platform.",
    "You help users with:",
    "- Finding and choosing travel destinations",
    "- Tips about listings, accommodations, and local experiences",
    "- Booking guidance and travel planning",
    "- General travel advice (packing, budgeting, safety, visas)",
    "",
    "When the user asks about available places, accommodations, or prices, refer to the CURRENT WANDERLUST LISTINGS provided below.",
    "Recommend specific listings by name, price, location, and category when relevant.",
    "When recommending a listing, mention its name, location, price per night, and category.",
    "If no listings match what the user wants, say so honestly and suggest they check back later.",
    "Do not invent listings that are not in the provided list.",
    "",
    "Keep responses concise (under 150 words unless the user asks for detail).",
    "Be warm and conversational. Use plain text, no markdown formatting.",
    "If asked about something unrelated to travel or the platform, politely redirect.",
].join("\n");

/**
 * Send a chat message to Groq and get a response.
 * @param {Array<{role: string, content: string}>} messages  Conversation history
 * @param {object} options  Optional temperature / maxTokens overrides
 * @returns {Promise<{ok: boolean, message?: string, error?: string, status?: number}>}
 */
async function chatWithGroq(messages, options = {}) {
    const apiKey = getGroqApiKey()?.trim();

    if (!apiKey) {
        return {
            ok: false,
            status: 503,
            error: "Chat features are currently unavailable.",
        };
    }

    const temperature = typeof options.temperature === "number" ? options.temperature : 0.7;
    const maxTokens = Number.isInteger(options.maxTokens) ? options.maxTokens : 512;

    const systemContent = options.systemPrompt || SYSTEM_PROMPT;

    const fullMessages = [
        { role: "system", content: systemContent },
        ...messages,
    ];

    try {
        const requestBody = {
            model: GROQ_MODEL,
            messages: fullMessages,
            temperature,
            max_tokens: maxTokens,
        };

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        const payload = await response.json();

        if (!response.ok) {
            const apiMessage = payload.error?.message || "Chat generation failed. Please try again.";
            console.error("Groq API error:", response.status, JSON.stringify(payload));
            return {
                ok: false,
                status: response.status,
                error: apiMessage,
            };
        }

        const text = payload.choices?.[0]?.message?.content || "";
        if (!text) {
            return {
                ok: false,
                status: 502,
                error: "AI did not return a response.",
            };
        }

        return { ok: true, message: text.trim() };
    } catch (err) {
        console.error("Groq fetch error:", err);
        return {
            ok: false,
            status: 500,
            error: "Unable to reach chat service right now.",
        };
    }
}

module.exports = {
    isGroqConfigured,
    chatWithGroq,
    SYSTEM_PROMPT,
};
