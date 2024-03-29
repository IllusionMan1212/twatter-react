import axios, { AxiosResponse } from "axios";
import Head from "next/head";
import { ReactElement, useState } from "react";
import LayoutRegular from "components/layouts/layoutRegular";
import registerLoginStyles from "styles/register-login.module.scss";
import styles from "styles/forgot-password.module.scss";
import { useUserContext } from "src/contexts/userContext";
import { useGlobalContext } from "src/contexts/globalContext";

interface ApiRequest {
    email: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
}

export default function ForgotPassword(): ReactElement {
    const { user } = useUserContext();
    const { showToast } = useGlobalContext();

    const [email, setEmail] = useState("");
    const [resetAllowed, setResetAllowed] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (resetAllowed) {
            setResetAllowed(false);
            if (!email) {
                showToast("All fields must be set", 4000);
                setResetAllowed(true);
                return;
            }
            const payload = {
                email: email,
            };
            axios
                .post<ApiRequest, AxiosResponse<ApiResponse>>(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/users/forgotPassword`,
                    payload,
                    { withCredentials: true }
                )
                .then((res) => {
                    if (res.data.success) {
                        showToast(res.data.message, 7000);
                        setResetAllowed(true);
                    }
                })
                .catch((err) => {
                    showToast(err?.response?.data?.message ?? "An error has occurred", 5000);
                    setResetAllowed(true);
                });
        }
    };

    if (user) return null;

    return (
        <>
            <Head>
                <title>Forgot password - Twatter</title>
            </Head>
            <LayoutRegular>
                <div className="text-white text-bold text-center my-3">
                    <p className="text-extra-large">Forgot your password?</p>
                    <p className="text-large">We can help</p>
                </div>
                <div className="flex justify-content-center">
                    <form
                        className="flex flex-column justify-content-center max-w-100"
                        onSubmit={handleSubmit}
                    >
                        <input
                            className={`text-medium text-thin my-1 ${registerLoginStyles.input}`}
                            type="email"
                            placeholder="Email"
                            name="email"
                            autoComplete="off"
                            onChange={handleChange}
                        />
                        <button className={`text-medium mt-1 ${styles.button}`}>
                            Next
                        </button>
                    </form>
                </div>
            </LayoutRegular>
        </>
    );
}
