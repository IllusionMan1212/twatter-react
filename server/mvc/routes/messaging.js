const { Router } = require("express");
const {
    getConversations,
    getMessages,
    getUnreadMessages,
    startConversation,
} = require("../controllers/messaging");
const {
    authorizeUser,
    getLimit,
    postLimit,
} = require("./middleware/middleware");

const router = Router();

router.post("/startConversation", postLimit, authorizeUser, startConversation);

router.get("/getConversations", getLimit, authorizeUser, getConversations);
router.get(
    "/getMessages/:conversationId",
    getLimit,
    authorizeUser,
    getMessages
);
router.get("/getUnreadMessages", getLimit, authorizeUser, getUnreadMessages);

module.exports = router;
