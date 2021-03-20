const Post = require("../mvc/models/post");
const { mkdirSync, writeFileSync } = require("fs");
const { Types } = require("mongoose");
const removeExif = require("server/utils/helperFunctions");
const {
    fileSizeLimit,
    supportedFileTypes,
    maxAttachments,
    postCharLimit
} = require("server/utils/variables");

const handlePosts = (io, socket) => {
    socket.on("post", (post) => {
        if (!post.author) {
            console.log("no user");
            return;
        }
        if (!post.content && !post.attachments.length) {
            console.log("empty post");
            return;
        }
        if (post.content.length > postCharLimit) {
            console.log("post too long");
            return;
        }
        if (post.attachments?.length > maxAttachments) {
            console.log("too many images");
            return;
        }
        const postId = Types.ObjectId();
        const newPost = new Post();

        if (post.attachments?.length) {
            try {
                mkdirSync(`cdn/posts/${postId}`, { recursive: true });
            } catch (err) {
                console.log("err");
                console.log(err);
            }
            for (let i = 0; i < post.attachments?.length; i++) {
                if (post.attachments[i].size > fileSizeLimit) {
                    console.log("file too large");
                    return;
                }
                if (
                    !supportedFileTypes.includes(post.attachments[i].mimetype.toString())
                ) {
                    console.log(post);
                    console.log("this file format is not supported");
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
                console.log("error while saving");
                return;
            }
            console.log("success");
            io.emit("post", { ...newPost._doc,
                author: post.author });
        });
    });

    socket.on("deletePost", ({ postId }) => {
        socket.emit("deletePost", postId);
    });
};

module.exports = handlePosts;
