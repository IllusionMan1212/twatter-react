/* eslint-disable react/react-in-jsx-scope */
import Link from "next/link";
import LayoutRegular from "components/layouts/layoutRegular";
import StatusBarLoggedOut from "components/statusBarLoggedOut";
import indexStyles from "styles/index.module.scss";
import { CurrencyCircleDollar, Fingerprint } from "phosphor-react";
import { ReactElement } from "react";

export default function Index(): ReactElement {
    return (
        <>
            <StatusBarLoggedOut></StatusBarLoggedOut>
            <LayoutRegular>
                <div className="text-white">
                    <div className="mt-3 vh-100 text-center">
                        <h1 className="text-extra-large">A social platform</h1>
                        <p
                            className={`text-medium pt-1 ${indexStyles.description}`}
                        >
                            Twatter is just another social platform on the
                            internet.
                        </p>
                        <div className={indexStyles.buttonsContainer}>
                            <Link href="/register">
                                <a>
                                    <div
                                        className={`${indexStyles.button} ${indexStyles.filledButton}`}
                                    >
                                        Sign Up
                                    </div>
                                </a>
                            </Link>
                            <Link href="/login">
                                <a>
                                    <div
                                        className={`${indexStyles.button} ${indexStyles.outlineButton}`}
                                    >
                                        Log In
                                    </div>
                                </a>
                            </Link>
                        </div>
                    </div>
                </div>
            </LayoutRegular>
            <div>
                <div
                    className={`text-thin text-white ${indexStyles.lighterBlack}`}
                >
                    <div className="mx-10Percent">
                        <div className={`py-2 ${indexStyles.privacy}`}>
                            <div className={indexStyles.feature}>
                                <p className="text-regular text-extra-large">
                                    Twatter protects your privacy
                                </p>
                                <p className="text-medium py-1">
                                    Twatter uses modern web technologies to
                                    secure your private information and prevent
                                    outsiders from accessing it
                                </p>
                            </div>
                            <div className={indexStyles.icon}>
                                <Fingerprint color="#F03A47"></Fingerprint>
                            </div>
                        </div>
                        <div className={`py-2 ${indexStyles.noMoney}`}>
                            <div className={indexStyles.icon}>
                                <CurrencyCircleDollar color="#007219"></CurrencyCircleDollar>
                            </div>
                            <div className={indexStyles.feature}>
                                <p className="text-regular text-extra-large">
                                    No monetization. No ads
                                </p>
                                <p className="text-medium py-1">
                                    Twatter will always remain free, and will
                                    never use your data to show you targeted
                                    ads.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div className={`text-white ${indexStyles.darkerBlack}`}>
                    <LayoutRegular>
                        <div className={`pt-5 pb-5 ${indexStyles.footer}`}>
                            <div className={indexStyles.footerItem}>
                                <h2 className="my-1">Contact</h2>
                                <p className="my-1 text-medium">
                                    Reach us at{" "}
                                    <a href="mailto:twatter@illusionman1212.me">
                                        twatter@illusionman1212.me
                                    </a>
                                </p>
                            </div>
                            <div className={indexStyles.footerItem}>
                                <h2 className="my-1">Legal</h2>
                                <p className="my-1 text-medium">
                                    <Link href="/terms-of-service">
                                        <a>Terms of Service</a>
                                    </Link>
                                </p>
                                <p className="mt-1 text-medium">
                                    <Link href="/privacy-policy">
                                        <a>Privacy Policy</a>
                                    </Link>
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-medium text-right pr-2 pb-2">
                                Copyright &copy; 2021 Twatter.
                            </p>
                        </div>
                    </LayoutRegular>
                </div>
            </div>
        </>
    );
}
