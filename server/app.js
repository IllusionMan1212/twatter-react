require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const fileupload = require("express-fileupload");
const compression = require("compression");
const passport = require("passport");
const http = require("http");
const initSockets = require("./sockets/init");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const usersRoute = require("./mvc/routes/users");
const postsRoute = require("./mvc/routes/posts");
const messagingRoute = require("./mvc/routes/messaging");
const cdnRoute = require("./mvc/routes/cdn");
require("./mvc/models/db");

app.prepare().then(() => {
    const expressApp = express();
    const server = http.createServer(expressApp);
    initSockets(server);

    expressApp.use(compression());
    expressApp.use(fileupload());
    expressApp.use(logger("dev"));
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: false }));
    expressApp.use(cookieParser());
    expressApp.use(passport.initialize());

    expressApp.use("*", (_req, res, next) => {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        res.header("Access-Control-Allow-Credentials");
        res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
        next();
    });

    expressApp.use("/api/users", usersRoute);
    expressApp.use("/api/posts", postsRoute);
    expressApp.use("/api/messaging", messagingRoute);
    expressApp.use("/cdn", cdnRoute);

    expressApp.get("*", (req, res) => {
        return handle(req, res);
    });

    const port = process.env.PORT || 3000;
    expressApp.set("port", port);
    server
        .listen(port)
        .on("listening", () => console.log("listening on port: " + port));
});
