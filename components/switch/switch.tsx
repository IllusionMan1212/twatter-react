import { ReactElement } from "react";
import { SwitchProps } from "src/types/props";
import styles from "./switch.module.scss";

export default function Switch(props: SwitchProps): ReactElement {
    return (
        <div className={`${styles.switch} ${props.disabled ? styles.disabled : ""}`}>
            <input
                type="checkbox"
                name={props.name}
                disabled={props.disabled}
                checked={props.checked}
            />
        </div>
    );
}
