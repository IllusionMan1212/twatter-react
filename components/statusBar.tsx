/* eslint-disable react/react-in-jsx-scope */
import styles from "./statusBar.module.scss";
import Router from "next/router";
import Search from "./search";
import { ChatsTeardrop, ArrowLeft, Bell } from "phosphor-react";
import UserContextMenu from "./userContextMenu";
import { ReactElement, useState } from "react";
import { StatusBarProps } from "src/types/props";
import ProfileImage from "./post/profileImage";
import { useGlobalContext } from "src/contexts/globalContext";

export default function StatusBar(props: StatusBarProps): ReactElement {
    const { unreadMessages } = useGlobalContext();

    const [userMenu, setUserMenu] = useState(false);
    const [unreadNotifications] = useState(0);

    const handleClickBack = () => {
        history.back();
    };

    return (
        <div
            className={`flex text-white align-items-center ${styles.statusBar}`}
        >
            {props.backButton && (
                <div
                    className={styles.backButton}
                    onClick={handleClickBack}
                >
                    <ArrowLeft size="30"></ArrowLeft>
                </div>
            )}
            <div
                className={`flex align-items-center ${styles.title}`}
            >
                <p className="text-bold ellipsis">{props.title}</p>
            </div>
            <div className={styles.search}>
                <Search></Search>
            </div>
            <div className={`ml-auto flex align-items-center ${styles.messagesAndNotifs}`}>
                <div
                    className={styles.messages}
                    onClick={() => {
                        Router.push("/messages", null, {
                            shallow: true,
                        });
                    }}
                >
                    <ChatsTeardrop
                        className={`mr-1 ${styles.icon}`}
                        size="25"
                        weight="fill"
                    ></ChatsTeardrop>
                    {unreadMessages.length != 0 && (
                        <div className={styles.unreadBubble}>
                            {unreadMessages.length > 99 ? "99+" : unreadMessages.length}
                        </div>
                    )}
                </div>
                <div className={styles.notifs}>
                    <Bell
                        className={`mr-1 ${styles.icon}`}
                        size="25"
                        onClick={() => {
                            Router.push("/notifications", null, {
                                shallow: true,
                            });
                        }}
                        weight="fill"
                    ></Bell>
                    {unreadNotifications != 0 && (
                        <div className={styles.unreadBubble}>
                            {unreadNotifications > 99 ? "99+" : unreadNotifications}
                        </div>
                    )}
                </div>
                <div
                    className={`flex align-items-center ${styles.user}`}
                    onClick={() => {
                        setUserMenu(!userMenu);
                    }}
                >
                    <ProfileImage
                        width={38}
                        height={38}
                        src={props.user.avatar_url}
                    />
                    <UserContextMenu
                        currentUser={props.user}
                        open={userMenu}
                    ></UserContextMenu>
                </div>
            </div>
        </div>
    );
}
