export class poster {
    public static site() { return window.location.protocol + "//" + window.location.host; }

    public static postMessageToFrame(frame: Window, eventName: string, data?: any): void {
        if (frame) {
            frame.postMessage({ eventName: eventName, data: data }, poster.site());
        }
    }

    public static postMessageToParent(eventName: string, data?: any): void {
        window.parent.postMessage({ eventName: eventName, data: data }, poster.site());
    }
}
