function onMessageReceived(event: MessageEvent<any>) {
    const data = JSON.parse(event.data);
    const that: TwatWebSocket = this as TwatWebSocket;
    that.dispatch(data.eventType, data.data);
}

interface ICallback {
    [event: string]: Array<(data: any) => void>;
}

export class TwatWebSocket {
    conn: WebSocket;
    callbacks: ICallback = {};

    constructor(url: string) {
        this.conn = new WebSocket(url);
        this.conn.onopen = function () {
            console.log("WebSocket opened");
        };
        this.conn.onclose = function () {
            console.log("WebSocket closed");
        };
    }

    on(event: string, callback: (data: any) => void): void {
        this.callbacks[event] = this.callbacks[event] || [];
        if (
            !this.callbacks[event].some((_callback) => {
                return _callback === callback;
            })
        ) {
            this.callbacks[event].push(callback);
            this.conn.onmessage = onMessageReceived.bind(this);
        }
    }

    off(event: string, callback: (data: any) => void): void {
        this.callbacks[event] = this.callbacks[event].filter((_callback) => {
            return _callback !== callback;
        });
        // TODO: unregister the event listener
    }

    dispatch(event_name: string, data: any): void {
        // get all the registered callbacks for this event and call them
        const events = this.callbacks[event_name];
        events?.forEach((event) => {
            event(data);
        });
    }

    send(data: string): void {
        this.conn.send(data);
    }

    close(code: number): void {
        this.conn.close(code);
    }
}
