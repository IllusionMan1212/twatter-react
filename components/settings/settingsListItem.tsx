import { ReactElement } from "react";
import styles from "./settingsListItem.module.scss";
import { SettingsListItemProps } from "src/types/props";

export default function SettingsListItem(props: SettingsListItemProps): ReactElement {
    return (
        <div
            className={`${styles.container} ${props.isActive && styles.active}`}
            onClick={props.onClick}
        >
            <div>
                <props.icon
                    size={32}
                />
            </div>
            <div className={styles.text}>
                <div className={styles.title}>{props.title}</div>
                <div className={styles.description}>{props.description}</div>
            </div>
        </div>
    );
}
