/* eslint-disable react/react-in-jsx-scope */
import LayoutRegular from "./layouts/layoutRegular";
import styles from "./navbarLoggedOut.module.scss";
import Link from "next/link";
import { ReactElement } from "react";

export default function NavbarLoggedOut(): ReactElement {
    return (
        <LayoutRegular>
            <Link href="/">
                <div className="text-white">
                    <p className={`text-large ${styles.header}`}>
                        <a className={styles.links}>Twatter</a>
                    </p>
                </div>
            </Link>
        </LayoutRegular>
    );
}
