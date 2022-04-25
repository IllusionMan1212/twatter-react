import { SignOut } from "phosphor-react";
import { Dispatch, memo, ReactElement, SetStateAction } from "react";
import styles from "./userContextMenu.module.scss";

interface LogoutProps {
    setUserMenu: Dispatch<SetStateAction<boolean>>;
    logout: () => void;
}

const Logout = memo(function Logout({
    setUserMenu,
    logout,
}: LogoutProps): ReactElement {
    return (
        <div
            className={styles.menuItem}
            onClick={() => {
                logout();
                setUserMenu(false);
            }}
        >
            <SignOut size={25} />
            <p>Logout</p>
        </div>
    );
});

export default Logout;
