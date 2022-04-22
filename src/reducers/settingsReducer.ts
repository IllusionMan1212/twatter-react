import { FunctionComponent } from "react";
import { SettingsAction, SettingsActions } from "src/actions/settingsActions";
import { SettingsPopupProps } from "src/types/props";

export enum SettingsItems {
    None = "",
    Account = "account",
    Privacy = "privacy",
    Notifications = "notifications",
    Security = "security",
}

export interface SettingsState {
    activeSettingsItem: SettingsItems;
    popupEnabled: boolean;
    popupComponent: FunctionComponent<SettingsPopupProps>;
}

export function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
    switch (action.type) {
    case SettingsActions.CHANGE_SETTINGS:
        return {
            ...state,
            activeSettingsItem: action.payload.activeSettingsItem,
            popupEnabled: false,
            popupComponent: null
        };
    case SettingsActions.TOGGLE_POPUP:
        return {
            ...state,
            popupEnabled: action.payload.popupEnabled,
            popupComponent: action.payload.popupComponent,
        };
    }
}
