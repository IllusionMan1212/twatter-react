const Post = require("../mvc/models/post");
const { mkdirSync, writeFileSync } = require("fs");
const { Types } = require("mongoose");
const { remove, load, ImageIFD, dump, insert } = require("piexifjs");

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
        if (comment.content.length > 128) {
            console.log("post too long");
            return;
        }
        if (comment.attachments?.length > 4) {
            console.log("too many images");
            return;
        }
        const commentId = Types.ObjectId();
        const newComment = new Post();

        if (comment.attachments?.length) {
            mkdirSync(`cdn/posts/${commentId}`, { recursive: true });
            for (let i = 0; i < comment.attachments?.length; i++) {
                if (comment.attachments[i].size > 8 * 1024 * 1024) {
                    console.log("file too large");
                    return;
                }
                if (
                    comment.attachments[i].mimetype.toString() !== "image/jpeg" &&
                    comment.attachments[i].mimetype.toString() !== "image/jpg" &&
                    comment.attachments[i].mimetype.toString() !== "image/png" &&
                    comment.attachments[i].mimetype.toString() !== "image/gif" &&
                    comment.attachments[i].mimetype.toString() !== "image/webp"
                ) {
                    console.log(comment);
                    console.log("this file format is not supported");
                    return;
                }
                let imageData = "";
                if (
                    comment.attachments[i].mimetype.toString() === "image/jpeg" &&
                    comment.attachments[i].data
                        .toString("hex", 0, 2)
                        .toUpperCase() === "FFD8"
                ) {
                    const data = `data:${
                        comment.attachments[i].mimetype
                    };base64,${comment.attachments[i].data.toString("base64")}`;
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
