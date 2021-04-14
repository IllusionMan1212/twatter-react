const Conversation = require("../mvc/models/conversation");
const User = require("../mvc/models/user");
const Message = require("../mvc/models/message");
const { Types } = require("mongoose");
const { mkdirSync, writeFileSync } = require("fs");
const {
    messageCharLimit,
    supportedFileTypes,
    fileSizeLimit
} = require("../utils/variables");
const removeExif = require("../utils/helperFunctions");

const handleMessage = (socket, connectedSockets) => {
    socket.on("messageToServer", (msg) => {
        msg.token = socket.handshake.query.token;
        if (!msg.conversationId || !msg.receiverId) {
            socket.emit("error", "An error has occurred");
            return;
        }
        if (!msg.messageContent && !msg.attachment) {
            socket.emit("error", "An error has occurred");
            return;
        }
        if (msg.messageContent.length > messageCharLimit) {
            socket.emit("error", "Message content exceeds limit");
            return;
        }

        const newMessage = new Message();
        const messageId = Types.ObjectId();
        newMessage._id = messageId;
        newMessage.content = msg.messageContent;
        newMessage.conversation = msg.conversationId;
        newMessage.ownerId = msg.senderId;
        newMessage.readBy.push(msg.senderId);

        if (
            msg?.attachment?.data &&
            msg?.attachment?.mimetype &&
            msg?.attachment?.name
        ) {
            try {
                mkdirSync(`cdn/messages/${messageId}`, { recursive: true });
            } catch (err) {
                socket.emit("error", "An error has occurred");
                return;
            }
            if (msg.attachment.size > fileSizeLimit) {
                socket.emit("error", "File size is limited to 8MB");
                return;
            }
            if (
                !supportedFileTypes.includes(msg.attachment.mimetype.toString())
            ) {
                socket.emit("error", "Unsupported file format");
                return;
            }
            let imageData = "";
            if (
                msg.attachment.mimetype.toString() === "image/jpeg" &&
                msg.attachment.data.toString("hex", 0, 2).toUpperCase() ===
                    "FFD8"
            ) {
                imageData = removeExif(msg.attachment);
            } else {
                imageData = msg.attachment.data;
            }

            const fileExtension = msg.attachment.name.substring(msg.attachment.name.lastIndexOf("."));
            writeFileSync(
                `cdn/messages/${messageId}/1${fileExtension}`,
                imageData
            );
            newMessage.attachment = `${process.env.DOMAIN_URL}/cdn/messages/${messageId}/1${fileExtension}`;
        }
        Conversation.findById(msg.conversationId).exec(async (err, conversation) => {
            if (err) {
                socket.emit("error", "An error has occurred");
                return;
            }
            if (conversation) {
                if (!conversation.participants.includes(msg.receiverId)) {
                    conversation.participants.push(msg.receiverId);
                }
                if (msg.messageContent) {
                    conversation.lastMessage = msg.messageContent;
                } else if (msg.attachment) {
                    const user = await User.findById(msg.senderId).exec();
                    conversation.lastMessage = `${user.display_name} sent an image`;
                }
                conversation.lastUpdated = new Date();
                if (
                    !conversation.members.every((member) => {
                        const memberString = member.toString();
                        return (
                            memberString === msg.senderId.toString() ||
                                memberString === msg.receiverId.toString()
                        );
                    })
                ) {
                    console.log("not authorized");
                    return;
                }
                try {
                    await conversation.save();
                    await newMessage.save();
                } catch (err) {
                    socket.emit("error", "An error has occurred");
                    return;
                }
                if (connectedSockets.has(msg.receiverId)) {
                    connectedSockets
                        .get(msg.receiverId)
                        .forEach((_socket) => {
                            _socket.emit("messageFromServer", {
                                attachment: newMessage.attachment,
                                content: newMessage.content,
                                conversationId: newMessage.conversation,
                                lastUpdated: newMessage.sentTime,
                                receiver: msg.receiverId,
                                sender: newMessage.ownerId,
                                sentTime: newMessage.sentTime
                            });
                        });
                }
                connectedSockets.get(msg.senderId).forEach((_socket) => {
                    _socket.emit("messageFromServer", {
                        attachment: newMessage.attachment,
                        content: newMessage.content,
                        conversationId: newMessage.conversation,
                        lastUpdated: newMessage.sentTime,
                        receiver: msg.receiverId,
                        sender: newMessage.ownerId,
                        sentTime: newMessage.sentTime
                    });
                });
            } else {
                console.log("conversation not found");
            }
        });
    });

    socket.on("markMessagesAsRead", (payload) => {
        Message.updateMany(
            { conversation: payload.conversationId },
            { $addToSet: { readBy: payload.userId } },
            null,
            (err) => {
                if (err) {
                    socket.emit("error", "Error marking messages as read");
                    return;
                }
                const newPayload = {
                    conversationId: payload.conversationId,
                    messagesRead: payload.unreadMessages
                };
                connectedSockets.get(payload.userId).forEach((_socket) => {
                    _socket.emit("markedMessagesAsRead", newPayload);
                });
            }
        );
    });
};

const handleTyping = (socket, connectedSockets) => {
    socket.on("typing", (payload) => {
        if (connectedSockets.has(payload.receiverId)) {
            connectedSockets.get(payload.receiverId).forEach((_socket) => {
                _socket.emit("typing", payload.conversationId);
            });
        }
    });

    socket.on("stopTyping", (payload) => {
        if (connectedSockets.has(payload.receiverId)) {
            connectedSockets.get(payload.receiverId).forEach((_socket) => {
                _socket.emit("stopTyping", payload.conversationId);
            });
        }
    });
};

module.exports = {
    handleMessage,
    handleTyping,
};
