/* eslint-disable react/react-in-jsx-scope */
import { createContext, ReactElement, useContext, useEffect, useState, SetStateAction, Dispatch, useCallback } from "react";
import { useUserContext } from "./userContext";
import { useToastContext } from "./toastContext";
import axiosInstance from "src/axios";
import axios, { AxiosResponse } from "axios";
import { ISocketMessage } from "src/types/general";
import { ContextWrapperProps } from "src/types/props";

interface GlobalContextType {
    unreadMessages: string[];
    setUnreadMessages: Dispatch<SetStateAction<string[]>>;
    activeConversationId: string;
    setActiveConversationId: Dispatch<SetStateAction<string>>;
}

interface ApiResponse {
    unreadMessages: string[];
}

const GlobalContextDefaultValues: GlobalContextType = {
    unreadMessages: [],
    setUnreadMessages: null,
    activeConversationId: null,
    setActiveConversationId: null
};

const GlobalContext = createContext<GlobalContextType>(
    GlobalContextDefaultValues
);

export function GlobalWrapper({ children }: ContextWrapperProps): ReactElement {
    const { user, socket } = useUserContext();
    const toast = useToastContext();

    const [unreadMessages, setUnreadMessages] = useState<string[]>([]);
    const [activeConversationId, setActiveConversationId] = useState("");

    const handleError = useCallback(
        (payload) => {
            toast(payload.message, 4000);
        },
        [toast]
    );

    const handleMessage = useCallback((msg: ISocketMessage) => {
        if (msg.author_id != user.id && activeConversationId != msg.conversation_id) {
            if (!unreadMessages.includes(msg.conversation_id)) {
                setUnreadMessages(unreadMessages.concat(msg.conversation_id));
            }
        }
    }, [user, unreadMessages, activeConversationId]);

    useEffect(() => {
        if (socket) {
            socket.on("message", handleMessage);
            socket.on("error", handleError);
        }

        return () => {
            if (socket) {
                socket.off("message", handleMessage);
                socket.off("error", handleError);
            }
        };
    }, [socket, handleMessage]);

    useEffect(() => {
        if (user) {
            const cancelToken = axios.CancelToken;
            const tokenSource = cancelToken.source();
            axiosInstance
                .get("/messaging/getUnreadMessages", {
                    cancelToken: tokenSource.token,
                })
                .then((res: AxiosResponse<ApiResponse>) => {
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
