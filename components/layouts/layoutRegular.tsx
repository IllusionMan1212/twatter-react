/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import styles from "./layoutRegular.module.scss";

export default function LayoutRegular(props: {children: React.ReactElement | React.ReactElement[]}): ReactElement {
    return <div className={styles.container}>{props.children}</div>;
}
