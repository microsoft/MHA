export const message = (function () {
    "use strict";

    function site() { return window.location.protocol + "//" + window.location.host; }

    function postMessageToFrame(frame, eventName: string, data?: object) {
        if (frame) {
            frame.postMessage({ eventName: eventName, data: data }, site());
        }
    }

    function postMessageToParent(eventName: string, data?: object) {
        window.parent.postMessage({ eventName: eventName, data: data }, site());
    }

    return {
        postMessageToParent: postMessageToParent,
        postMessageToFrame: postMessageToFrame,
        site: site
    };
})();