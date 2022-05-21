import axios from "src/axios";
import { Dispatch, ReactElement, SetStateAction, useEffect } from "react";
import styles from "./userContextMenu.module.scss";
import ProfileImage from "components/post/profileImage";
import { useUserContext } from "src/contexts/userContext";
import Profile from "components/userContextMenu/profile";
import ReportBug from "components/userContextMenu/reportBug";
import Settings from "components/userContextMenu/settings";
import Logout from "components/userContextMenu/logout";
import Router from "next/router";
import { useGlobalContext } from "src/contexts/globalContext";

export interface UserContextMenuProps {
    open: boolean;
    setUserMenu: Dispatch<SetStateAction<boolean>>;
}

export default function UserContextMenu(
    props: UserContextMenuProps
): ReactElement {
    const { user, logout } = useUserContext();
    const { showToast } = useGlobalContext();

    const _logout = () => {
        axios
            .delete("/users/logout")
            .then(() => {
                logout();
                showToast("Logged out", 3000);
                Router.push("/login");
            })
            .catch((err) => {
                console.error(err);
            });
    };

    useEffect(() => {
        if (props.open) {
            document.body.classList.add("overflow-hidden");
            document.body.classList.remove("overflow-unset");
        } else {
            document.body.classList.remove("overflow-hidden");
            document.body.classList.add("overflow-unset");
        }

        return () => {
            document.body.classList.remove("overflow-hidden");
            document.body.classList.add("overflow-unset");
        };
    }, [props.open]);

    useEffect(() => {
        return () => {
            document.body.classList.remove("overflow-hidden");
            document.body.classList.add("overflow-unset");
        };
    }, []);

    return (
        <div className={`${styles.menuContainer} ${props.open ? styles.menuOpen : ""}`}>
            <div
                className={`${styles.menu}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <ProfileImage
                        width={35}
                        height={35}
                        src={user.avatar_url}
                        alt={user.username}
                    />
                    {user.display_name}
                </div>
                <div>
                    <Profile user={user} setUserMenu={props.setUserMenu} />
                    <ReportBug setUserMenu={props.setUserMenu} />
                    <Settings setUserMenu={props.setUserMenu} />
                    <Logout setUserMenu={props.setUserMenu} logout={_logout} />
                </div>
            </div>
        </div>
    );
}
