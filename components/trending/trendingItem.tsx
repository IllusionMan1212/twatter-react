import { ReactElement } from "react";
import { TrendingItemProps } from "src/types/props";
import styles from "./trendingItem.module.scss";
import Link from "next/link";

export default function TrendingItem(props: TrendingItemProps): ReactElement {
    return (
        <div className={styles.container}>
            <div className={styles.hashtag}>
                <Link href={`/tags/${props.link}`}>
                    <a>
                        #{props.hashtag}
                    </a>
                </Link>
            </div>
            <div className={styles.description}>
                {props.description}
            </div>
        </div>
    )
}
