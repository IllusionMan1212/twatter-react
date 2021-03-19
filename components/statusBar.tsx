/* eslint-disable react/react-in-jsx-scope */
import styles from "./statusBar.module.scss";
import Router from "next/router";
import Search from "./search";
import { ChatsTeardrop } from "phosphor-react";
import UserContextMenu from "./userContextMenu";
import { ReactElement, useState, useCallback, useEffect } from "react";
import { StatusBarProps } from "../src/types/props";
import { socket } from "../src/socket";
import { useToastContext } from "../src/contexts/toastContext";
import axiosInstance from "../src/axios";

export default function StatusBar(props: StatusBarProps): ReactElement {
    const [userMenu, setUserMenu] = useState(false);

    const toast = useToastContext();

    const [unreadMessages, setUnreadMessages] = useState(0);

    const handleMessageFromServer = useCallback((msg) => {
        if (props.user._id != msg.sender) {
            setUnreadMessages(unreadMessages + 1);
        }
    }, [unreadMessages]);

    const handleMarkedMessagesAsRead = useCallback((payload) => {
        setUnreadMessages(unreadMessages - payload.messagesRead);
    }, [unreadMessages]);

    useEffect(() => {
        // only make a request if we're on mobile
        if (window.innerWidth <= 800) {
            axiosInstance
                .get("/messaging/getUnreadMessages")
                .then((res) => {
                    setUnreadMessages(res.data.unreadMessages);
                })
                .catch((err) => {
                    err?.response?.data?.status != 404 && toast(
                        err?.response?.data?.message ?? "An error has occurred while fetching unread messages",
                        4000
                    );
                });
        }
    }, []);

    useEffect(() => {
        socket?.on("messageFromServer", handleMessageFromServer);
        socket?.on("markedMessagesAsRead", handleMarkedMessagesAsRead);

        return () => {
            socket?.off("messageFromServer", handleMessageFromServer);
            socket?.off("markedMessagesAsRead", handleMarkedMessagesAsRead);
        };
    }, [socket, handleMessageFromServer, handleMarkedMessagesAsRead]);

    return (
        <div
            className={`flex text-white align-items-center mr-1Percent ${styles.statusBar}`}
        >
            <div
                className={`ml-3Percent mt-1Percent flex align-items-center ${styles.title}`}
            >
                <p className="text-bold">{props.title}</p>
            </div>
            <div className={`ml-3Percent mt-1Percent ${styles.search}`}>
                <Search></Search>
            </div>
            <div className="ml-auto flex align-items-center flex-shrink-0">
                <div className={styles.messagesButtonMobile}>
                    <ChatsTeardrop
                        className={"mr-1"}
                        size="30"
                        onClick={() => {
                            Router.push("/messages", "/messages", {
                                shallow: true,
                            });
                        }}
                    ></ChatsTeardrop>
                    {unreadMessages != 0 && (
                        <div className={styles.unreadBubble}>{unreadMessages > 99 ? "99+" : unreadMessages}</div>
                    )}
                </div>
                <div
                    className={`py-1 flex align-items-center ${styles.user}`}
                    onClick={() => {
                        setUserMenu(!userMenu);
                    }}
                >
                    <img
                        className="profileImage"
                        src={`${props.user.profile_image == "default_profile.svg" ? "/" : ""}${props.user.profile_image}`}
                        width="50"
                        height="50"
                        alt="User profile picture"
                    />
                    <p className={`text-bold ${styles.username}`}>
                        {props.user.display_name}
                    </p>
                    {userMenu && (
                        <UserContextMenu
                            currentUser={props.user}
                        ></UserContextMenu>
                    )}
                </div>
            </div>
        </div>
    );
}
