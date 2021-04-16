/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import { ButtonProps } from "src/types/props";
import styles from "./button.module.scss";

export default function Button(props: ButtonProps): ReactElement {
    return (
        <div
            className={styles.button}
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
