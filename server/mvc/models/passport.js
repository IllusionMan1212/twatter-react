const passport = require("passport");
const Local = require("passport-local");
const User = require("./user");

passport.use(
    "login",
    new Local.Strategy(
        { usernameField: "username" },
        (username, password, done) => {
            User.findOne({
                $or: [
                    { email: username.toLowerCase() },
                    { username: username.toLowerCase() },
                ],
            })
                .select("+salt +password")
                .exec((err, user) => {
                    if (err) {
                        return done(err, null, {
                            message: "An error has occurred",
                        });
                    }
                    if (!user) {
                        return done(err, false, {
                            message: "Incorrect credentials",
                        });
                    }
                    if (!user.validatePassword(password)) {
                        return done(err, false, {
                            message: "Incorrect credentials",
                        });
                    }
                    return done(null, user);
                });
        }
    )
);
