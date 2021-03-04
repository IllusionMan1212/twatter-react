const { Schema, model } = require("mongoose");

const Post = new Schema({
    attachments: {
        type: [String]
    },
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
        maxlength: 128,
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
