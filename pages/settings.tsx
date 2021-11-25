/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Navbar from "components/navbar/navbar";
import { ReactElement, useReducer } from "react";
import { useUserContext } from "src/contexts/userContext";
import SettingsList from "components/settings/settingsList";
import styles from "styles/settings.module.scss";
import SettingsArea from "components/settings/settingsArea";
import { NextSeo } from "next-seo";
import { SettingsState, SettingsReducer, SettingsItems } from "src/reducers/settingsReducer";

const initialState: SettingsState = {
    activeSettingsItem: SettingsItems.None,
}

export default function Settings(): ReactElement {
    const { user } = useUserContext();

    const [state, dispatch] = useReducer(SettingsReducer, initialState);

    if (!user) return null;

    return (
        <>
            <NextSeo title="Settings - Twatter"/>
            <Navbar user={user}/>
            <StatusBar user={user} title="Settings"/>
            <div className={styles.container}>
                <SettingsList state={state} dispatch={dispatch}/>
                <SettingsArea state={state}/>
            </div>
        </>
    );
}
