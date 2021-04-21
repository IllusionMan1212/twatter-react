const User = require("../models/user");
const passport = require("passport");
const Cookies = require("../../utils/cookies");
const fs = require("fs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const removeExif = require("../../utils/helperFunctions");

const create = (req, res) => {
    const username = req.body.username.toLowerCase().trim();
    const email = req.body.email.toLowerCase().trim();
    const password = req.body.password.trim();
    const confirmPassword = req.body.confirm_password.trim();
    if (!username || !email || !password || !confirmPassword) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }

    if (username.length < 3) {
        res.status(400).json({
            message: "Username is too short, you need at least 3 characters",
            status: 400,
            success: false
        });
        return;
    }

    if (username.length > 16) {
        res.status(400).json({
            message:
                "Username is too long, it cannot be longer than 16 characters",
            status: 400,
            success: false
        });
        return;
    }

    if (!username.match(/^[a-z0-9_]+$/iu)) {
        res.status(400).json({
            message: "Username can't contain special characters",
            status: 400,
            success: false
        });
        return;
    }

    if (password.length < 8) {
        res.status(400).json({
            message: "Password is too short",
            status: 400,
            success: false
        });
        return;
    }

    if (password !== confirmPassword) {
        res.status(400).json({
            message: "Passwords don't match",
            status: 400,
            success: false
        });
        return;
    }

    const user = new User();

    user.username = username;
    // eslint-disable-next-line camelcase
    user.display_name = req.body.username.trim();
    user.email = email;
    user.setPassword(password);

    user.save(async (err, user) => {
        if (err) {
            if (err.errmsg.includes("duplicate key")) {
                if (err.errmsg.includes("email")) {
                    res.status(409).json({
                        message:
                            "An account is already registered with this email",
                        status: 409,
                        success: false
                    });
                    return;
                } else if (err.errmsg.includes("username")) {
                    res.status(409).json({
                        message: "Username is taken",
                        status: 409,
                        success: false
                    });
                    return;
                }
            }
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false
            });
            return;
        }
        const session = { ...user };
        await Cookies.setLoginSession(res, session);
        res.status(201).json({
            message: "Successfully created a new account",
            status: 201,
            success: true
        });
    });
};

const login = async (req, res) => {
    let user = null;
    try {
        user = await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-promise-executor-return
            return passport.authenticate(
                "login",
                { session: false },
                (err, user) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!user) {
                        reject(new Error("Incorrect credentials"));
                        return;
                    }
                    resolve(user);
                }
            )(req, res);
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            message: "Incorrect credentials",
            status: 400,
            success: false
        });
        return;
    }

    // Session is the payload to save in the token, it may contain basic info about the user
    const session = { ...user };

    const token = await Cookies.setLoginSession(res, session);
    res.status(200).json({
        message: "Logged In",
        status: 200,
        success: true,
        token,
        user
    });
};

const logout = (req, res) => {
    Cookies.removeTokenCookie(res);
    res.status(200).json({ message: "Logged out",
        status: 200,
        success: true });
};

const validateToken = async (req, res) => {
    try {
        const session = await Cookies.getLoginSession(req);
        if (!session) {
            res.status(401).json({
                message: "Authentication token is invalid, please log in",
                status: 401,
                success: false
            });
            return;
        }
        User.findOne({ username: session._doc.username })
            .select("-__v")
            .exec((err, foundUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        message: "An error has occurred while logging in"
                    });
                    return;
                }
                const user = (session && foundUser) ?? null;
                res.status(200).json({ token: session.token,
                    user });
            });
    } catch (error) {
        console.error(error);
        res.status(500).end("Authentication token is invalid, please log in");
    }
};

const getUserData = (req, res) => {
    if (!req.query.username) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }
    User.findOne({ username: req.query.username.toString() })
        .select("-__v -password -hash -email -finished_setup")
        .exec((err, user) => {
            if (err) {
                console.error(err);
                res.status(500).json({
                    message: "An error has occurred",
                    status: 500,
                    success: false
                });
                return;
            }
            if (user) {
                res.status(200).json({
                    message: "Retrieved user data successfully",
                    status: 200,
                    success: true,
                    user
                });
            } else {
                res.status(404).json({
                    message: "Not found",
                    status: 404,
                    success: false
                });
            }
        });
};

