import { ReactElement } from "react";
import { AdProps } from "src/types/props";
import styles from "./ad.module.scss";

export default function Ad(props: AdProps): ReactElement {
    return (
        <div className={styles.outerContainer}>
            <div className={styles.innerContainer}>
                <div className={styles.image}>
                    <img src={props.imageLink}/>
                </div>
                <div className={styles.data}>
                    <div className={styles.title}>{props.title}</div>
                    <div className={styles.description}>{props.description}</div>
                    <a className={styles.link} href={props.link} target="_blank">
                        <div>{props.linkText}</div>
                    </a>
                </div>
                <div className={styles.tag}>Ad</div>
            </div>
        </div>
    )
}
