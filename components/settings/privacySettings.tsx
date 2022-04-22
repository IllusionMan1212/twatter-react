import { ReactElement } from "react";
import Switch from "components/switch/switch";
import styles from "./common.module.scss";

export default function PrivacySettings(): ReactElement {
    return (
        <div className={styles.settingsContainer}>
            <div className={styles.setting}>
                <div className={styles.title}>Private account</div>
                <div className={styles.option}>
                    <Switch/>
                </div>
            </div>
            <div className={styles.setting}>
                <div className={styles.title}>Allow messages from anyone</div>
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
