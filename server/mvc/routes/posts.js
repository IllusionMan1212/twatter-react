const { Router } = require("express");
const {
    deletePost,
    getComments,
    getPost,
    getPosts,
    getPostsCount,
    likePost,
} = require("../controllers/posts");
const { authorizeUser, putLimit, getLimit } = require("./middleware/middleware");

const router = Router();

router.post("/deletePost", authorizeUser, putLimit, deletePost);
router.post("/likePost", authorizeUser, putLimit, likePost);

router.get("/getPostsCount/:userId", getLimit, getPostsCount);
router.get("/getPosts/:page/:userId?", getLimit, getPosts);
router.get("/getPost", getLimit, getPost);
router.get("/getComments/:postId", getLimit, getComments);

module.exports = router;
