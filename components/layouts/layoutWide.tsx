import { ReactElement } from "react";
import { LayoutProps } from "src/types/props";
import styles from "./layoutWide.module.scss";

export default function LayoutWide(props: LayoutProps): ReactElement {
    return <div className={styles.container}>{props.children}</div>;
}
