import { createContext, ReactElement, useContext, useEffect, useState, SetStateAction, Dispatch, useCallback } from "react";
import { useUserContext } from "./userContext";
import { ToastWrapper, useToastContext } from "./toastContext"; import axiosInstance from "src/axios";
import axios, { AxiosResponse } from "axios";
import { ISocketMessage } from "src/types/general";
import { ContextWrapperProps } from "src/types/props";
import Share from "components/share/share";
import StatusBar from "components/statusBar/statusBar";
import Navbar from "components/navbar/navbar";
import { useRouter } from "next/router";

interface ISharer {
    enabled: boolean;
    text?: string;
    url?: string;
}

interface GlobalContextType {
    unreadMessages: string[];
    setUnreadMessages: Dispatch<SetStateAction<string[]>>;
    activeConversationId: string;
    setActiveConversationId: Dispatch<SetStateAction<string>>;
    sharer: ISharer;
    setSharer: Dispatch<SetStateAction<ISharer>>;
    setStatusBarTitle: Dispatch<SetStateAction<string>>;
}

interface ApiResponse {
    unreadMessages: string[];
}

const statusBarTitles = new Map([
    ["/home", "Home"],
    ["/messages/[[...conversationId]]", "Messages"],
    ["/notifications", "Notifications"],
    ["/friends", "Friends"],
    ["/search", "Search"],
    ["/settings", "Settings"],
    ["/trending", "Trending"],
]);

const SharerDefaultValues: ISharer = {
    enabled: false,
    text: "",
    url: "",
};

const GlobalContextDefaultValues: GlobalContextType = {
    unreadMessages: [],
    setUnreadMessages: null,
    activeConversationId: null,
    setActiveConversationId: null,
    sharer: SharerDefaultValues,
    setSharer: null,
    setStatusBarTitle: null,
};

const GlobalContext = createContext<GlobalContextType>(
    GlobalContextDefaultValues
);

export function GlobalWrapper({ children }: ContextWrapperProps): ReactElement {
    const { user, socket } = useUserContext();
    const toast = useToastContext();
    const router = useRouter();

    const [unreadMessages, setUnreadMessages] = useState<string[]>([]);
    const [activeConversationId, setActiveConversationId] = useState("");
    const [sharer, setSharer] = useState<ISharer>(SharerDefaultValues);
    const [statusBarTitle, setStatusBarTitle] = useState("");

    const handleError = useCallback(
        (payload) => {
            toast(payload.message, 4000);
        },
        [toast]
    );

    useEffect(() => {
        if (sharer.enabled) {
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
    }, [sharer.enabled]);

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
    }, [socket, handleMessage, handleError]);

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
    }, [user]);

    useEffect(() => {
        if (statusBarTitles.has(router.route)) {
            setStatusBarTitle(statusBarTitles.get(router.route));
        }
    }, [router.route]);

    return (
        <>
            <GlobalContext.Provider value={{
                unreadMessages,
                setUnreadMessages,
                activeConversationId,
                setActiveConversationId,
                sharer,
                setSharer,
                setStatusBarTitle,
            }}>
                <Share text={sharer.text} url={sharer.url} />
                <ToastWrapper>
                    <StatusBar title={statusBarTitle} />
                    <Navbar />
                    {children}
                </ToastWrapper>
            </GlobalContext.Provider>
        </>
    );
}

export function useGlobalContext(): GlobalContextType {
    return useContext(GlobalContext);
}
