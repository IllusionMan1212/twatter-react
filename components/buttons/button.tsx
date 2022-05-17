import { ReactElement } from "react";
import { ButtonProps, ButtonType } from "src/types/props";
import styles from "./button.module.scss";

export default function Button(props: ButtonProps): ReactElement {
    return (
        <div
            className={`${styles.button} ${props.disabled ? styles.buttonDisabled : ""} ${
                props.type == ButtonType.Danger
                    ? styles.danger
                    : props.type == ButtonType.Warning
                        ? styles.warning
                        : styles.regular
            }`}
            style={{
                padding: `${props.size}px ${props.size * 2}px`,
                fontSize: props.size * 1.5,
            }}
            onClick={props.handleClick}
        >
            {props.text}
        </div>
    );
}
