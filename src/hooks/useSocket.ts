import axios from "axios";
import io from "socket.io-client";

export let socket: SocketIOClient.Socket = null;
const connectSocket = (token: string): void => {
    socket = io.connect(process.env.NEXT_PUBLIC_DOMAIN_URL, {
        query: {token},
    });
};

export function useSocket(): void {
    if (!socket || socket.disconnected) {
        console.log("socket is disconnected, so we attempt connection");
        axios.get(`${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/validateToken`)
            .then((res) => {
                connectSocket(res.data.token);
                console.log(socket);
            })
            .catch((err) => {
                if (err.response.data.status != 401) {
                    console.error(err);
                    console.error("An error has occurred while connecting socket");
                }
            });
    } else if (socket.connected) {
        console.log("socket already connected");
    }
}
