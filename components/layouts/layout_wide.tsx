/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import styles from "./layout_wide.module.scss";

export default function LayoutWide(props: {children: React.ReactElement | React.ReactElement[]}): ReactElement {
    return <div className={styles.container}>{props.children}</div>;
}
