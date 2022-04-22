import { ReactElement, useEffect } from "react";
import SettingsListItem from "components/settings/settingsListItem";
import { UserGear, LockSimple, BellRinging, Fingerprint } from "phosphor-react";
import styles from "./settingsList.module.scss";
import { SettingsItems } from "src/reducers/settingsReducer";
import { SettingsListProps } from "src/types/props";
import { SettingsActions } from "src/actions/settingsActions";
import { useRouter } from "next/router";

export default function SettingsList({ state, dispatch }: SettingsListProps): ReactElement {
    const router = useRouter();

    const handleClick = (item: SettingsItems) => {
        router.push(`/settings#${item}`);
    };

    const handleHashChange = (asPath: string) => {
        switch (asPath) {
        case "/settings#account":
            dispatch({
                type: SettingsActions.CHANGE_SETTINGS,
                payload: {
                    activeSettingsItem: SettingsItems.Account
                }
            });
            break;
        case "/settings#privacy":
            dispatch({
                type: SettingsActions.CHANGE_SETTINGS,
                payload: {
                    activeSettingsItem: SettingsItems.Privacy
                }
            });
            break;
        case "/settings#notifications":
            dispatch({
                type: SettingsActions.CHANGE_SETTINGS,
                payload: {
                    activeSettingsItem: SettingsItems.Notifications
                }
            });
            break;
        case "/settings#security":
            dispatch({
                type: SettingsActions.CHANGE_SETTINGS,
                payload: {
                    activeSettingsItem: SettingsItems.Security
                }
            });
            break;
        default:
            dispatch({
                type: SettingsActions.CHANGE_SETTINGS,
                payload: {
                    activeSettingsItem: SettingsItems.None
                }
            });
            break;
        }
        return true;
    };

    useEffect(() => {
        router.events.on("hashChangeComplete", handleHashChange);

        return () => {
            router.events.off("hashChangeComplete", handleHashChange);
        };
    }, []);

    return (
        <div className={styles.container}>
            <SettingsListItem
                title="Account"
                description="View information about your account and edit it."
                icon={UserGear}
                onClick={() => handleClick(SettingsItems.Account)}
                isActive={state.activeSettingsItem == SettingsItems.Account}
            />
            <SettingsListItem
                title="Privacy"
                description="Control your privacy settings."
                icon={LockSimple}
                onClick={() => handleClick(SettingsItems.Privacy)}
                isActive={state.activeSettingsItem == SettingsItems.Privacy}
            />
            <SettingsListItem
                title="Notifications"
                description="Change how you get notified about posts and messages."
                icon={BellRinging}
                onClick={() => handleClick(SettingsItems.Notifications)}
                isActive={state.activeSettingsItem == SettingsItems.Notifications}
            />
            <SettingsListItem
                title="Security"
                description="2FA, additional security when resetting your password and etc..."
                icon={Fingerprint}
                onClick={() => handleClick(SettingsItems.Security)}
                isActive={state.activeSettingsItem == SettingsItems.Security}
            />
        </div>
    );
}
