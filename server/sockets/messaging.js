const Conversation = require("../mvc/models/conversation");
const Message = require("../mvc/models/message");
const { Types } = require("mongoose");
const { mkdirSync, writeFileSync } = require("fs");
const {
    messageCharLimit,
    supportedFileTypes,
    fileSizeLimit
} = require("../utils/variables");
const removeExif = require("server/utils/helperFunctions");

const handleMessage = (socket, connectedSockets) => {
    socket.on("messageToServer", (msg) => {
        msg.token = socket.handshake.query.token;
        if (!msg.conversationId || !msg.receiverId) {
            console.log("empty msg");
            return;
        }
        if (!msg.messageContent && !msg.attachment) {
            console.log("no content and no attachment");
            return;
        }
        if (msg.messageContent.length > messageCharLimit) {
            console.log("msg too big");
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
            mkdirSync(`cdn/messages/${messageId}`, { recursive: true });
            if (msg.attachment.size > fileSizeLimit) {
                return;
            }
            if (
                !supportedFileTypes.includes(msg.attachment.mimetype.toString())
            ) {
                console.log("Unsupported file format");
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
                console.log("err");
                return;
            }
            if (conversation) {
                if (!conversation.participants.includes(msg.receiverId)) {
                    conversation.participants.push(msg.receiverId);
                }
                conversation.lastMessage = msg.messageContent;
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
                    console.log("err");
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
                console.log("convo not found");
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
                    // TODO: emit an error event
                    console.log(err);
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

module.exports = handleMessage;
