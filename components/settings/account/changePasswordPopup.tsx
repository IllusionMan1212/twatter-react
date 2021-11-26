import { ReactElement } from "react";
import { SettingsActions } from "src/actions/settingsActions";
import { ButtonType, SettingsPopupProps } from "src/types/props";
import styles from "components/settings/common.module.scss";
import Button from "components/buttons/button";

export default function ChangePasswordPopup({ dispatch }: SettingsPopupProps): ReactElement {
    const handleClickOutside = () => {
        dispatch({
            type: SettingsActions.TOGGLE_POPUP,
            payload: {
                popupEnabled: false,
                popupComponent: null
            }
        });
    }

    const handleClickConfirm = () => {
        console.log("TODO");
    }

    return (
        <div className={styles.popupContainer} onClick={handleClickOutside}>
            <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    Change your password
                </div>
                <div className={styles.body}>
                    <div className={styles.input}>
                        <label>Current Password</label>
                        <input/>
                    </div>
                    <div className={styles.input}>
                        <label>New Password</label>
                        <input/>
                    </div>
                    <div className={styles.input}>
                        <label>Confirm New Password</label>
                        <input/>
                    </div>
                    <Button
                        size={10}
                        text="Confirm"
                        type={ButtonType.Regular}
                        handleClick={handleClickConfirm}
                    />
                </div>
            </div>
        </div>
    )
}
