/* eslint-disable require-atomic-updates */
const socketio = require("socket.io");
const handleMessage = require("./messaging");
const connectedSockets = new Map();
const { validateSession } = require("../mvc/controllers/utils");
const handlePosts = require("./posts");
const handleComments = require("./comments");

const initSockets = (server) => {
    const io = socketio(server, {
        cors: {
            credentials: true,
            methods: [
                "GET",
                "POST",
                "DELETE",
                "PUT"
            ],
            origin: process.env.CLIENT_DOMAIN_URL,
        },
        serveClient: false
    });
    io.use(async (socket, next) => {
        if (socket.handshake.query?.token) {
            const user = await validateSession(socket.handshake.query.token);
            socket.user = user;
            next();
        } else {
            next(new Error("Not authenticated"));
        }
    }).on("connection", (socket) => {
        if (connectedSockets.has(socket.user._doc._id)) {
            const userSockets = [...connectedSockets.get(socket.user._doc._id)];
            connectedSockets.set(
                socket.user._doc._id,
                userSockets.concat(socket)
            );
        } else {
            connectedSockets.set(socket.user._doc._id, [socket]);
        }

        socket.on("disconnect", () => {
            if (connectedSockets.get(socket.user._doc._id).length === 1) {
                connectedSockets.delete(socket.user._doc._id);
            } else {
                const userSockets = connectedSockets
                    .get(socket.user._doc._id)
                    .filter((_socket) => {
                        return _socket.id !== socket.id;
                    });
                connectedSockets.set(socket.user._doc._id, userSockets);
            }
        });

        handleMessage(socket, connectedSockets);
        handlePosts(io, socket);
        handleComments(io, socket);
    });
};

module.exports = initSockets;
