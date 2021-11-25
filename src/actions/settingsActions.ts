import { SettingsItems } from "src/reducers/settingsReducer";

export enum SettingsActions {
    CHANGE_SETTINGS = 1,
}

interface ChangeSettingsAction {
    type: SettingsActions.CHANGE_SETTINGS,
    payload: {
        activeSettingsItem: SettingsItems
    }
}

export type SettingsAction = ChangeSettingsAction
