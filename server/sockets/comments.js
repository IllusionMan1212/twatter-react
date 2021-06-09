const Post = require("../mvc/models/post");
const { mkdirSync, writeFileSync } = require("fs");
const { Types } = require("mongoose");
const { supportedFileTypes, postCharLimit, maxAttachments, fileSizeLimit } = require("../utils/variables");
const removeExif = require("../utils/helperFunctions");

const handleComments = (io, socket) => {
    socket.on("commentToServer", (comment) => {
        if (!comment.author) {
            socket.emit("error", "An error has occurred");
            return;
        }
        if (!comment.content && !comment.attachments.length) {
            socket.emit("error", "An error has occurred");
            return;
        }
        if (comment.contentLength > postCharLimit) {
            socket.emit("error", "Comment content exceeds limit");
            return;
        }
        if (comment.attachments?.length > maxAttachments) {
            socket.emit("error", "Too many attachments");
            return;
        }

        const commentId = Types.ObjectId();
        const newComment = new Post();

        if (comment.attachments?.length) {
            try {
                mkdirSync(`cdn/posts/${commentId}`, { recursive: true });
            } catch (err) {
                socket.emit("error", "An error has occurred");
                return;
            }
            for (let i = 0; i < comment.attachments?.length; i++) {
                if (comment.attachments[i].size > fileSizeLimit) {
                    socket.emit("error", "File size is limited to 8MB");
                    return;
                }
                if (
                    !supportedFileTypes.includes(comment.attachments[i].mimetype.toString())
                ) {
                    socket.emit("error", "This file format is not supported");
                    return;
                }
                let imageData = "";
                if (
                    comment.attachments[i].mimetype.toString() ===
                        "image/jpeg" &&
                    comment.attachments[i].data
                        .toString("hex", 0, 2)
                        .toUpperCase() === "FFD8"
                ) {
                    imageData = removeExif(comment.attachments[i]);
                } else {
                    imageData = comment.attachments[i].data;
                }

                const fileExtension = comment.attachments[i].name.substring(comment.attachments[i].name.lastIndexOf("."));
                writeFileSync(
                    `cdn/posts/${commentId}/${i + 1}${fileExtension}`,
                    imageData
                );
                let attachmentType = "";
                switch (comment.attachments[i].mimetype.substring(0, comment.attachments[i].mimetype.indexOf("/"))) {
                case "image":
                    switch (comment.attachments[i].mimetype.substring(comment.attachments[i].mimetype.length, comment.attachments[i].mimetype.indexOf("/") + 1)) {
                    case "gif":
                        attachmentType = "gif";
                        break;
                    default:
                        attachmentType = "image";
                        break;
                    }
                    break;
                case "video":
                    attachmentType = "video";
                    break;
                default:
                    socket.emit("error", "Unknown attachment type");
                    return;
                }
                const attachment = {
                    type: attachmentType,
                    url: `${process.env.DOMAIN_URL}/cdn/posts/${commentId}/${i + 1}${fileExtension}`,
                };
                newComment.attachments.push(attachment);
            }
        }

        newComment.content = comment.content.trim();
        newComment.author = comment.author._id;
        newComment._id = commentId;
        newComment.replyingTo = comment.replyingTo;

        newComment.save((err) => {
            if (err) {
                socket.emit("error", "An error has occurred");
                return;
            }
            Post.findByIdAndUpdate(comment.replyingTo, {
                $addToSet: { comments: commentId }
            }).exec();
            socket.emit("commentToClient", {
                ...newComment._doc,
                author: comment.author
            });
        });
    });
};

module.exports = handleComments;
