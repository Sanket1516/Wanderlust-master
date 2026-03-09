const Message = require("../models/message.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const { sendMail } = require("../utils/mailer.js");
const emailTemplates = require("../utils/emailTemplates.js");

// Helper: generate a deterministic conversationId from listing + two user IDs
function makeConversationId(listingId, userA, userB) {
    const sorted = [userA.toString(), userB.toString()].sort();
    return `${listingId}_${sorted[0]}_${sorted[1]}`;
}

// GET /messages — Inbox: list all conversations for logged-in user
module.exports.getConversations = async (req, res) => {
    const userId = req.user._id;

    // Find all messages where user is sender or receiver
    const messages = await Message.find({
        $or: [{ sender: userId }, { receiver: userId }]
    })
        .sort({ createdAt: -1 })
        .populate("listing", "title image")
        .populate("sender", "username")
        .populate("receiver", "username");

    // Group by conversationId, keep only the latest message per conversation
    const conversationMap = new Map();
    for (const msg of messages) {
        if (!conversationMap.has(msg.conversationId)) {
            conversationMap.set(msg.conversationId, {
                conversationId: msg.conversationId,
                listing: msg.listing,
                lastMessage: msg,
                otherUser: msg.sender._id.equals(userId) ? msg.receiver : msg.sender,
                unreadCount: 0
            });
        }
        // Count unread messages sent TO this user
        if (msg.receiver._id.equals(userId) && !msg.read) {
            conversationMap.get(msg.conversationId).unreadCount++;
        }
    }

    const conversations = Array.from(conversationMap.values());
    res.render("messages/inbox.ejs", { conversations });
};

// GET /messages/:conversationId — View a conversation thread
module.exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .populate("sender", "username")
        .populate("receiver", "username")
        .populate("listing", "title image");

    // Verify the user is part of this conversation
    if (messages.length > 0) {
        const first = messages[0];
        if (!first.sender._id.equals(userId) && !first.receiver._id.equals(userId)) {
            req.flash("error", "You don't have access to this conversation.");
            return res.redirect("/messages");
        }
    }

    // Mark unread messages sent to this user as read
    await Message.updateMany(
        { conversationId, receiver: userId, read: false },
        { $set: { read: true } }
    );

    // Determine the other user and listing for the header
    let otherUser = null;
    let listing = null;
    if (messages.length > 0) {
        const first = messages[0];
        otherUser = first.sender._id.equals(userId) ? first.receiver : first.sender;
        listing = first.listing;
    }

    res.render("messages/conversation.ejs", { messages, conversationId, otherUser, listing, currentUserId: userId });
};

// POST /messages/:conversationId — Send a message
module.exports.sendMessage = async (req, res) => {
    const { conversationId } = req.params;
    const { content, receiverId, listingId } = req.body;
    const senderId = req.user._id;

    if (!content || !content.trim()) {
        req.flash("error", "Message cannot be empty.");
        return res.redirect(`/messages/${conversationId}`);
    }

    const message = new Message({
        conversationId,
        listing: listingId,
        sender: senderId,
        receiver: receiverId,
        content: content.trim()
    });

    await message.save();

    // Send email notification to receiver (non-blocking)
    const receiver = await User.findById(receiverId);
    const listing = await Listing.findById(listingId);
    if (receiver && receiver.email && listing) {
        sendMail({
            to: receiver.email,
            subject: `New message about ${listing.title}`,
            html: emailTemplates.newMessageNotification({
                senderName: req.user.username,
                listingTitle: listing.title,
                messagePreview: content.trim().substring(0, 150)
            })
        });
    }

    res.redirect(`/messages/${conversationId}`);
};

// POST /messages/start — Start a new conversation (from "Message Host" button)
module.exports.startConversation = async (req, res) => {
    const { listingId, hostId, content } = req.body;
    const userId = req.user._id;

    if (userId.equals(hostId)) {
        req.flash("error", "You cannot message yourself.");
        return res.redirect(`/listings/${listingId}`);
    }

    if (!content || !content.trim()) {
        req.flash("error", "Message cannot be empty.");
        return res.redirect(`/listings/${listingId}`);
    }

    const conversationId = makeConversationId(listingId, userId, hostId);

    const message = new Message({
        conversationId,
        listing: listingId,
        sender: userId,
        receiver: hostId,
        content: content.trim()
    });

    await message.save();

    // Send email notification to host (non-blocking)
    const host = await User.findById(hostId);
    const listing = await Listing.findById(listingId);
    if (host && host.email && listing) {
        sendMail({
            to: host.email,
            subject: `New message about ${listing.title}`,
            html: emailTemplates.newMessageNotification({
                senderName: req.user.username,
                listingTitle: listing.title,
                messagePreview: content.trim().substring(0, 150)
            })
        });
    }

    res.redirect(`/messages/${conversationId}`);
};

module.exports.makeConversationId = makeConversationId;
