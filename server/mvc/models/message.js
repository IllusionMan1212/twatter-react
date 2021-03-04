const { Schema, model } = require("mongoose");

const Message = new Schema({
    attachment: {
        type: String
    },
    content: {
        type: String
    },
    conversation: {
        ref: "Conversation",
        required: true,
        type: Schema.Types.ObjectId,
    },
    ownerId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    readBy: [
        {
            required: true,
            type: Schema.Types.ObjectId,
        }
    ],
    sentTime: {
        default: Date.now,
        required: true,
        type: Date,
    },
});

module.exports = model("Message", Message);
