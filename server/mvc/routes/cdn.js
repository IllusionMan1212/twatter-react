const { Router } = require("express");
const { cdnGetLimit, authorizeUser } = require("./middleware/middleware");
const { getProfilePicture, getPostImages, getMessageImage } = require("../controllers/cdn");

const router = Router();

router.get("/profile_images/:userId/:fileName", cdnGetLimit, getProfilePicture);
router.get("/posts/:postId/:fileName", cdnGetLimit, getPostImages);
router.get("/messages/:messageId/:fileName", authorizeUser, cdnGetLimit, getMessageImage);

module.exports = router;
