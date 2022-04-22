import LayoutRegular from "components/layouts/layoutRegular";
import styles from "./statusBarLoggedOut.module.scss";
import Link from "next/link";
import { ReactElement } from "react";

export default function StatusBarLoggedOut(): ReactElement {
    return (
        <LayoutRegular>
            <Link href="/" passHref>
                <div className="text-white">
                    <p className={`text-large ${styles.header}`}>
                        <a className={styles.links}>Twatter</a>
                    </p>
                </div>
            </Link>
        </LayoutRegular>
    );
}
