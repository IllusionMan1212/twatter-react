const { Router } = require("express");
const { getLimit, authorizeUser } = require("./middleware/middleware");
const { getProfilePicture, getPostImages, getMessageImage } = require("../controllers/cdn");

const router = Router();

router.get("/profile_images/:userId/:fileName", getLimit, getProfilePicture);
router.get("/posts/:postId/:fileName", getLimit, getPostImages);
router.get("/messages/:messageId/:fileName", authorizeUser, getLimit, getMessageImage);

module.exports = router;
