export const handleSocketEvent = (socket: WebSocket, event: string, callback: (data: any) => void): void => {
    socket.onmessage = (evt) => {
        const data = JSON.parse(evt.data);
        switch (data.eventType) {
        case event:
            callback(data.data);
            break;
        }
    };
};
