import { ReactElement } from "react";
import styles from "components/settings/common.module.scss";
import { SettingsActions } from "src/actions/settingsActions";
import { ButtonType, SettingsPopupProps } from "src/types/props";
import { useUserContext } from "src/contexts/userContext";
import Button from "components/buttons/button";

export default function ChangeUsernamePopup({ dispatch }: SettingsPopupProps): ReactElement {
    const { user } = useUserContext();

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
                    Change your username
                </div>
                <div className={styles.body}>
                    <div className={styles.input}>
                        <label>New Username</label>
                        <input value={user.username}/>
                    </div>
                    <div className={styles.input}>
                        <label>Current Password</label>
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
