/* eslint-disable react/react-in-jsx-scope */
import Head from "next/head";
import axios from "axios";
import { FormEvent, ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import LayoutRegular from "../../components/layouts/layoutRegular";
import registerStyles from "../../styles/register-login.module.scss";
import forgotPassStyles from "../../styles/forgot-password.module.scss";
import NavbarLoggedOut from "../../components/navbarLoggedOut";
import { EyeClosed, Eye } from "phosphor-react";
import { useToastContext } from "../../src/contexts/toastContext";
import Loading from "../../components/loading";

export default function ResetPassword(): ReactElement {
    const toast = useToastContext();

    const [loading, setLoading] = useState(true);
    const [passwordHidden, setPasswordHidden] = useState(true);
    const [newPassword, setNewPassword] = useState({
        password: "",
        confirm_password: "",
    });
    const [user, setUser] = useState(null);
    const [resetAllowed, setResetAllowed] = useState(true);

    const router = useRouter();

    const validateFields = (): boolean => {
        if (!newPassword.password || !newPassword.confirm_password) {
            toast("All fields must be set", 4000);
            setResetAllowed(true);
            return false;
        }
        if (newPassword.password.length < 8) {
            toast("Password field must consist of 8 characters at least", 6000);
            setResetAllowed(true);
            return false;
        }
        if (newPassword.password != newPassword.confirm_password) {
            toast("Passwords don't match", 4000);
            setResetAllowed(true);
            return false;
        }
        return true;
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (resetAllowed) {
            setResetAllowed(false);
            if (validateFields()) {
                const payload = {
                    newPassword: newPassword.password,
                    confirm_password: newPassword.confirm_password,
                    token: router.query.token,
                };
                axios
                    .post(
                        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/resetPassword`,
                        payload
                    )
                    .then((res) => {
                        toast(res.data.message, 6000);
                        router.push("/login");
                    })
                    .catch((err) => {
                        setResetAllowed(true);
                        toast(err?.response?.data?.message ?? "An error has occurred", 5000);
                    });
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name;
        const value = e.target.value;
        setNewPassword({
            ...newPassword,
            [name]: value,
        });
    };

    useEffect(() => {
        if (router.query.token) {
            axios
                .get(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/validatePasswordResetToken?token=${router.query.token}`
                )
                .then((res) => {
                    setLoading(false);
                    setUser(res.data.user);
                })
                .catch(() => {
                    toast(
                        "Password reset link is invalid or has expired",
                        5000
                    );
                    router.push("/forgot-password");
                });
        }
    }, [router.query]);

    return (
        <>
            <Head>
                <title>Reset Password - Twatter</title>
            </Head>
            <NavbarLoggedOut></NavbarLoggedOut>
            {!loading ? (
                <LayoutRegular>
                    <div className="text-white text-bold text-center mb-3 mt-1">
                        <p className="text-extra-large">Reset Password</p>
                    </div>
                    <div className="flex flex-column align-items-center justify-content-center">
                        {user && (
                            <div className="text-white flex gap-1 justify-content-center align-items-center mb-2">
                                <img
                                    className="round"
                                    src={`${user.profile_image == "default_profile.svg" ? "/" : ""}${user.profile_image}`}
                                    width="60"
                                    height="60"
                                    alt="User profile picture"
                                />
                                <div>
                                    <p>{user.display_name}</p>
                                    <p
                                        style={{
                                            color: "#555",
                                            fontSize: "0.9em",
                                        }}
                                    >
                                        @{user.username}
                                    </p>
                                </div>
                            </div>
                        )}
                        <form
                            className="flex flex-column justify-content-center max-w-100"
                            onSubmit={handleSubmit}
                        >
                            <div className="position-relative">
                                <input
                                    id="password"
                                    className={`text-medium text-thin max-w-100 ${registerStyles.input}`}
                                    type={passwordHidden ? "password" : "text"}
                                    placeholder="New Password"
                                    name="password"
                                    minLength={8}
                                    autoComplete="off"
                                    onChange={handleChange}
                                />
                                {passwordHidden ? (
                                    <EyeClosed
                                        id="unhide"
                                        className={`${registerStyles.icon}`}
                                        size="32"
                                        xlinkTitle="Unhide Password"
                                        onClick={() => setPasswordHidden(false)}
                                    ></EyeClosed>
                                ) : (
                                    <Eye
                                        id="hide"
                                        className={`${registerStyles.icon}`}
                                        size="32"
                                        xlinkTitle="Hide Password"
                                        onClick={() => setPasswordHidden(true)}
                                    ></Eye>
                                )}
                            </div>
                            <input
                                className={`text-medium text-thin my-1 ${registerStyles.input}`}
                                type={passwordHidden ? "password" : "text"}
                                placeholder="Confirm Password"
                                name="confirm_password"
                                minLength={8}
                                autoComplete="off"
                                onChange={handleChange}
                            />
                            <button
                                className={`text-medium mt-1 ${forgotPassStyles.button}`}
                            >
                                Reset
                            </button>
                        </form>
                    </div>
                </LayoutRegular>
            ) : (
                <Loading width="100" height="100"></Loading>
            )}
        </>
    );
}
