const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const messageController = require("../controller/message.js");

// GET /messages — Inbox page
router.get("/messages", isLoggedIn, wrapAsync(messageController.getConversations));

// POST /messages/start — Start a new conversation from listing page
router.post("/messages/start", isLoggedIn, wrapAsync(messageController.startConversation));

// GET /messages/:conversationId — View a conversation thread
router.get("/messages/:conversationId", isLoggedIn, wrapAsync(messageController.getMessages));

// POST /messages/:conversationId — Send a message in a conversation
router.post("/messages/:conversationId", isLoggedIn, wrapAsync(messageController.sendMessage));

module.exports = router;
