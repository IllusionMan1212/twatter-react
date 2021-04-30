const Post = require("../models/post");
const { rmSync } = require("fs");
const { Types } = require("mongoose");
const User = require("../models/user");

const getPosts = (req, res) => {
    if (!req.params.page) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }

    if (req.params.userId) {
        const userId = Types.ObjectId(req.params.userId);
        Post.aggregate([
            { $match: { author: userId } },
            {
                $lookup: {
                    as: "author",
                    from: User.collection.name,
                    pipeline: [
                        {
                            $match: { _id: userId }
                        },
                        {
                            $project: {
                                display_name: 1,
                                username: 1,
                                profile_image: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    numberOfComments: { $size: "$comments" }
                }
            },
            {
                $lookup: {
                    as: "comments",
                    from: Post.collection.name,
                    let: { postComments: "$comments" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: [
                                    "$_id",
                                    "$$postComments"
                                ] }
                            }
                        },
                        {
                            $limit: 4
                        },
                        {
                            $lookup: {
                                as: "author",
                                from: User.collection.name,
                                let: { author: { $toObjectId: "$author" } },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: [
                                                "$_id",
                                                "$$author"
                                            ] }
                                        }
                                    },
                                    {
                                        $project: {
                                            display_name: 1,
                                            username: 1,
                                            profile_image: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: "$author"
                        }
                    ]
                }
            },
            { $unwind: "$author" },
            {
                $lookup: {
                    as: "replyingTo",
                    from: Post.collection.name,
                    let: { postId: { $toObjectId: "$replyingTo" } },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: [
                                "$_id",
                                "$$postId"
                            ] } }
                        },
                        {
                            $lookup: {
                                as: "author",
                                from: User.collection.name,
                                let: { author: { $toObjectId: "$author" } },
                                pipeline: [
                                    {
                                        $match: { $expr: { $eq: [
                                            "$_id",
                                            "$$author"
                                        ] } }
                                    },
                                    {
                                        $project: {
                                            display_name: 1,
                                            username: 1,
                                            profile_image: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: "$author"
                        }
                    ]
                }
            },
        ])
            .sort({ createdAt: -1 })
            .exec((err, posts) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        message: "An error occurred",
                        status: 500,
                        success: false
                    });
                    return;
                }
                res.status(200).json({
                    message: "Retrieved posts successfully",
                    posts,
                    status: 200,
                    success: true
                });
            });
    } else {
        Post.aggregate([
            { $match: { replyingTo: { $eq: null } } },
            {
                $lookup: {
                    as: "author",
                    from: User.collection.name,
                    let: { author: { $toObjectId: "$author" } },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: [
                                "$_id",
                                "$$author"
                            ] } }
                        },
                        {
                            $project: {
                                display_name: 1,
                                username: 1,
                                profile_image: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    numberOfComments: { $size: "$comments" }
                }
            },
            {
                $lookup: {
                    as: "comments",
                    from: Post.collection.name,
                    let: { postComments: "$comments" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: [
                                    "$_id",
                                    "$$postComments"
                                ] }
                            }
                        },
                        {
                            $limit: 4
                        },
                        {
                            $lookup: {
                                as: "author",
                                from: User.collection.name,
                                let: { author: { $toObjectId: "$author" } },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: [
                                                "$_id",
                                                "$$author"
                                            ] }
                                        }
                                    },
                                    {
                                        $project: {
                                            display_name: 1,
                                            username: 1,
                                            profile_image: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: "$author"
                        }
                    ]
                }
            },
            {
                $sort: { "createdAt": -1 }
            },
            {
                $skip: Number(req.params.page) * 50
            },
            {
                $limit: 50,
            },
            {
                $unwind: "$author"
            }
        ])
            .exec((err, posts) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        message: "An error occurred",
                        status: 500,
                        success: false
                    });
                    return;
                }
                res.status(200).json({
                    message: "Retrieved posts successfully",
                    posts,
                    status: 200,
                    success: true
                });
            });
    }
};

const deletePost = async (req, res) => {
    if (!req.body.postAuthor || !res.locals.userId || !req.body.postId) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }
    if (req.body.postAuthor.toString() !== res.locals.userId.toString()) {
        res.status(401).json({
            message: "Not authorized",
            status: 401,
            success: false
        });
        return;
    }
    // Remove the deleted comment from a post's comments array
    Post.updateOne({
        comments: req.body.postId
    }, { $pull: { comments: req.body.postId } }).exec((err) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false,
            });
        }
    });
    // Delete the comment or post
    await Post.findByIdAndDelete(req.body.postId, null, async (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false
            });
            return;
        }
        try {
            rmSync(`../cdn/posts/${req.body.postId}`, {
                recursive: true
            });
        } catch (err) {
            if (err.code !== "ENOENT") {
                res.status(500).json({
                    message: "An error has occurred",
                    status: 500,
                    success: false
                });
                return;
            }
        }

        /*
         * Delete the comments on the deleted post
         * TODO: remove this in the future and properly handle deleted posts in the client
         */
        try {
            await Post.deleteMany({ replyingTo: req.body.postId }).exec();
        } catch (err) {
            res.status(500).json({
                message:
                    "An error has occurred while deleting this post's comments",
                status: 500,
                success: false
            });
            return;
        }
        res.status(200).json({
            message: "Your post has been deleted",
            status: 200,
            success: true
        });
    });
};

