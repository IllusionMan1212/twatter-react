const Post = require("../mvc/models/post");
const { mkdirSync, writeFileSync } = require("fs");
const { Types } = require("mongoose");
const removeExif = require("../utils/helperFunctions");
const {
    fileSizeLimit,
    supportedFileTypes,
    maxAttachments,
    postCharLimit
} = require("../utils/variables");

const handlePosts = (io, socket) => {
    socket.on("post", (post) => {
        if (!post.author) {
            socket.emit("error", "An error has occurred");
            return;
        }
        if (!post.content && !post.attachments.length) {
            socket.emit("error", "An error has occurred");
            return;
        }
        if (post.content.length > postCharLimit) {
            socket.emit("error", "Post content exceeds limit");
            return;
        }
        if (post.attachments?.length > maxAttachments) {
            socket.emit("error", "Too many attachments");
            return;
        }
        const postId = Types.ObjectId();
        const newPost = new Post();

        if (post.attachments?.length) {
            try {
                mkdirSync(`cdn/posts/${postId}`, { recursive: true });
            } catch (err) {
                socket.emit("error", "An error has occurred");
                return;
            }
            for (let i = 0; i < post.attachments?.length; i++) {
                if (post.attachments[i].size > fileSizeLimit) {
                    socket.emit("error", "File size is limited to 8MB");
                    return;
                }
                if (
                    !supportedFileTypes.includes(post.attachments[i].mimetype.toString())
                ) {
                    socket.emit("error", "This file format is not supported");
                    return;
                }

                let imageData = "";
                if (
                    post.attachments[i].mimetype.toString() === "image/jpeg" &&
                    post.attachments[i].data
                        .toString("hex", 0, 2)
                        .toUpperCase() === "FFD8"
                ) {
                    imageData = removeExif(post.attachments[i]);
                } else {
                    imageData = post.attachments[i].data;
                }

                const fileExtension = post.attachments[i].name.substring(post.attachments[i].name.lastIndexOf("."));
                writeFileSync(
                    `cdn/posts/${postId}/${i + 1}${fileExtension}`,
                    imageData
                );
                newPost.attachments.push(`${process.env.DOMAIN_URL}/cdn/posts/${postId}/${
                    i + 1
                }${fileExtension}`);
            }
        }

        newPost.content = post.content.trim();
        newPost.author = post.author._id;
        newPost._id = postId;

        newPost.save((err) => {
            if (err) {
                socket.emit("error", "An error has occurred");
                return;
            }
            socket.emit("post", { ...newPost._doc,
                author: post.author });
        });
    });

    socket.on("deletePost", ({ postId }) => {
        socket.emit("deletePost", postId);
    });

    socket.on("likeToServer", (payload) => {
        console.log(payload);
        socket.emit("likeToClient", payload);
    });
};

module.exports = handlePosts;
