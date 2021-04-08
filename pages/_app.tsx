import { AppProps } from "next/app";
import Head from "next/head";
import React, { ReactElement, useCallback, useEffect } from "react";
import { ToastWrapper, useToastContext } from "../src/contexts/toastContext";
import "../styles/globals.scss";

import "swiper/swiper.scss";
import "swiper/components/navigation/navigation.scss";
import { socket } from "src/socket";

function Twatter({ Component, pageProps }: AppProps): ReactElement {
    const toast = useToastContext();

    const handleError = useCallback(
        (message) => {
            toast(message, 4000);
        },
        [toast]
    );

    useEffect(() => {
        socket?.on("error", handleError);

        return () => {
            socket?.off("error", handleError);
        };
    }, [handleError]);

    return (
        <>
            <Head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <meta
                    name="keywords"
                    content="social media, social platform, community"
                />
                <meta name="copyright" content="Twatter" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content="Twatter" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black" />
                <meta name="theme-color" content="#6067FE" />

                <link
                    rel="icon"
                    type="image/png"
                    sizes="512x512"
                    href="/android-chrome-512x512.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="192x192"
                    href="/android-chrome-192x192.png"
                />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/apple-touch-icon.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="/favicon-32x32.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href="/favicon-16x16.png"
                />
                <link rel="manifest" href="/site.webmanifest" />
                <link
                    rel="mask-icon"
                    href="/safari-pinned-tab.svg"
                    color="#6067fe"
                />
                <meta name="msapplication-TileColor" content="#151515" />
                <meta name="theme-color" content="#6067fe" />
            </Head>
            <ToastWrapper>
                <Component {...pageProps} />
            </ToastWrapper>
        </>
    );
}

export default Twatter;
