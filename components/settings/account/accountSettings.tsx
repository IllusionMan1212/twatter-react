import { ReactElement } from "react";
import Button from "components/buttons/button";
import { AccountSettingsProps, ButtonType } from "src/types/props";
import styles from "components/settings/common.module.scss";
import { useUserContext } from "src/contexts/userContext";
import { Pencil } from "phosphor-react";
import { SettingsActions } from "src/actions/settingsActions";
import ChangeUsernamePopup from "components/settings/account/changeUsernamePopup";
import ChangePasswordPopup from "./changePasswordPopup";
import DeleteAccountPopup from "./deleteAccountPopup";

export default function AccountSettings({ dispatch }: AccountSettingsProps): ReactElement {
    const { user } = useUserContext();

    const handleChangeUsername = () => {
        dispatch({
            type: SettingsActions.TOGGLE_POPUP,
            payload: {
                popupEnabled: true,
                popupComponent: ChangeUsernamePopup
            }
        });
    };

    const handleChangePassword = () => {
        dispatch({
            type: SettingsActions.TOGGLE_POPUP,
            payload: {
                popupEnabled: true,
                popupComponent: ChangePasswordPopup
            }
        });
    };

    const handleDeleteAccount = () => {
        dispatch({
            type: SettingsActions.TOGGLE_POPUP,
            payload: {
                popupEnabled: true,
                popupComponent: DeleteAccountPopup
            }
        });
    };

    return (
        <div className={styles.settingsContainer}>
            <div className={styles.setting}>
                <div className={styles.title}>Username</div>
                <div
                    className={`${styles.option} ${styles["option--editable"]}`}
                    onClick={handleChangeUsername}
                >
                    <span>@{user.username}</span>
                    <Pencil className={styles.icon} size={25}/>
                </div>
            </div>
            <div className={styles.setting}>
                <div className={styles.title}>Password</div>
                <div
                    className={`${styles.option} ${styles["option--editable"]}`}
                    onClick={handleChangePassword}
                >
                    <span>*************</span>
                    <Pencil className={styles.icon} size={25}/>
                </div>
            </div>
            <Button
                text="Delete Account"
                type={ButtonType.Danger}
                size={10}
                handleClick={handleDeleteAccount}
            />
        </div>
    );
}
