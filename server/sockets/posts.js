const Post = require("../mvc/models/post");
const { mkdirSync, writeFileSync } = require("fs");
const { Types } = require("mongoose");
const { remove, load, ImageIFD, dump, insert } = require("piexifjs");

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
        if (post.content.length > 128) {
            console.log("post too long");
            return;
        }
        if (post.attachments?.length > 4) {
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
                if (post.attachments[i].size > 8 * 1024 * 1024) {
                    console.log("file too large");
                    return;
                }
                if (
                    post.attachments[i].mimetype.toString() !== "image/jpeg" &&
                    post.attachments[i].mimetype.toString() !== "image/jpg" &&
                    post.attachments[i].mimetype.toString() !== "image/png" &&
                    post.attachments[i].mimetype.toString() !== "image/gif" &&
                    post.attachments[i].mimetype.toString() !== "image/webp"
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
                    const data = `data:${
                        post.attachments[i].mimetype
                    };base64,${post.attachments[i].data.toString("base64")}`;
                    const image64 = remove(data);
                    // Get orientation data
                    const oldExif = load(data);
                    const orientation = oldExif["0th"][ImageIFD.Orientation];
                    const newExif = {
                        // Keep the image orientation
                        "0th": { 274: orientation },
                        "1st": {},
                        Exif: {},
                        GPS: {},
                        Interop: {},
                        thumbnail: null
                    };

                    // Put orienation data into new image buffer
                    const exifString = dump(newExif);
                    imageData = Buffer.from(
                        insert(exifString, image64).split(";base64,")
                            .pop(),
                        "base64"
                    );
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
