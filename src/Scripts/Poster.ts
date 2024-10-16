export class Poster {
    public static site() { return window.location.protocol + "//" + window.location.host; }

    public static postMessageToFrame(frame: Window, eventName: string, data?: unknown): void {
        if (frame) {
            frame.postMessage({ eventName: eventName, data: data }, Poster.site());
        }
    }

    public static postMessageToParent(eventName: string, data?: unknown): void {
        window.parent.postMessage({ eventName: eventName, data: data }, Poster.site());
    }
}
