import { AppProps } from "next/app";
import Head from "next/head";
import React, { ReactElement } from "react";
import { ToastWrapper } from "../src/contexts/toastContext";
import "../styles/globals.scss";

import "swiper/swiper.scss";
import "swiper/components/navigation/navigation.scss";

function Twatter({ Component, pageProps }: AppProps): ReactElement {
    return (
        <>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <meta
                    name="description"
                    content="A Social platform to bring people together"
                />
                <meta
                    name="keywords"
                    content="social media, social platform, community"
                />
                <meta name="copyright" content="Twatter" />
                <meta property="og:locale" content="en_US" />
                <meta property="og:image" content="https://twatter.illusionman1212.me/assets/img/icons/favicons/android-chrome-192x192.png" />
                <meta property="og:url" content="https://twatter.illusionman1212.me" />
                <meta property="og:type" content="website" />

                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="./assets/img/icons/favicons/apple-touch-icon.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="512x512"
                    href="./assets/img/icons/favicons/android-chrome-512x512.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="192x192"
                    href="./assets/img/icons/favicons/android-chrome-192x192.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="./assets/img/icons/favicons/favicon-32x32.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href="./assets/img/icons/favicons/favicon-16x16.png"
                />
                <link rel="manifest" href="/site.webmanifest" />
                {/* <link rel="mask-icon" href="./assets/img/icons/favicons/safari-pinned-tab.svg" color="#5d6365" /> */}
                <meta name="msapplication-TileColor" content="#6067FE" />
                <meta name="theme-color" content="#6067FE" />
            </Head>
            <ToastWrapper>
                <Component {...pageProps} />
            </ToastWrapper>
        </>
    );
}

export default Twatter;