const likePost = (req, res) => {
    if (!req.body.postId || !res.locals.userId || !req.body.likeType) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }
    if (req.body.likeType === "LIKE") {
        Post.findByIdAndUpdate(
            req.body.postId,
            { $addToSet: { likeUsers: res.locals.userId } },
            null,
            (err, post) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        message: "An error has occurred",
                        status: 500,
                        success: false
                    });
                    return;
                }
                if (!post) {
                    res.status(404).json({
                        message:
                            "The post you're trying to like has been deleted",
                        status: 404,
                        success: false
                    });
                    return;
                }
                res.status(200).json({
                    message: "Post has been liked",
                    status: 200,
                    success: true
                });
            }
        );
    } else if (req.body.likeType === "UNLIKE") {
        Post.findByIdAndUpdate(
            req.body.postId,
            { $pull: { likeUsers: res.locals.userId } },
            null,
            (err, post) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        message: "An error has occurred",
                        status: 500,
                        success: false
                    });
                    return;
                }
                if (!post) {
                    res.status(404).json({
                        message:
                            "The post you're trying to unlike has been deleted",
                        status: 404,
                        success: false
                    });
                    return;
                }
                res.status(200).json({
                    message: "Post has been unliked",
                    status: 200,
                    success: true
                });
            }
        );
    }
};

const getPost = (req, res) => {
    if (!req.query.postId || !req.query.username) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }
    if (req.query.postId.length < 24) {
        res.status(404).json({
            message: "Post not found",
            status: 404,
            success: false
        });
        return;
    }
    Post.aggregate([
        { $match: { _id: Types.ObjectId(req.query.postId) } },
        {
            $lookup: {
                as: "author",
                from: User.collection.name,
                let: { author: { $toObjectId: "$author" } },
                pipeline: [
                    {
                        $match: { $expr: { $eq: [
                            "$_id",
                            "$$author"
                        ] } }
                    },
                    {
                        $project: {
                            display_name: 1,
                            username: 1,
                            profile_image: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$author"
        },
        { $match: { "author.username": req.query.username } },
        {
            $lookup: {
                as: "comments",
                from: Post.collection.name,
                let: { postComments: "$comments" },
                pipeline: [
                    {
                        $match: { $expr: { $in: [
                            "$_id",
                            "$$postComments"
                        ] } }
                    },
                    {
                        $lookup: {
                            as: "author",
                            from: User.collection.name,
                            let: { author: { $toObjectId: "$author" } },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: [
                                            "$_id",
                                            "$$author"
                                        ] }
                                    }
                                },
                                {
                                    $project: {
                                        display_name: 1,
                                        username: 1,
                                        profile_image: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$author"
                    }
                ]
            }
        },
        {
            $lookup: {
                as: "replyingTo",
                from: Post.collection.name,
                let: { postId: { $toObjectId: "$replyingTo" } },
                pipeline: [
                    {
                        $match: { $expr: { $eq: [
                            "$_id",
                            "$$postId"
                        ] } }
                    },
                    {
                        $lookup: {
                            as: "author",
                            from: User.collection.name,
                            let: { author: { $toObjectId: "$author" } },
                            pipeline: [
                                {
                                    $match: { $expr: { $eq: [
                                        "$_id",
                                        "$$author"
                                    ] } }
                                },
                                {
                                    $project: {
                                        display_name: 1,
                                        username: 1,
                                        profile_image: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$author"
                    }
                ]
            }
        },
    ]).exec((err, posts) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false
            });
            return;
        }
        if (posts.length) {
            res.status(200).json({
                message: "Successfully retrieved post",
                post: posts[0],
                status: 200,
                success: true
            });
        } else {
            res.status(404).json({
                message: "Post not found",
                status: 404,
                success: false
            });
        }
    });
};

const getComments = (req, res) => {
    if (!req.params.postId) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }
    Post.aggregate([
        { $match: { replyingTo: Types.ObjectId(req.params.postId) } },
        {
            $lookup: {
                as: "author",
                from: User.collection.name,
                let: { author: { $toObjectId: "$author" } },
                pipeline: [
                    {
                        $match: { $expr: { $eq: [
                            "$_id",
                            "$$author"
                        ] } }
                    },
                    {
                        $project: {
                            display_name: 1,
                            username: 1,
                            profile_image: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$author"
        }
    ]).exec((err, comments) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false
            });
            return;
        }
        if (comments.length) {
            res.status(200).json({
                comments,
                message: "Fetched comments successfully",
                status: 200,
                success: true
            });
        } else {
            res.status(404).json({
                message: "Not found",
                status: 404,
                success: false
            });
        }
    });
};

module.exports = {
    deletePost,
    getComments,
    getPost,
    getPosts,
    likePost
};
