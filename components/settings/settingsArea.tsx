import { ReactElement } from "react";
import AccountSettings from "components/settings/account/accountSettings";
import PrivacySettings from "components/settings/privacySettings";
import NotificationsSettings from "components/settings/notificationsSettings";
import SecuritySettings from "components/settings/securitySettings";
import styles from "components/settings/settingsArea.module.scss";
import { SettingsItems } from "src/reducers/settingsReducer";
import { SettingsAreaProps } from "src/types/props";
import { ArrowLeft } from "phosphor-react";
import Router from "next/router";

export default function SettingsArea({ state, dispatch }: SettingsAreaProps): ReactElement {
    const handleClick = () => {
        Router.back();
    }

    return (
        <div className={`${styles.container} ${state.activeSettingsItem != SettingsItems.None && styles.active}`}>
            {state.activeSettingsItem == SettingsItems.Account ? (
                <>
                    <div className={styles.header}>
                        <div className={styles.backButton} onClick={handleClick}>
                            <ArrowLeft size="30" />
                        </div>
                        <p className={styles.title}>Account</p>
                    </div>
                    <div className={styles.body}>
                        <AccountSettings dispatch={dispatch}/>
                    </div>
                </>
            ) : state.activeSettingsItem == SettingsItems.Privacy ? (
                <>
                    <div className={styles.header}>
                        <div className={styles.backButton} onClick={handleClick}>
                            <ArrowLeft size="30" />
                        </div>
                        <p className={styles.title}>Privacy</p>
                    </div>
                    <div className={styles.body}>
                        <PrivacySettings/>
                    </div>
                </>
            ) : state.activeSettingsItem == SettingsItems.Notifications ? (
                <>
                    <div className={styles.header}>
                        <div className={styles.backButton} onClick={handleClick}>
                            <ArrowLeft size="30" />
                        </div>
                        <p className={styles.title}>Notifications</p>
                    </div>
                    <div className={styles.body}>
                        <NotificationsSettings/>
                    </div>
                </>
            ) : state.activeSettingsItem == SettingsItems.Security ? (
                <>
                    <div className={styles.header}>
                        <div className={styles.backButton} onClick={handleClick}>
                            <ArrowLeft size="30" />
                        </div>
                        <p className={styles.title}>Security</p>
                    </div>
                    <div className={styles.body}>
                        <SecuritySettings/>
                    </div>
                </>
            ) : null}
        </div>
    )
}
