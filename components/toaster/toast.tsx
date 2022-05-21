import styles from "./toast.module.scss";
import { ToastProps } from "src/types/props";
import { ReactElement } from "react";

export default function Toast(props: ToastProps): ReactElement {
    return (
        <div id="toast" className={`text-white ${styles.toast}`}>
            {props.text}
        </div>
    );
}
