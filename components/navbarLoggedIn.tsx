/* eslint-disable react/react-in-jsx-scope */
import styles from "./navbarLoggedIn.module.scss";
import {
    HouseLine,
    Bell,
    Gear,
    ChatsTeardrop,
    MagnifyingGlass,
} from "phosphor-react";
import Router from "next/router";
import { NavbarLoggedInProps } from "../src/types/props";
import { ReactElement, useCallback, useEffect, useState } from "react";
import axiosInstance from "../src/utils/axios";
import { useToastContext } from "../src/contexts/toastContext";
import { socket } from "../src/contexts/socket";

export default function NavbarLoggedIn(
    props: NavbarLoggedInProps
): ReactElement {
    const toast = useToastContext();

    const [unreadMessages, setUnreadMessages] = useState(0);

    const handleMessageFromServer = useCallback(
        (msg) => {
            if (props.user._id != msg.sender) {
                setUnreadMessages(unreadMessages + 1);
            }
        },
        [unreadMessages]
    );

    const handleMarkedMessagesAsRead = useCallback(
        (payload) => {
            setUnreadMessages(unreadMessages - payload.messagesRead);
        },
        [unreadMessages]
    );

    useEffect(() => {
        // only make a request if we're on desktop
        if (window.innerWidth > 800) {
            axiosInstance
                .get("/messaging/getUnreadMessages")
                .then((res) => {
                    setUnreadMessages(res.data.unreadMessages);
                })
                .catch((err) => {
                    err?.response?.data?.status != 404 &&
                        toast(
                            err?.response?.data?.message ??
                                "An error has occurred while fetching unread messages",
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
        <div className={`${styles.navbar}`}>
            <div
                className={`flex flex-column justify-content-center align-items-center ${styles.navbarItem}`}
                onClick={() => {
                    props.setMediaModal?.(false);
                    Router.push("/home", "/home", { shallow: true });
                }}
            >
                <div>
                    <HouseLine size="30"></HouseLine>
                </div>
                <p className="text-small">Home</p>
            </div>
            <div
                className={`flex flex-column justify-content-center align-items-center ${styles.navbarItem} ${styles.navbarItemMobile}`}
            >
                <div>
                    <MagnifyingGlass size="30"></MagnifyingGlass>
                </div>
                <p className="text-small">Search</p>
            </div>
            <div
                className={`flex flex-column justify-content-center align-items-center ${styles.navbarItem} ${styles.navbarItemDesktop}`}
                onClick={() => {
                    props.setMediaModal?.(false);
                    Router.push("/messages", "/messages", {
                        shallow: true,
                    });
                }}
            >
                <div>
                    <ChatsTeardrop size="30"></ChatsTeardrop>
                </div>
                <p className="text-small">Messages</p>
                {unreadMessages != 0 && (
                    <div className={styles.unreadBubble}>
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                    </div>
                )}
            </div>
            <div
                className={`flex flex-column justify-content-center align-items-center ${styles.navbarItem}`}
                onClick={() => {
                    props.setMediaModal?.(false);
                    Router.push("/notifications", "/notifications", {
                        shallow: true,
                    });
                }}
            >
                <div>
                    <Bell size="30"></Bell>
                </div>
                <p className="text-small">Notifications</p>
            </div>
            <div
                className={`flex flex-column justify-content-center align-items-center ${styles.navbarItem}`}
                onClick={() => {
                    props.setMediaModal?.(false);
                    Router.push("/settings", "/settings", {
                        shallow: true,
                    });
                }}
            >
                <div>
                    <Gear size="30"></Gear>
                </div>
                <p className="text-small">Settings</p>
            </div>
        </div>
    );
}
