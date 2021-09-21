/* eslint-disable react/react-in-jsx-scope */
import { createContext, ReactElement, useContext, useEffect, useState, SetStateAction, Dispatch, useCallback } from "react";
import { useUserContext } from "./userContext";
import { useToastContext } from "./toastContext";
import axiosInstance from "src/axios";
import axios from "axios";
import { ISocketMessage } from "src/types/general";

interface GlobalContextType {
    unreadMessages: string[];
    setUnreadMessages: Dispatch<SetStateAction<string[]>>;
    activeConversationId: string;
    setActiveConversationId: Dispatch<SetStateAction<string>>;
}

const GlobalContextDefaultValues: GlobalContextType = {
    unreadMessages: [],
    setUnreadMessages: () => {},
    activeConversationId: null,
    setActiveConversationId: () => {}
};

const GlobalContext = createContext<GlobalContextType>(
    GlobalContextDefaultValues
);

export function GlobalWrapper({ children }: any): ReactElement {
    const { user, socket } = useUserContext();
    const toast = useToastContext();

    const [unreadMessages, setUnreadMessages] = useState<string[]>([]);
    const [activeConversationId, setActiveConversationId] = useState("");

    const handleMessage = useCallback((msg: ISocketMessage) => {
        if (msg.author_id != user.id && activeConversationId != msg.conversation_id) {
            if (!unreadMessages.includes(msg.conversation_id)) {
                setUnreadMessages(unreadMessages.concat(msg.conversation_id));
            }
        }
    }, [toast, user, unreadMessages, activeConversationId]);

    useEffect(() => {
        if (socket) {
            socket.on("message", handleMessage);
        }

        return () => {
            if (socket) {
                socket.off("message", handleMessage);
            }
        }
    }, [socket, handleMessage]);

    useEffect(() => {
        if (user) {
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
        }
    }, [user, toast]);

    return (
        <>
            <GlobalContext.Provider value={{ unreadMessages, setUnreadMessages, activeConversationId, setActiveConversationId }}>
                {children}
            </GlobalContext.Provider>
        </>
    );
}

export function useGlobalContext(): GlobalContextType {
    return useContext(GlobalContext);
}
