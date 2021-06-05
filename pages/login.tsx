/* eslint-disable react/react-in-jsx-scope */
import LayoutRegular from "../components/layouts/layoutRegular";
import NavbarLoggedOut from "../components/navbarLoggedOut";
import styles from "../styles/register-login.module.scss";
import indexStyles from "../styles/index.module.scss";
import Link from "next/link";
import Head from "next/head";
import { Eye, EyeClosed } from "phosphor-react";
import React, { FormEvent, ReactElement, useEffect, useState } from "react";
import axios from "axios";
import Router from "next/router";
import Loading from "../components/loading";
import { useToastContext } from "../src/contexts/toastContext";
import { Checkbox } from "components/checkbox/checkbox";

export default function Login(): ReactElement {
    const toast = useToastContext();

    const [loading, setLoading] = useState(true);
    const [passwordHidden, setPasswordHidden] = useState(true);
    const [form, setForm] = useState({
        username: "",
        password: "",
        stayLoggedIn: false
    });
    const [loginAllowed, setLoginAllowed] = useState(true);

    useEffect(() => {
        axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/validateToken`,
                { withCredentials: true }
            ) // TODO: ditto
            .then((res) => {
                if (res.data.user) {
                    Router.push("/home");
                } else {
                    setLoading(false);
                }
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name;
        const value = e.target.value;
        setForm({
            ...form,
            [name]: value,
        });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            stayLoggedIn: e.target.checked
        });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loginAllowed) {
            setLoginAllowed(false);
            if (validateForm()) {
                axios
                    .post(
                        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/login`,
                        form,
                        { withCredentials: true }
                    )
                    .then((response) => {
                        toast("Successfully logged in", 5000);
                        if (response.data.success) {
                            Router.push("/home");
                        }
                    })
                    .catch((err) => {
                        setLoginAllowed(true);
                        toast(err?.response?.data?.message ?? "An error has occurred", 5000);
                    });
            }
        }
    };

    const validateForm = (): boolean => {
        if (!form.username || !form.password) {
            toast("All fields must be set", 4000);
            setLoginAllowed(true);
            return false;
        }
        return true;
    };

    return !loading ? (
        <>
            <Head>
                <title>Log in - Twatter</title>
                {/* TODO: write meta tags and other important head tags */}
            </Head>
            <NavbarLoggedOut></NavbarLoggedOut>
            <LayoutRegular>
                <div className="text-white text-bold text-center my-3">
                    <p className="text-extra-large">Log In</p>
                </div>
                <div className="flex justify-content-center">
                    <form
                        className="flex flex-column justify-content-center max-w-100"
                        onSubmit={handleSubmit}
                    >
                        <input
                            className={`text-medium text-thin mb-1 ${styles.input}`}
                            type="text"
                            placeholder="Email or Username"
                            name="username"
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
                        <Checkbox
                            style={{ marginTop: "0.5em" }}
                            label="Keep me logged in"
                            handleChange={handleCheckboxChange}
                        />
                        <button
                            className={`text-medium mt-1 mx-5Percent ${styles.button} ${indexStyles.filledButton}`}
                        >
                            Log In
                        </button>
                        <p className="text-white text-center mt-1">
                            <Link href="/forgot-password">
                                <a>Forgot your password?</a>
                            </Link>
                        </p>
                        <p className="usernameGrey text-center my-1">or</p>
                        <p className="text-white text-center">
                            <Link href="/register">
                                <a>Don&apos;t have an account yet? Sign up</a>
                            </Link>
                        </p>
                    </form>
                </div>
            </LayoutRegular>
        </>
    ) : (
        <Loading height="100" width="100"></Loading>
    );
}
