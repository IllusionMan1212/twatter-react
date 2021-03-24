const { Schema, model } = require("mongoose");
const { randomBytes, pbkdf2Sync } = require("crypto");

const User = new Schema({
    bio: {
        default: "",
        maxlength: 150,
        type: String,
    },
    birthday: {
        required: false,
        type: Date,
    },
    createdAt: {
        default: Date.now,
        type: Date,
    },
    display_name: {
        maxlength: 16,
        minlength: 1,
        required: true,
        trim: true,
        type: String,
    },
    email: {
        required: true,
        trim: true,
        type: String,
        unique: true
    },
    email_verification_token: {
        select: false,
        type: String,
    },
    finished_setup: {
        default: false,
        required: true,
        type: Boolean,
    },
    password: {
        required: true,
        select: false,
        type: String,
    },
    salt: {
        required: true,
        select: false,
        type: String,
    },
    profile_image: {
        default: "default_profile.svg",
        required: true,
        type: String,
    },
    reset_password_token: {
        select: false,
        type: String,
    },
    reset_password_token_expiry_date: {
        select: false,
        type: Date,
    },
    username: {
        maxlength: 16,
        minlength: 3,
        required: true,
        trim: true,
        type: String,
        unique: true,
    },
    verified_email: {
        default: false,
        required: true,
        select: false,
        type: Boolean,
    },
});

User.methods.setPassword = function (password) {
    this.salt = randomBytes(64).toString("hex");
    this.password = pbkdf2Sync(
        password,
        this.salt,
        1000,
        64,
        "sha512"
    ).toString("hex");
};

User.methods.validatePassword = function (password) {
    return (
        this.password ===
        pbkdf2Sync(password, this.salt, 1000, 64, "sha512").toString("hex")
    );
};

module.exports = model("User", User);
