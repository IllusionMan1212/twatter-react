const { Schema, model } = require("mongoose");

const Attachment = new Schema({
    type: {
        required: true,
        type: String,
    },
    url: {
        required: true,
        type: String,
    }
});

const Post = new Schema({
    attachments: [Attachment],
    author: {
        ref: "User",
        required: true,
        type: Schema.Types.ObjectId
    },
    comments: [
        {
            default: [],
            ref: "Post",
            type: Schema.Types.ObjectId
        }
    ],
    content: {
        // Note: no maxlength because the db counts linebreaks as chars
        type: String
    },
    createdAt: {
        default: Date.now,
        required: true,
        type: Date
    },
    likeUsers: {
        default: [],
        required: true,
        type: [String]
    },
    replyingTo: {
        default: null,
        ref: "Post",
        type: Schema.Types.ObjectId,
    }
});

module.exports = model("Post", Post);
