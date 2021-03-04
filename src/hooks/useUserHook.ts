import { useEffect } from "react";
import Router from "next/router";
import useSWR from "swr";
import { socket, connectSocket } from "../contexts/socket";

const fetcher = (url: string) =>
    fetch(url, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
            return { user: data?.user, token: data?.token || null };
        });

export function useUser(redirectTo?: string, redirectIfFound?: boolean): any {
    const { data, error } = useSWR(
        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/validateToken`,
        fetcher
    );
    const user = data?.user;
    const finished = Boolean(data);
    const hasUser = Boolean(user);

    useEffect(() => {
        if (!redirectTo || !finished) return;
        if (hasUser && !socket) {
            user.token = data?.token;
            connectSocket(data?.token);
        }
        if (
            // If redirectTo is set, redirect if the user was not found.
            (redirectTo && !redirectIfFound && !hasUser) ||
            // If redirectIfFound is also set, redirect if the user was found
            (redirectIfFound && hasUser)
        ) {
            Router.push(redirectTo);
        }
    }, [redirectTo, redirectIfFound, finished, hasUser]);
    return error ? null : user;
}
