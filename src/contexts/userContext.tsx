import { createContext, ReactElement, useCallback, useContext, useEffect, useState } from "react";
import { IUser } from "src/types/general";
import useSWR from "swr";
import Loading from "components/loading";
import { TwatWebSocket } from "src/twatWebSocket";

interface ContextWrapperProps {
    children: ReactElement;
}

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

            socket.conn.onclose = (e) => {
                console.log("WebSocket closed");
                // if there's a reconnection interval in progress or the socket was terminated normally, don't reconnect.
                if (reconnectInterval || e.code == 1000) {
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
        if (data) {
            setUser(data.user);
            setLoading(false);
        }
    }, [data]);

    useEffect(() => {
        if (user && !socket) {
            openSocket();
        }
    }, [openSocket, user]);

    const login = (user: IUser) => {
        setUser(user);
    };

    const logout = () => {
        socket.close(1000); // 1000 is normal termination.
        setSocket(null);
        setUser(null);
    };

    if (loading) return <Loading width="100" height="100" />;

    return (
        <UserContext.Provider value={{user, login, logout, socket}}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext(): UserContextType {
    return useContext(UserContext);
}
