/* eslint-disable react/react-in-jsx-scope */
import styles from "./statusBar.module.scss";
import Router from "next/router";
import Search from "components/search";
import { ChatsTeardrop, ArrowLeft, Bell } from "phosphor-react";
import UserContextMenu from "components/userContextMenu";
import { ReactElement, useState, useEffect } from "react";
import { StatusBarProps } from "src/types/props";
import ProfileImage from "components/post/profileImage";
import { useGlobalContext } from "src/contexts/globalContext";
import Link from "next/link";

export default function StatusBar(props: StatusBarProps): ReactElement {
    const { unreadMessages } = useGlobalContext();

    const [userMenu, setUserMenu] = useState(false);
    const [unreadNotifications] = useState(0);
    const [windowWidth, setWindowWidth] = useState(window?.innerWidth);

    const handleClickBack = () => {
        history.back();
    };

    const handleResize = () => {
        setWindowWidth(window.innerWidth);
    };

    useEffect(() => {
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

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
                {windowWidth > 800 ? (
                    <Link href="/home">
                        <a>
                            <p className="text-bold ellipsis">Twatter</p>
                        </a>
                    </Link>
                ): (
                    <p className="text-bold ellipsis">{props.title}</p>
                )}
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
