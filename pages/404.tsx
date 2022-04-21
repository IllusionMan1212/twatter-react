import styles from "styles/404.module.scss";
import Link from "next/link";
import Head from "next/head";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function NotFound(): ReactElement {
    const { user } = useUserContext();

    return (
        <>
            <Head>
                <title>404 - Twatter</title>
            </Head>
            <div className={`text-white text-center ${styles.container}`}>
                <p className="text-bold text-extra-large">
                    This page doesn&apos;t exist
                </p>
                <p className="text-large">
                    Return{" "}
                    <Link href={`/${user ? "home" : ""}`}>
                        <a className={styles.link}>home</a>
                    </Link>
                </p>
            </div>
        </>
    );
}
