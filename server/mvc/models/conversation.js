const { Schema, model } = require("mongoose");

const Conversation = new Schema({
    lastMessage: {
        // TODO: this should probably be a ref when encryption is implemented
        type: String
    },
    lastUpdated: {
        type: Date
    },
    members: [
        {
            ref: "User",
            required: true,
            type: Schema.Types.ObjectId,
        }
    ],
    participants: [
        {
            ref: "User",
            required: true,
            type: Schema.Types.ObjectId,
        }
    ],
});

module.exports = model("Conversation", Conversation);
