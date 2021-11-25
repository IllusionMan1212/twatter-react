import { ReactElement } from "react";
import Button from "components/buttons/button";
import { ButtonType } from "src/types/props";
import styles from "components/settings/accountSettings.module.scss";
import { useUserContext } from "src/contexts/userContext";

export default function AccountSettings(): ReactElement {
    const { user } = useUserContext();

    const handleClick = () => {
        // TODO: delete account
    }

    return (
        <div className={styles.container}>
            <div className={styles.setting}>
                <div className={styles.title}>Username</div>
                <div className={styles.option}>@{user.username}</div>
            </div>
            <div className={styles.setting}>
                <div className={styles.title}>Password</div>
                <div className={styles.option}>*****************</div>
            </div>
            <Button
                text="Delete Account"
                type={ButtonType.Danger}
                size={10}
                handleClick={handleClick}
            />
        </div>
    )
}
