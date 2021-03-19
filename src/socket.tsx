/* eslint-disable react/react-in-jsx-scope */
import io from "socket.io-client";

export let socket: SocketIOClient.Socket = null;
export const connectSocket = (token: string): void => {
    socket = io.connect(process.env.NEXT_PUBLIC_DOMAIN_URL, {
        query: {token},
    });
};
