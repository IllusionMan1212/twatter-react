/* eslint-disable react/react-in-jsx-scope */
import { createContext, ReactElement, useCallback, useContext, useEffect, useState } from "react";
import { IUser } from "src/types/general";
import Router from "next/router";
import useSWR from "swr";
import Loading from "components/loading";
import { TwatWebSocket } from "../customSocket";
import { ContextWrapperProps } from "src/types/props";

interface UserContextType {
    user: IUser;
    login: (user: IUser) => void;
    logout: () => void;
    socket: TwatWebSocket;
}

const UserContextDefaultValues : UserContextType = {
    user: null,
    login: null,
    logout: null,
    socket: null,
};

const UserContext = createContext<UserContextType>(UserContextDefaultValues);

const protectedRoutes = [
    "/home",
    "/messages/[[...conversationId]]",
    "/settings",
    "/friends",
    "/notifications"
];

const unprotectedRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
];

const fetcher = (url: string) =>
    fetch(url, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
            return { user: data?.user, token: data?.token || null };
        });

export function UserWrapper({ children }: ContextWrapperProps): ReactElement {
    const [user, setUser] = useState<IUser>(null);
    const [socket, setSocket] = useState<TwatWebSocket>(null);
    const [loading, setLoading] = useState(true);
    const [reconnectInterval, setReconnectInterval] = useState<NodeJS.Timeout>(null);

    const { data } = useSWR(
        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/users/validateToken`,
        fetcher
    );
    const _user = data?.user;
    const finished = Boolean(data);
    const hasUser = Boolean(_user);

    const openSocket = useCallback(() => {
        let wsURL = "";
        if (process.env.NODE_ENV == "development") {
            wsURL = `ws://${process.env.NEXT_PUBLIC_DOMAIN}/ws`;
        } else if (process.env.NODE_ENV == "production") {
            wsURL = `wss://${process.env.NEXT_PUBLIC_DOMAIN}/ws`;
        }

        const _socket = new TwatWebSocket(wsURL);

        setSocket(_socket);
    }, []);

    useEffect(() => {
        if (socket) {
            socket.conn.onopen = () => {
                console.log("WebSocket opened");
                if (reconnectInterval) {
                    clearInterval(reconnectInterval);
                }
            };

            socket.conn.onclose = () => {
                console.log("WebSocket closed");
                if (reconnectInterval) {
                    return;
                }
                const interval = setInterval(() => {
                    openSocket();
                }, 5000);

                setReconnectInterval(interval);
            };
        }
    }, [socket, openSocket]);

    useEffect(() => {
        setLoading(true);

        if (!finished) return;

        if (hasUser) {
            if (!socket) {
                openSocket();
            }

            if (unprotectedRoutes.includes(Router.route)) {
                setUser(_user);
                Router.push("/home").then(() => {
                    setLoading(false);
                });
                return;
            }
            setUser(_user);

        } else {
            if (protectedRoutes.includes(Router.route)) {
                Router.push("/login").then(() => {
                    setLoading(false);
                });
                return;
            }
        }
        setLoading(false);
    }, [finished, hasUser, setLoading, _user, openSocket]);

    useEffect(() => {
        if (user && !socket) {
            openSocket();
        }
    }, [openSocket, user]);

    const login = (user: IUser) => {
        setUser(user);
    };

    const logout = () => {
        setUser(null);
        socket.close(1000); // 1000 is normal termination
        setSocket(null);
    };

    return (
        <>
            <UserContext.Provider value={{user, login, logout, socket}}>
                {loading ? (
                    <Loading width="100" height="100" />
                ) : (
                    <>{children}</>
                )}
            </UserContext.Provider>
        </>
    );
}

export function useUserContext(): UserContextType {
    return useContext(UserContext);
}
