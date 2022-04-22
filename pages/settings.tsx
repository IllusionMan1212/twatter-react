import StatusBar from "components/statusBar/statusBar";
import Navbar from "components/navbar/navbar";
import { ReactElement, useReducer } from "react";
import { useUserContext } from "src/contexts/userContext";
import SettingsList from "components/settings/settingsList";
import styles from "styles/settings.module.scss";
import SettingsArea from "components/settings/settingsArea";
import { NextSeo } from "next-seo";
import { SettingsState, settingsReducer, SettingsItems } from "src/reducers/settingsReducer";

const initialState: SettingsState = {
    activeSettingsItem: SettingsItems.None,
    popupEnabled: false,
    popupComponent: null,
};

export default function Settings(): ReactElement {
    const { user } = useUserContext();

    const [state, dispatch] = useReducer(settingsReducer, initialState);

    if (!user) return null;

    return (
        <>
            <NextSeo title="Settings - Twatter"/>
            <Navbar/>
            <StatusBar title="Settings"/>
            <div className={styles.container}>
                <SettingsList state={state} dispatch={dispatch}/>
                <SettingsArea state={state} dispatch={dispatch}/>
            </div>
            {state.popupEnabled && (
                <div>
                    <state.popupComponent dispatch={dispatch}/>
                </div>
            )
            }
        </>
    );
}
