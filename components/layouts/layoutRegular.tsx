import { ReactElement } from "react";
import { LayoutProps } from "src/types/props";
import styles from "./layoutRegular.module.scss";

export default function LayoutRegular(props: LayoutProps): ReactElement {
    return <div className={styles.container}>{props.children}</div>;
}
