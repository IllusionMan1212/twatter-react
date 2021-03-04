const ratelimiter = require("express-rate-limit");
const { getLoginSession, validateSession } = require("../../controllers/utils");
const User = require("../../models/user");

const getLimit = ratelimiter({
    draft_polli_ratelimit_headers: true,
    handler: (req, res) => {
        res.status(429).json({
            message: `Too many requests, try again in ${(
                (req.rateLimit.resetTime.getTime() - Date.now()) /
                1000
            ).toFixed(1)} seconds`,
            status: 429,
            success: false
        });
    },
    max: 120,
    windowMs: 60 * 1000
});

const postLimit = ratelimiter({
    draft_polli_ratelimit_headers: true,
    handler: (req, res) => {
        res.status(429).json({
            message: `Too many requests, try again in ${(
                (req.rateLimit.resetTime.getTime() - Date.now()) /
                1000
            ).toFixed(1)} seconds`,
            status: 429,
            success: false
        });
    },
    max: 10,
    windowMs: 60 * 1000
});

const putLimit = ratelimiter({
    draft_polli_ratelimit_headers: true,
    handler: (req, res) => {
        res.status(429).json({
            message: `Too many requests, try again in ${(
                (req.rateLimit.resetTime.getTime() - Date.now()) /
                1000
            ).toFixed(1)} seconds`,
            status: 429,
            success: false
        });
    },
    max: 30,
    windowMs: 60 * 1000
});

const authorizeUser = async (req, res, next) => {
    try {
        const session =
            await getLoginSession(req) ??
            await validateSession(req.body.token);
        if (!session) {
            res.status(401).json({
                message: "Authentication token is invalid, please log in",
                status: 401,
                success: false
            });
            return;
        }
        User.findOne({ username: session._doc.username })
            .select("_id")
            .exec((err, foundUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        message: "An error has occurred while authorizing user"
                    });
                    return;
                }
                const user = (session && foundUser) ?? null;
                res.locals.userId = user._id;
                next();
            });
    } catch (error) {
        console.error(error);
        res.status(500).end("Authentication token is invalid, please log in");
    }
};

module.exports = {
    authorizeUser,
    getLimit,
    postLimit,
    putLimit,
};
