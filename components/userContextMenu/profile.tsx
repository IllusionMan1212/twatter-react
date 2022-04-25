import Link from "next/link";
import { UserCircle } from "phosphor-react";
import { Dispatch, memo, ReactElement, SetStateAction } from "react";
import { IUser } from "src/types/general";
import styles from "./userContextMenu.module.scss";

interface ProfileProps {
    user: IUser;
    setUserMenu: Dispatch<SetStateAction<boolean>>;
}

const Profile = memo(function Profile({
    user,
    setUserMenu,
}: ProfileProps): ReactElement {
    return (
        <Link href={`/u/${user.username}`}>
            <a>
                <div
                    className={styles.menuItem}
                    onClick={() => setUserMenu(false)}
                >
                    <UserCircle size={25} />
                    <p>Profile</p>
                </div>
            </a>
        </Link>
    );
});

export default Profile;
