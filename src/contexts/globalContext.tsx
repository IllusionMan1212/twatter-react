import { createContext, ReactElement, useContext, useEffect, useState, SetStateAction, Dispatch, useCallback } from "react";
import { useUserContext } from "src/contexts/userContext";
import axiosInstance from "src/axios";
import axios, { AxiosResponse } from "axios";
import { ISocketMessage } from "src/types/general";
import { ContextWrapperProps } from "src/types/props";
import Share from "components/share/share";
import StatusBar from "components/statusBar/statusBar";
import Navbar from "components/navbar/navbar";
import { useRouter } from "next/router";
import Toaster from "components/toaster/toaster";

interface ISharer {
    enabled: boolean;
    text?: string;
    url?: string;
}

interface GlobalContextType {
    unreadConversations: string[];
    setUnreadConversations: Dispatch<SetStateAction<string[]>>;
    activeConversationId: string;
    setActiveConversationId: Dispatch<SetStateAction<string>>;
    sharer: ISharer;
    setSharer: Dispatch<SetStateAction<ISharer>>;
    setStatusBarTitle: Dispatch<SetStateAction<string>>;
    showToast: (text: string, length: number) => void;
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
    ["/404", "404"],
]);

const SharerDefaultValues: ISharer = {
    enabled: false,
    text: "",
    url: "",
};

const GlobalContextDefaultValues: GlobalContextType = {
    unreadConversations: [],
    setUnreadConversations: null,
    activeConversationId: null,
    setActiveConversationId: null,
    sharer: SharerDefaultValues,
    setSharer: null,
    setStatusBarTitle: null,
    showToast: null,
};

const GlobalContext = createContext<GlobalContextType>(
    GlobalContextDefaultValues
);

export function GlobalWrapper({ children }: ContextWrapperProps): ReactElement {
    const { user, socket } = useUserContext();
    const router = useRouter();

    const [unreadConversations, setUnreadConversations] = useState<string[]>([]);
    const [activeConversationId, setActiveConversationId] = useState("");
    const [sharer, setSharer] = useState<ISharer>(SharerDefaultValues);
    const [statusBarTitle, setStatusBarTitle] = useState("");
    const [toasts, setToasts] = useState([]);

    const handleError = useCallback((payload) => {
        showToast(payload.message, 4000);
    }, []);

    const showToast = (text: string, length: number) => {
        const id = (
            Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
        ).toUpperCase();
        setToasts((toasts) => {
            return toasts.concat({ text: text, id: id });
        });

        setTimeout(() => {
            setToasts((toasts) => {
                return toasts.filter((toasts) => toasts.id != id);
            });
        }, length);
    };


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

    useEffect(() => {
        if (!user) {
            setStatusBarTitle("");
            setUnreadConversations([]);
            setActiveConversationId("");
            setSharer(SharerDefaultValues);
        }
    }, [user]);

    const handleMessage = useCallback((msg: ISocketMessage) => {
        if (msg.author_id != user.id && activeConversationId != msg.conversation_id) {
            if (!unreadConversations.includes(msg.conversation_id)) {
                setUnreadConversations(unreadConversations.concat(msg.conversation_id));
            }
        }
    }, [user, unreadConversations, activeConversationId]);

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
                    setUnreadConversations(res.data.unreadMessages);
                })
                .catch((err) => {
                    if (axios.isCancel(err)) {
                        console.log("request canceled");
                    } else {
                        err?.response?.data?.status != 404 &&
                            showToast(
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
        if (user && statusBarTitles.has(router.route)) {
            setStatusBarTitle(statusBarTitles.get(router.route));
        }
    }, [router.route, user]);

    return (
        <>
            <GlobalContext.Provider value={{
                unreadConversations,
                setUnreadConversations,
                activeConversationId,
                setActiveConversationId,
                sharer,
                setSharer,
                setStatusBarTitle,
                showToast,
            }}>
                <Toaster toasts={toasts} />
                <Share text={sharer.text} url={sharer.url} />
                <StatusBar title={statusBarTitle} />
                <Navbar />
                {children}
            </GlobalContext.Provider>
        </>
    );
}

export function useGlobalContext(): GlobalContextType {
    return useContext(GlobalContext);
}
