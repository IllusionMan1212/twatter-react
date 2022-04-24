/* eslint-disable react/react-in-jsx-scope */
import axios from "src/axios";
import Router from "next/router";
import { Dispatch, ReactElement, SetStateAction, useEffect } from "react";
import { useToastContext } from "src/contexts/toastContext";
import styles from "./userContextMenu.module.scss";
import { Gear, SignOut, UserCircle, Bug } from "phosphor-react";
import ProfileImage from "./post/profileImage";
import { useUserContext } from "src/contexts/userContext";
import Link from "next/link";

export interface UserContextMenuProps {
    open: boolean;
    setUserMenu: Dispatch<SetStateAction<boolean>>;
}

export default function UserContextMenu(
    props: UserContextMenuProps
): ReactElement {
    const toast = useToastContext();
    const { user, logout } = useUserContext();

    const _logout = () => {
        axios
            .delete("/users/logout")
            .then(() => {
                logout();
                toast("Logged out", 3000);
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
                    />{" "}
                    {user.display_name}
                </div>
                <div>
                    <Link href={`/u/${user.username}`}>
                        <a>
                            <div
                                className={styles.menuItem}
                                onClick={() => {
                                    Router.push(`/u/${user.username}`);
                                    props.setUserMenu(false);
                                }}
                            >
                                <UserCircle size={25}/>
                                <p>Profile</p>
                            </div>
                        </a>
                    </Link>
                    <a href="https://github.com/illusionman1212/twatter/issues" target="_blank" rel="noreferrer">
                        <div
                            className={styles.menuItem}
                            onClick={() => {
                                props.setUserMenu(false);
                            }}
                        >
                            <Bug size={25}/>
                            <p>Report a bug</p>
                        </div>
                    </a>
                    <Link href="/settings">
                        <a>
                            <div
                                className={styles.menuItem}
                                onClick={() => {
                                    props.setUserMenu(false);
                                }}
                            >
                                <Gear size={25}/>
                                <p>Settings</p>
                            </div>
                        </a>
                    </Link>
                    <div
                        className={styles.menuItem}
                        onClick={() => {
                            _logout();
                            props.setUserMenu(false);
                        }}
                    >
                        <SignOut size={25}/>
                        <p>Logout</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
