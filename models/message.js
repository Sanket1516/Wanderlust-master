const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "listing",
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Message", messageSchema);
