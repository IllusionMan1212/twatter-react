import { FunctionComponent } from "react";
import { SettingsItems } from "src/reducers/settingsReducer";
import { SettingsPopupProps } from "src/types/props";

export enum SettingsActions {
    CHANGE_SETTINGS = 1,
    TOGGLE_POPUP,
}

interface ChangeSettingsAction {
    type: SettingsActions.CHANGE_SETTINGS,
    payload: {
        activeSettingsItem: SettingsItems
    }
}

interface TogglePopupAction {
    type: SettingsActions.TOGGLE_POPUP,
    payload: {
        popupEnabled: boolean,
        popupComponent: FunctionComponent<SettingsPopupProps>
    }
}

export type SettingsAction = ChangeSettingsAction | TogglePopupAction
