const Post = require("../mvc/models/post");
const { mkdirSync, writeFileSync } = require("fs");
const { Types } = require("mongoose");
const { supportedFileTypes, postCharLimit, maxAttachments, fileSizeLimit } = require("../utils/variables");
const removeExif = require("../utils/helperFunctions");

const handleComments = (io, socket) => {
    socket.on("commentToServer", (comment) => {
        if (!comment.author) {
            console.log("no user");
            return;
        }
        if (!comment.content && !comment.attachments.length) {
            console.log("empty post");
            return;
        }
        if (comment.content.length > postCharLimit) {
            console.log("post too long");
            return;
        }
        if (comment.attachments?.length > maxAttachments) {
            console.log("too many images");
            return;
        }

        const commentId = Types.ObjectId();
        const newComment = new Post();

        if (comment.attachments?.length) {
            mkdirSync(`cdn/posts/${commentId}`, { recursive: true });
            for (let i = 0; i < comment.attachments?.length; i++) {
                if (comment.attachments[i].size > fileSizeLimit) {
                    console.log("file too large");
                    return;
                }
                if (
                    !supportedFileTypes.includes(comment.attachments[i].mimetype.toString())
                ) {
                    console.log(comment);
                    console.log("this file format is not supported");
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
                newComment.attachments.push(`${process.env.DOMAIN_URL}/cdn/posts/${commentId}/${
                    i + 1
                }${fileExtension}`);
            }
        }

        newComment.content = comment.content.trim();
        newComment.author = comment.author._id;
        newComment._id = commentId;
        newComment.replyingTo = comment.replyingTo;

        newComment.save((err) => {
            if (err) {
                console.log("error while saving");
                return;
            }
            Post.findByIdAndUpdate(comment.replyingTo, {
                $addToSet: { comments: commentId }
            }).exec();
            console.log("success");
            socket.emit("commentToClient", {
                ...newComment._doc,
                author: comment.author
            });
        });
    });
};

module.exports = handleComments;
