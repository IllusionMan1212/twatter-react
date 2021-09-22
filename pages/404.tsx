/* eslint-disable react/react-in-jsx-scope */
import styles from "../styles/404.module.scss";
import Link from "next/link";
import Head from "next/head";
import Loading from "../components/loading";
import { ReactElement, useEffect, useState } from "react";
import axios from "axios";

export default function NotFound(): ReactElement {
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/users/validateToken`,
                { withCredentials: true }
            )
            .then((res) => {
                if (res.data.user) {
                    setLoading(false);
                    setLoggedIn(true);
                }
            })
            .catch(() => {
                setLoading(false);
                setLoggedIn(false);
            });
    }, []);

    return (
        <>
            <Head>
                <title>404 - Twatter</title>
            </Head>
            {!loading ? (
                <div className={`text-white text-center ${styles.container}`}>
                    <p className="text-bold text-extra-large">
                        This page doesn&apos;t exist
                    </p>
                    <p className="text-large">
                        Return{" "}
                        <Link href={`/${loggedIn ? "home" : ""}`}>
                            <a className={styles.link}>home</a>
                        </Link>
                    </p>
                </div>
            ) : (
                <Loading height="100" width="100"></Loading>
            )}
        </>
    );
}
