import { ReactElement  } from "react";
import styles from "./trendingFooter.module.scss";
import Link from "next/link";

export default function TrendingFooter(): ReactElement {
    return (
        <Link href="/trending">
            <a>
                <div className={styles.container}>
                    <p className={styles.text}>See All Trends</p>
                </div>
            </a>
        </Link>
    );
}
