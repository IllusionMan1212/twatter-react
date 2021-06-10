/* eslint-disable react/react-in-jsx-scope */
import styles from "./statusBar.module.scss";
import Router from "next/router";
import Search from "./search";
import { ChatsTeardrop, ArrowLeft, Bell } from "phosphor-react";
import UserContextMenu from "./userContextMenu";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { StatusBarProps } from "../src/types/props";
import { socket } from "src/hooks/useSocket";
import { useToastContext } from "../src/contexts/toastContext";
import axiosInstance from "../src/axios";
import axios from "axios";
import ProfileImage from "./post/profileImage";

export default function StatusBar(props: StatusBarProps): ReactElement {
    const [userMenu, setUserMenu] = useState(false);

    const toast = useToastContext();

    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadNotifications] = useState(0);

    const handleClickBack = () => {
        history.back();
    };

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
        const cancelToken = axios.CancelToken;
        const tokenSource = cancelToken.source();
        axiosInstance
            .get("/messaging/getUnreadMessages", {
                cancelToken: tokenSource.token,
            })
            .then((res) => {
                setUnreadMessages(res.data.unreadMessages);
            })
            .catch((err) => {
                if (axios.isCancel(err)) {
                    console.log("request canceled");
                } else {
                    err?.response?.data?.status != 404 &&
                        toast(
                            err?.response?.data?.message ??
                                "An error has occurred while fetching unread messages",
                            4000
                        );
                }
            });
        return () => {
            tokenSource.cancel();
        };
    }, []);

    useEffect(() => {
        if (socket?.connected) {
            socket.on("messageFromServer", handleMessageFromServer);
            socket.on("markedMessagesAsRead", handleMarkedMessagesAsRead);
        }

        return () => {
            if (socket?.connected) {
                socket.off("messageFromServer", handleMessageFromServer);
                socket.off("markedMessagesAsRead", handleMarkedMessagesAsRead);
            }
        };
    }, [handleMessageFromServer, handleMarkedMessagesAsRead]);

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
                <div className={styles.messages}>
                    <ChatsTeardrop
                        className={`mr-1 ${styles.icon}`}
                        size="25"
                        onClick={() => {
                            Router.push("/messages", null, {
                                shallow: true,
                            });
                        }}
                        weight="fill"
                    ></ChatsTeardrop>
                    {unreadMessages != 0 && (
                        <div className={styles.unreadBubble}>
                            {unreadMessages > 99 ? "99+" : unreadMessages}
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
                        src={props.user.profile_image}
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
