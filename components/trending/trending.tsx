import { ReactElement } from "react";
import styles from "./trending.module.scss";
import TrendingHeader from "components/trending/trendingHeader";
import TrendingItem from "components/trending/trendingItem";
import TrendingFooter from "components/trending/trendingFooter";

export default function Trending(): ReactElement {
    return (
        <div className={styles.container}>
            <TrendingHeader/>
            {new Array(3).fill(null).map(() => {
                return <TrendingItem
                    hashtag="IPhone 15"
                    description="Apple's latest IPhone has recently been released and people are freaking out about how expensive it is!"
                    link="iphone_15"
                />
            })}
            <TrendingFooter/>
        </div>
    )
}
