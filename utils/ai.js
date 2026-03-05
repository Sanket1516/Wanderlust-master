const COHERE_MODEL = process.env.COHERE_MODEL || "command-a-03-2025";

function getCohereApiKey() {
    return process.env.COHERE_API_KEY;
}

function isAiConfigured() {
    return Boolean(getCohereApiKey());
}

async function generateAIText(prompt, options = {}) {
    const apiKey = getCohereApiKey();
    if (!apiKey) {
        return {
            ok: false,
            status: 503,
            error: "AI features are currently unavailable.",
        };
    }

    const temperature = typeof options.temperature === "number" ? options.temperature : 0.6;
    const maxTokens = Number.isInteger(options.maxOutputTokens) ? options.maxOutputTokens : 350;

    const endpoint = "https://api.cohere.com/v2/chat";

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: COHERE_MODEL,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature,
                max_tokens: maxTokens,
            }),
        });

        const payload = await response.json();

        if (!response.ok) {
            const apiMessage =
                (payload.message) || "AI generation failed. Please try again shortly.";
            console.error("Cohere API error:", response.status, JSON.stringify(payload));
            return {
                ok: false,
                status: response.status,
                error: apiMessage,
                details: payload,
            };
        }

        // Extract text from Cohere v2 chat response
        const text =
            payload.message &&
            payload.message.content &&
            Array.isArray(payload.message.content) &&
            payload.message.content.length > 0
                ? payload.message.content[0].text
                : "";

        if (!text) {
            return {
                ok: false,
                status: 502,
                error: "AI did not return usable text.",
            };
        }

        return { ok: true, text: text.trim() };
    } catch (err) {
        console.error("Cohere fetch error:", err);
        return {
            ok: false,
            status: 500,
            error: "Unable to reach AI service right now.",
        };
    }
}

module.exports = {
    isAiConfigured,
    generateGeminiText: generateAIText,
};
