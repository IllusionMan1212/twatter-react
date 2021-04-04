const Conversation = require("../models/conversation");
const User = require("../models/user");
const Message = require("../models/message");
const { Types } = require("mongoose");

const startConversation = (req, res) => {
    if (!req.body.senderId || !req.body.receiverId) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }

    if (req.body.senderId.toString() === req.body.receiverId.toString()) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }

    Conversation.findOne(
        { members: { $all: [
            req.body.senderId,
            req.body.receiverId
        ] } },
        (err, conversation) => {
            if (err) {
                console.error(err);
                res.status(500).json({
                    message: "An error has occurred",
                    status: 500,
                    success: false
                });
                return;
            }
            if (conversation) {
                // If the convo exists and the sender isn't a participant of the convo, add them to the participants array
                if (!conversation.participants.includes(req.body.senderId)) {
                    conversation.participants.push(req.body.senderId);
                    conversation.save();
                }
                res.status(200).json({
                    conversationId: conversation._id,
                    message: "OK",
                    status: 200,
                    success: true
                });
            } else {
                const newConversation = new Conversation();
                const conversationId = new Types.ObjectId();
                newConversation._id = conversationId;
                newConversation.participants.push(req.body.senderId);
                newConversation.members.push(req.body.senderId);
                newConversation.members.push(req.body.receiverId);
                newConversation.lastUpdated = new Date();
                newConversation.save(async (err, savedConversation) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({
                            message: "An error has occurred",
                            status: 500,
                            success: false
                        });
                        return;
                    }
                    await User.findByIdAndUpdate(req.body.senderId, {
                        $addToSet: {
                            conversations: savedConversation._id
                        }
                    }).exec();
                    res.status(201).json({
                        conversationId,
                        message: "Conversation created",
                        status: 201,
                        success: true
                    });
                });
            }
        }
    );
};

const getConversations = (_req, res) => {
    const { userId } = res.locals;

    /*
     * TODO: get only the first uhh 20 (maybe) conversations if a user has a lot so that we dont stress the DB
     * TODO: and then load another 20 if the user scrolls all the way to the bottom or whatever
     */
    Conversation.aggregate([
        {
            $match: { participants: userId }
        },
        {
            $lookup: {
                as: "members",
                from: User.collection.name,
                let: { members: "$members" },
                pipeline: [
                    {
                        $match: { $expr: { $in: [
                            "$_id",
                            "$$members"
                        ] } }
                    },
                    {
                        $project: {
                            display_name: 1,
                            profile_image: 1,
                            username: 1,
                        }
                    },
                ]
            }
        },
        {
            $lookup: {
                as: "unreadMessages",
                from: Message.collection.name,
                let: { conversationId: { $toObjectId: "$_id" } },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            // Find the messages in this conversation
                                            "$conversation",
                                            "$$conversationId"
                                        ]
                                    },
                                    {
                                        $not: {
                                            // Find the messages that aren't read by the user
                                            $in: [
                                                Types.ObjectId(userId),
                                                "$readBy"
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $group: { _id: null,
                            sum: { $sum: 1 } }
                    }
                ]
            }
        }
    ])
        .sort({ lastUpdated: -1 })
        .exec((err, conversations) => {
            if (err) {
                console.error(err);
                res.status(500).json({
                    message: "An error has occurred",
                    status: 500,
                    success: false
                });
                return;
            }
            if (conversations.length) {
                for (let i = 0; i < conversations.length; i++) {
                    conversations[i].receivers = conversations[
                        i
                    ].members.filter((member) => member._id.toString() !== userId.toString());
                    conversations[i].unreadMessages =
                        conversations[i].unreadMessages?.[0]?.sum ?? 0;
                }
                res.status(200).json({
                    conversations,
                    message: "Conversations fetched",
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

const getMessages = (req, res) => {
    if (!req.params.conversationId || !req.params.page) {
        res.status(400).json({
            message: "Invalid of incomplete request",
            status: 400,
            success: false
        });
        return;
    }
    // TODO: limit queried messages to 20 (or whatever arbitrary number)
    Conversation.aggregate([
        {
            $match: {
                _id: Types.ObjectId(req.params.conversationId)
            }
        },
        {
            $match: { members: res.locals.userId }
        },
        {
            $lookup: {
                as: "messages",
                from: Message.collection.name,
                let: { conversationId: { $toObjectId: "$_id" } },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$conversation",
                                    "$$conversationId"
                                ]
                            }
                        }
                    },
                    // Sort messages by descending order so we get the newest ones
                    {
                        $sort: { "sentTime": -1 }
                    },
                    {
                        $skip: parseInt(req.params.page) * 50
                    },
                    {
                        $limit: 50,
                    }
                ]
            }
        },
        // Break open the messages array
        {
            $unwind: "$messages",
        },
        {
        // Sort the messages by sent time in ascending order (1)
            $sort: { "messages.sentTime": 1 },
        },
        // Group the messages back together into an array
        {
            $group: { _id: "$_id",
                messages: { $push: "$messages" } },
        },
    ]).exec((err, conversation) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false
            });
            return;
        }
        let messages = [];
        console.log(conversation);
        if (conversation.length) {
            messages = [...conversation[0].messages];
        }
        res.status(200).json({
            message: "Fetched messages successfully",
            messages,
            status: 200,
            success: true
        });
    });
};

const getUnreadMessages = (req, res) => {
    if (!res.locals.userId) {
        res.status(401).json({
            message: "Not authorized",
            status: 401,
            success: false
        });
        return;
    }

    const { userId } = res.locals;

    Conversation.aggregate([
        {
            $match: { participants: userId }
        },
        {
            $addFields: {
                convoId: "$_id"
            }
        },
        {
            $lookup: {
                as: "unreadMessages",
                from: Message.collection.name,
                let: { convoParticipants: "$participants" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $not: {
                                    // Find the messages that aren't read by the user
                                    $in: [
                                        Types.ObjectId(userId),
                                        "$readBy"
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                unreadMessages: {
                    $filter: {
                        cond: {
                            $eq: [
                                "$$this.conversation",
                                "$convoId"
                            ]
                        },
                        input: "$unreadMessages"
                    }
                }
            }
        },
        {
            $project: {
                size: { $size: "$unreadMessages" }
            }
        },
        {
            $group: {
                _id: null,
                unreadMessages: { $sum: "$size" }
            }
        }
    ]).exec((err, conversations) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false
            });
            return;
        }
        if (conversations.length) {
            res.status(200).json({
                message: "Unread messages fetched",
                status: 200,
                success: true,
                unreadMessages: conversations[0].unreadMessages ?? 0
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
    getConversations,
    getMessages,
    getUnreadMessages,
    startConversation
};
