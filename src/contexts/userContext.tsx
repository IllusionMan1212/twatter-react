/* eslint-disable react/react-in-jsx-scope */
import { createContext, ReactElement, useCallback, useContext, useEffect, useState } from "react";
import { IUser } from "src/types/general";
import Router from "next/router";
import useSWR from "swr";
import Loading from "components/loading";
import { TwatWebSocket } from "../customSocket";

interface UserContextType {
    user: IUser;
    login: (user: IUser) => void;
    logout: () => void;
    socket: TwatWebSocket;
}

const UserContextDefaultValues : UserContextType = {
    user: null,
    login: () => {return;},
    logout: () => {return;},
    socket: null,
};

const UserContext = createContext<UserContextType>(UserContextDefaultValues);

const protectedRoutes = [
    "/home",
    "/messages",
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

export function UserWrapper({ children }: any): ReactElement {
    const [user, setUser] = useState<IUser>(null);
    const [socket, setSocket] = useState<TwatWebSocket>(null);
    const [loading, setLoading] = useState(true);

    const { data } = useSWR(
        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/validateToken`,
        fetcher
    );
    const _user = data?.user;
    const finished = Boolean(data);
    const hasUser = Boolean(_user);

    const openSocket = useCallback(() => {
        const _socket = new TwatWebSocket(`ws://${process.env.NEXT_PUBLIC_DOMAIN}/ws`);

        setSocket(_socket);
    }, []);

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
