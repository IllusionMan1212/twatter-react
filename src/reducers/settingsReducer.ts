import { SettingsAction, SettingsActions } from "src/actions/settingsActions";

export enum SettingsItems {
    None = "",
    Account = "account",
    Privacy = "privacy",
    Notifications = "notifications",
    Security = "security",
}

export interface SettingsState {
    activeSettingsItem: SettingsItems;
}

export function SettingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
    switch (action.type) {
    case SettingsActions.CHANGE_SETTINGS:
        return {
            ...state,
            activeSettingsItem: action.payload.activeSettingsItem
        }
    }
}
