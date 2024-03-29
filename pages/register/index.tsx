import LayoutRegular from "components/layouts/layoutRegular";
import styles from "styles/register-login.module.scss";
import indexStyles from "styles/index.module.scss";
import Link from "next/link";
import Head from "next/head";
import React, { FormEvent, ReactElement, useState } from "react";
import { Eye, EyeClosed } from "phosphor-react";
import axios from "axios";
import Router from "next/router";
import { useUserContext } from "src/contexts/userContext";
import { useGlobalContext } from "src/contexts/globalContext";

export default function Register(): ReactElement {
    const { user } = useUserContext();
    const { showToast } = useGlobalContext();

    const [passwordHidden, setPasswordHidden] = useState(true);
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirm_password: "",
    });
    const [registerAllowed, setRegisterAllowed] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name;
        const value = e.target.value;
        setForm({
            ...form,
            [name]: value,
        });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (registerAllowed) {
            setRegisterAllowed(false);
            if (validateForm()) {
                axios
                    .post(
                        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/users/create`,
                        form,
                        { withCredentials: true }
                    )
                    .then(() => {
                        showToast("Successfully created new account", 5000);
                        Router.push("/register/setting-up");
                    })
                    .catch((err) => {
                        setRegisterAllowed(true);
                        showToast(err?.response?.data?.message ?? "An error has occurred", 5000);
                    });
            }
        }
    };

    const validateForm = (): boolean => {
        if (
            !form.username ||
            !form.email ||
            !form.password ||
            !form.confirm_password
        ) {
            showToast("All fields must be set", 4000);
            setRegisterAllowed(true);
            return false;
        }

        if (form.username.length < 3) {
            showToast("Username cannot be shorted than 3 characters", 4000);
            setRegisterAllowed(true);
            return false;
        }

        if (form.username.length > 16) {
            showToast("Username cannot be longer than 16 characters", 4000);
            setRegisterAllowed(true);
            return false;
        }

        if (!form.username.match(/^[a-z0-9_]+$/iu)) {
            showToast("Username cannot contain special characters", 4000);
            setRegisterAllowed(true);
            return false;
        }

        if (form.password.length < 8) {
            showToast("Password is too short", 4000);
            setRegisterAllowed(true);
            return false;
        }

        if (form.password !== form.confirm_password) {
            showToast("Passwords don't match", 4000);
            setRegisterAllowed(true);
            return false;
        }
        return true;
    };

    if (user) return <></>;

    return (
        <>
            <Head>
                <title>Create an account - Twatter</title>
            </Head>
            <LayoutRegular>
                <div className="text-white text-bold text-center my-3">
                    <p className="text-extra-large">Register</p>
                </div>
                <div className="flex justify-content-center">
                    <form
                        className="flex flex-column justify-content-center max-w-100"
                        onSubmit={handleSubmit}
                    >
                        <input
                            className={`text-medium text-thin ${styles.input}`}
                            type="text"
                            placeholder="Username"
                            name="username"
                            minLength={3}
                            maxLength={16}
                            autoComplete="off"
                            onChange={handleChange}
                        />
                        <input
                            className={`text-medium text-thin my-1 ${styles.input}`}
                            type="email"
                            placeholder="Email"
                            name="email"
                            autoComplete="off"
                            onChange={handleChange}
                        />
                        <div className="position-relative">
                            <input
                                id="password"
                                className={`text-medium text-thin max-w-100 ${styles.input}`}
                                type={passwordHidden ? "password" : "text"}
                                placeholder="Password"
                                name="password"
                                minLength={8}
                                autoComplete="off"
                                onChange={handleChange}
                            />
                            {passwordHidden ? (
                                <EyeClosed
                                    id="unhide"
                                    className={`${styles.icon}`}
                                    size="32"
                                    xlinkTitle="Unhide Password"
                                    onClick={() => setPasswordHidden(false)}
                                ></EyeClosed>
                            ) : (
                                <Eye
                                    id="hide"
                                    className={`${styles.icon}`}
                                    size="32"
                                    xlinkTitle="Hide Password"
                                    onClick={() => setPasswordHidden(true)}
                                ></Eye>
                            )}
                        </div>
                        <input
                            className={`text-medium text-thin my-1 ${styles.input}`}
                            type={passwordHidden ? "password" : "text"}
                            placeholder="Confirm Password"
                            name="confirm_password"
                            minLength={8}
                            autoComplete="off"
                            onChange={handleChange}
                        />
                        <button
                            className={`text-medium mt-1 mx-5Percent ${styles.button} ${indexStyles.filledButton}`}
                        >
                            Register a New Account
                        </button>
                        <p className="text-white text-right my-3Percent">
                            <Link href="/login">
                                <a className="linkColor">Already have an account? Log in</a>
                            </Link>
                        </p>
                    </form>
                </div>
            </LayoutRegular>
        </>
    );
}
