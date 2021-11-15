import { ReactElement } from "react";
import styles from "./trendingHeader.module.scss";

export default function TrendingHeader(): ReactElement {
    return (
        <div className={styles.container}>
            <p className={styles.text}>Trending Right Now</p>
        </div>
    )
}
