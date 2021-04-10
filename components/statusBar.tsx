/* eslint-disable react/react-in-jsx-scope */
import styles from "./statusBar.module.scss";
import Router from "next/router";
import Search from "./search";
import { ChatsTeardrop, ArrowLeft } from "phosphor-react";
import UserContextMenu from "./userContextMenu";
import { ReactElement, useState, useCallback, useEffect } from "react";
import { StatusBarProps } from "../src/types/props";
import { socket } from "src/hooks/useSocket";
import { useToastContext } from "../src/contexts/toastContext";
import axiosInstance from "../src/axios";
import axios from "axios";

export default function StatusBar(props: StatusBarProps): ReactElement {
    const [userMenu, setUserMenu] = useState(false);

    const toast = useToastContext();

    const [unreadMessages, setUnreadMessages] = useState(0);

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
        // only make a request if we're on mobile
        if (window.innerWidth <= 800) {
            axiosInstance
                .get("/messaging/getUnreadMessages", {
                    cancelToken: tokenSource.token,
                })
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
            className={`flex text-white align-items-center mr-1Percent ${styles.statusBar}`}
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
                className={`ml-3Percent mt-1Percent flex align-items-center ${styles.title}`}
            >
                <p className="text-bold ellipsis">{props.title}</p>
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
                        <div className={styles.unreadBubble}>
                            {unreadMessages > 99 ? "99+" : unreadMessages}
                        </div>
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
                        src={`${
                            props.user.profile_image == "default_profile.svg"
                                ? "/"
                                : ""
                        }${props.user.profile_image}`}
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
