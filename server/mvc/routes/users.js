const { Router } = require("express");
const {
    create,
    forgotPassword,
    getUserData,
    initialSetup,
    login,
    logout,
    resetPassword,
    validatePasswordResetToken,
    validateToken,
} = require("../controllers/users");
const { getLimit, postLimit } = require("./middleware/middleware");

const router = Router();

router.get("/validateToken", getLimit, validateToken);
router.get("/getUserData", getLimit, getUserData);
router.get("/validatePasswordResetToken", getLimit, validatePasswordResetToken);

router.post("/create", postLimit, create);
router.post("/login", postLimit, login);
router.post("/initialSetup", postLimit, initialSetup);
router.post("/forgotPassword", postLimit, forgotPassword);
router.post("/resetPassword", postLimit, resetPassword);

router.delete("/logout", postLimit, logout);

module.exports = router;
