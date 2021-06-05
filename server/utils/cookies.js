const Iron = require("@hapi/iron");
const { serialize, parse } = require("cookie");

const TOKEN_NAME = "user_session";
// 100 years. brave browser limits this to 6 months only
const MAX_AGE = 60 * 60 * 24 * 365 * 100;

const setTokenCookie = (res, token, stayLoggedIn) => {
    const cookieObj = {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV !== "development"
    };
    if (stayLoggedIn) {
        cookieObj.expires = new Date(Date.now() + MAX_AGE * 1000);
        cookieObj.maxAge = MAX_AGE;
    }
    const cookie = serialize(TOKEN_NAME, token, cookieObj);

    res.setHeader("Set-Cookie", cookie);
};

const removeTokenCookie = function (res) {
    const cookie = serialize(TOKEN_NAME, "", {
        maxAge: -1,
        path: "/"
    });

    res.setHeader("Set-Cookie", cookie);
};

const parseCookies = (req) => {
    // For API Routes we don't need to parse the cookies.
    if (req.cookies) {
        return req.cookies;
    }

    // For pages we do need to parse the cookies.
    const cookie = req.headers?.cookie;
    return parse(cookie || "");
};

const getTokenCookie = (req) => {
    const cookies = parseCookies(req);
    return cookies[TOKEN_NAME];
};

const setLoginSession = async function (res, session, stayLoggedIn) {
    const createdAt = Date.now();
    // Create a session object with a max age that we can validate later
    const obj = {
        ...session,
        createdAt
    };
    if (stayLoggedIn) {
        obj.maxAge = MAX_AGE * 1000;
    }
    const token = await Iron.seal(obj, process.env.TOKEN_SECRET, Iron.defaults);

    setTokenCookie(res, token, stayLoggedIn);
    return token;
};

const getLoginSession = async function (req) {
    const token = getTokenCookie(req);

    if (!token) {
        return;
    }

    const session = await Iron.unseal(
        token,
        process.env.TOKEN_SECRET,
        Iron.defaults
    );
    const expiresAt = session.createdAt + session.maxAge * 1000;

    session.token = token;
    // Validate the expiration date of the session
    if (Date.now() > expiresAt) {
        throw new Error("Session expired");
    }

    return session;
};

// Used to authenticate users' sockets, because socket.io has no concept of requests
const validateSession = async function (token) {
    if (!token) {
        return;
    }

    const session = await Iron.unseal(
        token,
        process.env.TOKEN_SECRET,
        Iron.defaults
    );
    const expiresAt = session.createdAt + session.maxAge * 1000;

    // Validate the expiration date of the session
    if (Date.now() > expiresAt) {
        throw new Error("Session expired");
    }

    return session;
};

module.exports = {
    getLoginSession,
    removeTokenCookie,
    setLoginSession,
    validateSession,
};
