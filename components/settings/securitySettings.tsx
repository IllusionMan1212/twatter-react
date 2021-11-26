import { ReactElement } from "react";
import Button from "components/buttons/button";
import { ButtonType } from "src/types/props";
import styles from "./common.module.scss";

export default function SecuritySettings(): ReactElement {
    const handleClick = () => {
        // TODO: 2FA
    }

    return (
        <div className={styles.settingsContainer}>
            <Button
                size={10}
                text="Enable 2FA"
                type={ButtonType.Regular}
                handleClick={handleClick}
            />
            <div>
                <h2>NOTE: These settings don't do anything yet</h2>
            </div>
        </div>
    )
}
