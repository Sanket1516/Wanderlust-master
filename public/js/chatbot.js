(() => {
    const fab = document.getElementById("chatbotFab");
    const win = document.getElementById("chatbotWindow");
    const closeBtn = document.getElementById("chatbotClose");
    const clearBtn = document.getElementById("chatbotClear");
    const messagesEl = document.getElementById("chatbotMessages");
    const input = document.getElementById("chatbotInput");
    const sendBtn = document.getElementById("chatbotSend");

    let sending = false;

    // Toggle chat window
    fab.addEventListener("click", () => {
        win.classList.toggle("open");
        if (win.classList.contains("open")) {
            input.focus();
        }
    });

    closeBtn.addEventListener("click", () => {
        win.classList.remove("open");
    });

    // Clear chat
    clearBtn.addEventListener("click", async () => {
        try {
            await fetch("/ai/chat", { method: "DELETE" });
        } catch (_) { /* ignore */ }
        // Reset to welcome message
        messagesEl.innerHTML =
            '<div class="chat-msg bot">Hi! I\'m WanderBot, your travel assistant. Ask me anything about destinations, travel tips, or using Wanderlust!</div>';
    });

    // Send message
    async function sendMessage() {
        const text = input.value.trim();
        if (!text || sending) return;

        sending = true;
        sendBtn.disabled = true;
        input.value = "";

        // Append user message
        appendMsg(text, "user");

        // Show typing indicator
        const typingEl = appendMsg("Thinking...", "typing");

        try {
            const res = await fetch("/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });

            const data = await res.json();

            // Remove typing indicator
            typingEl.remove();

            if (data.success) {
                appendMsg(data.reply, "bot");
            } else {
                appendMsg(data.error || "Something went wrong. Please try again.", "bot");
            }
        } catch (err) {
            typingEl.remove();
            appendMsg("Unable to reach the chat service. Please try again.", "bot");
        }

        sending = false;
        sendBtn.disabled = false;
        input.focus();
    }

    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function appendMsg(text, type) {
        const div = document.createElement("div");
        div.className = "chat-msg " + type;
        div.textContent = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }
})();
