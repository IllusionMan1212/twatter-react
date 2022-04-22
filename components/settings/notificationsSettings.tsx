import { ReactElement } from "react";
import Switch from "components/switch/switch";
import styles from "./common.module.scss";

export default function NotificationsSettings(): ReactElement {
    return (
        <div className={styles.settingsContainer}>
            <div className={styles.setting}>
                <div className={styles.title}>Receive notifications</div>
                <div className={styles.option}>
                    <Switch checked/>
                </div>
            </div>
            <div>
                <h2>NOTE: These settings don&apos;t do anything yet</h2>
            </div>
        </div>
    );
}
