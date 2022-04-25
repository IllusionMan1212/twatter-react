import Link from "next/link";
import { Gear } from "phosphor-react";
import { Dispatch, memo, ReactElement, SetStateAction } from "react";
import styles from "./userContextMenu.module.scss";

interface SettingsProps {
    setUserMenu: Dispatch<SetStateAction<boolean>>;
}

const Settings = memo(function Settings({
    setUserMenu,
}: SettingsProps): ReactElement {
    return (
        <Link href="/settings">
            <a>
                <div
                    className={styles.menuItem}
                    onClick={() => setUserMenu(false)}
                >
                    <Gear size={25} />
                    <p>Settings</p>
                </div>
            </a>
        </Link>
    );
});

export default Settings;