const initialSetup = (req, res) => {
    if (!req.body.userId) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }

    if (req.body.bio.length > 150) {
        res.status(413).json({
            message: "Bio is too long, it cannot be longer than 150 characters",
            status: 413,
            success: false
        });
        return;
    }

    User.findById(req.body.userId, (err, user) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false
            });
            return;
        }
        if (user) {
            user.bio = req.body.bio;
            if (
                req.body.birthday_day != "null" &&
                req.body.birthday_month != "null" &&
                req.body.birthday_year != "null"
            ) {
                user.birthday = new Date(`${req.body.birthday_year}-${req.body.birthday_month}-${req.body.birthday_day}`);
            }
            if (req.files?.profileImage) {
                fs.mkdirSync(`cdn/profile_images/${req.body.userId}`, {
                    recursive: true
                });
                if (
                    req.files.profileImage.mimetype.toString() !== "image/jpeg" &&
                    req.files.profileImage.mimetype.toString() !== "image/jpg" &&
                    req.files.profileImage.mimetype.toString() !== "image/png" &&
                    req.files.profileImage.mimetype.toString() !== "image/webp"
                ) {
                    res.status(400).json({
                        message: "This file format is not supported",
                        status: 400,
                        success: false
                    });
                    return;
                }
                let imageData = "";
                if (req.files.profileImage.mimetype.toString() === "image/jpeg") {
                    imageData = removeExif(req.files.profileImage);
                } else {
                    imageData = req.files.profileImage.data;
                }

                const name = crypto.randomBytes(16).toString("hex");
                const fileExtension = req.files.profileImage.name.substring(req.files.profileImage.name.lastIndexOf("."));
                fs.writeFileSync(
                    `cdn/profile_images/${req.body.userId}/${name}${fileExtension}`,
                    imageData
                );
                user.profile_image = `${process.env.DOMAIN_URL}/cdn/profile_images/${req.body.userId}/${name}${fileExtension}`;
            }
            user.finished_setup = true;
            user.save((err) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        message: "An error has occurred",
                        status: 500,
                        success: false
                    });
                    return;
                }
                res.status(200).json({
                    message: "Initial setup done",
                    status: 200,
                    success: true
                });
            });
        } else {
            res.status(404).json({
                message: "Not found",
                status: 404,
                success: false
            });
        }
    });
};

const forgotPassword = (req, res) => {
    if (!req.body.email) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }

    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message: "An error has occurred",
                status: 500,
                success: false
            });
            return;
        }
        if (user) {
            user.reset_password_token = crypto.randomBytes(32).toString("hex");
            user.reset_password_token_expiry_date = Date.now() + 3600000;
            user.save();

            const transporter = nodemailer.createTransport({
                auth: {
                    accessToken: process.env.ACCESS_TOKEN,
                    clientId: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET,
                    refreshToken: process.env.REFRESH_TOKEN,
                    type: "OAuth2",
                    user: process.env.EMAIL,
                },
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
            });

            const mailOptions = {
                from: `Twatter <${process.env.EMAIL}>`,
                html: `<p>The password reset link you requested is ready. Please click on the link below to reset your password</p>\
                <a href="https://${req.headers.host}/reset-password/${user.reset_password_token}">https://${req.headers.host}/reset-password/${user.reset_password_token}</a>\
                <p><b>Note: This link expires in 1 hour</b></p>\
                <p>If you did not request this link, ignore this email and your password will remain unchanged</p>`,
                sender: "Twatter",
                subject: "Password Reset",
                to: user.email,
            };
            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        message: "An error has occurred",
                        status: 500,
                        success: false
                    });
                    return;
                }
                res.status(200).json({
                    message:
                        "An email containing instructions on how to reset your password has been sent to you",
                    status: 200,
                    success: true
                });
            });
        } else {
            res.status(200).json({
                message:
                    "An email containing instructions on how to reset your password has been sent to you",
                status: 200,
                success: true
            });
        }
    });
};

const validatePasswordResetToken = (req, res) => {
    if (!req.query.token) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }
    User.findOne(
        {
            reset_password_token: req.query.token.toString(),
            reset_password_token_expiry_date: { $gt: new Date() }
        },
        (err, user) => {
            if (err) {
                console.error(err);
                res.status(500).json({
                    message: "An error has occurred",
                    status: 500,
                    success: false
                });
                return;
            }
            if (user) {
                res.status(200).json({
                    message: "Found user with token",
                    status: 200,
                    success: true,
                    user
                });
            } else {
                res.status(403).json({
                    message: "Password reset token is invalid or has expired",
                    status: 403,
                    success: false
                });
            }
        }
    );
};

const resetPassword = (req, res) => {
    if (
        !req.body.newPassword ||
        !req.body.confirm_password ||
        !req.body.token
    ) {
        res.status(400).json({
            message: "Invalid or incomplete request",
            status: 400,
            success: false
        });
        return;
    }
    if (req.body.newPassword.toString() !== req.body.confirm_password.toString()) {
        res.status(400).json({
            message: "Passwords don't match",
            status: 400,
            success: false
        });
        return;
    }
    User.findOne(
        {
            reset_password_token: req.body.token,
            reset_password_token_expiry_date: { $gt: new Date() }
        },
        (err, user) => {
            if (err) {
                console.error(err);
                res.status(500).json({
                    message: "An error has occurred",
                    status: 500,
                    success: false
                });
                return;
            }
            if (user) {
                user.setPassword(req.body.newPassword);
                user.save((err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({
                            message: "An error has occurred",
                            status: 500,
                            success: false
                        });
                        return;
                    }
                    res.status(200).json({
                        message: "Your password has been successfully reset",
                        status: 200,
                        success: true
                    });
                });
            } else {
                res.status(403).json({
                    message: "Password reset token is invalid or has expired",
                    status: 403,
                    success: false
                });
            }
        }
    );
};

module.exports = {
    create,
    forgotPassword,
    getUserData,
    initialSetup,
    login,
    logout,
    resetPassword,
    validatePasswordResetToken,
    validateToken,
};
