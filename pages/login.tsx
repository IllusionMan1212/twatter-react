import LayoutRegular from "components/layouts/layoutRegular";
import StatusBarLoggedOut from "components/statusBar/statusBarLoggedOut";
import styles from "styles/register-login.module.scss";
import indexStyles from "styles/index.module.scss";
import Link from "next/link";
import Head from "next/head";
import { Eye, EyeClosed } from "phosphor-react";
import React, { FormEvent, ReactElement, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { useToastContext } from "src/contexts/toastContext";
import { useUserContext } from "src/contexts/userContext";
import { IUser } from "src/types/general";

interface ApiRequest {
    username: string;
    password: string;
}

interface ApiResponse {
    success: boolean;
    user: IUser;
}

export default function Login(): ReactElement {
    const toast = useToastContext();
    const { user, login } = useUserContext();

    const [passwordHidden, setPasswordHidden] = useState(true);
    const [form, setForm] = useState({
        username: "",
        password: "",
    });
    const [loginAllowed, setLoginAllowed] = useState(true);

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
        if (loginAllowed) {
            setLoginAllowed(false);
            if (validateForm()) {
                axios
                    .post<ApiRequest, AxiosResponse<ApiResponse>>(
                        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/users/login`,
                        form,
                        { withCredentials: true }
                    )
                    .then((res) => {
                        toast("Successfully logged in", 5000);
                        if (res.data.success) {
                            login(res.data.user);
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

    if (user) return <></>;

    return (
        <>
            <Head>
                <title>Log in - Twatter</title>
            </Head>
            <StatusBarLoggedOut></StatusBarLoggedOut>
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
                        <button
                            className={`text-medium mt-1 mx-5Percent ${styles.button} ${indexStyles.filledButton}`}
                        >
                            Log In
                        </button>
                        <p className="text-white text-center mt-1">
                            <Link href="/forgot-password">
                                <a className="linkColor">Forgot your password?</a>
                            </Link>
                        </p>
                        <p className="usernameGrey text-center my-1">or</p>
                        <p className="text-white text-center">
                            <Link href="/register">
                                <a className="linkColor">Don&apos;t have an account yet? Sign up</a>
                            </Link>
                        </p>
                    </form>
                </div>
            </LayoutRegular>
        </>
    );
}
