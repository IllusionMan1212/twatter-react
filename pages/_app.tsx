import { AppProps } from "next/app";
import Head from "next/head";
import React, { ReactElement } from "react";
import { NextSeo } from "next-seo";
import { UserWrapper } from "src/contexts/userContext";
import { GlobalWrapper } from "src/contexts/globalContext";
import "styles/globals.scss";

import "swiper/scss";
import "swiper/scss/navigation";
import NextProgress from "next-progress";

function Twatter({ Component, pageProps }: AppProps): ReactElement {
    return (
        <>
            <NextSeo
                title={"Twatter"}
                description={"A Social platform to bring people together"}
                openGraph={{
                    title: "Twatter",
                    description: "A Social platform to bring people together",
                    type: "website",
                    // TODO: change this
                    url: "https://twatter.illusionman1212.me",
                    site_name: "Twatter",
                    locale: "en_US",
                    images: [
                        {
                            // TODO: change this
                            url: "https://twatter.illusionman1212.me/android-chrome-192x192.png",
                        },
                    ]
                }}
            />
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

                <meta name="google-site-verification" content="3KdsfNqPVXfzkXL-s_aZF58J1fqLuoojTN47XEkyf2Q" />

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
            <NextProgress color="#6067FE" delay={2} options={{showSpinner: false}} />
            <UserWrapper>
                <GlobalWrapper>
                    <Component {...pageProps} />
                </GlobalWrapper>
            </UserWrapper>
        </>
    );
}

export default Twatter;
