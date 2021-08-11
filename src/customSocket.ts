function onMessageReceived(event: any) {
    const data = JSON.parse(event.data);
    const that : TwatWebSocket = (this as TwatWebSocket);
    that.dispatch(data.eventType, data.data);
}

interface ICallback {
    [event: string]: Array<(data: any) => void>;
}

export class TwatWebSocket {
    conn: WebSocket;
    callbacks : ICallback = {};

    constructor(url: string) {
        this.conn = new WebSocket(url);
        this.conn.onopen = function () {
            console.log("WebSocket opened");
        };
        this.conn.onclose = function () {
            console.log("WebSocket closed");
        };
    }

    on(event: string, callback: (data: any) => void) {
        this.callbacks[event] = this.callbacks[event] || [];
        if (!this.callbacks[event].find((_callback) => {
            return _callback !== callback;
        })) {
            this.callbacks[event].push(callback);
            this.conn.onmessage = onMessageReceived.bind(this);
        }
    }

    off(event: string, callback: (data: any) => void) {
        this.callbacks[event] = this.callbacks[event].filter((_callback) => {
            return _callback !== callback;
        });
        // TODO: unregister the event listener
    }

    dispatch(event_name: string, data: string) {
        // get all the registered callbacks for this event and call them
        const events = this.callbacks[event_name];
        events.forEach((event) => {
            event(data);
        })
    }

    send(data: string) {
        this.conn.send(data);
    }

    close(code: number) {
        this.conn.close(code);
    }
}
