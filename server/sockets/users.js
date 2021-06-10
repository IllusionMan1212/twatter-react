const User = require("../mvc/models/user");
const fs = require("fs");
const removeExif = require("../utils/helperFunctions");
const crypto = require("crypto");

const handleUserData = (socket) => {
    socket.on("removeBirthday", (userId) => {
        User.findByIdAndUpdate(userId, { birthday: null }, null, (err) => {
            if (err) {
                socket.emit("error", "An error has occurred");
                return;
            }
            socket.emit("birthdayRemoved", userId);
        });
    });

    socket.on("updateProfile", (payload) => {
        const data = {
            bio: payload.bio,
            display_name: payload.displayName,
        };

        if (payload.birthday) {
            const birthday = new Date(`${payload.birthday.year}-${payload.birthday.month}-${payload.birthday.day}`);
            data.birthday = birthday;
            payload.birthday = birthday;
        }

        if (payload.profileImage) {
            const name = crypto.randomBytes(16).toString("hex");
            if (!fs.existsSync(`cdn/profile_images/${payload.userId}`)) {
                fs.mkdirSync(`cdn/profile_images/${payload.userId}`, {
                    recursive: true
                });
            }
            if (
                payload.profileImage.mimetype.toString() !== "image/jpeg" &&
                payload.profileImage.mimetype.toString() !== "image/jpg" &&
                payload.profileImage.mimetype.toString() !== "image/png" &&
                payload.profileImage.mimetype.toString() !== "image/webp"
            ) {
                // Unsupported file error
                socket.emit("error", "Unsupported file format");
                return;
            }
            let imageData = "";
            if (payload.profileImage.mimetype.toString() === "image/jpeg") {
                imageData = removeExif(payload.profileImage);
            } else {
                imageData = payload.profileImage.data;
            }

            const fileExtension = payload.profileImage.name.substring(payload.profileImage.name.lastIndexOf("."));
            fs.readdirSync(`cdn/profile_images/${payload.userId}/`).map((file) => {
                return fs.rmSync(`cdn/profile_images/${payload.userId}/${file}`);
            });
            fs.writeFileSync(
                `cdn/profile_images/${payload.userId}/${name}${fileExtension}`,
                imageData
            );
            data.profile_image = `${process.env.DOMAIN_URL}/cdn/profile_images/${payload.userId}/${name}${fileExtension}`;
            payload.profileImage = `${process.env.DOMAIN_URL}/cdn/profile_images/${payload.userId}/${name}${fileExtension}`;
        }

        User.findByIdAndUpdate(payload.userId, data, null, (err) => {
            if (err) {
                socket.emit("error", "An error has occurred");
                return;
            }
            socket.emit("updatedProfile", payload);
        });
    });
};

module.exports = handleUserData;
