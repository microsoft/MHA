/* exported message*/

var message = (function () {
    "use strict";

    function site() { return window.location.protocol + "//" + window.location.host; }

    function postMessageToFrame(frame, eventName, data) {
        if (frame) {
            frame.postMessage({ eventName: eventName, data: data }, site());
        }
    }

    function postMessageToParent(eventName, data) {
        window.parent.postMessage({ eventName: eventName, data: data }, site());
    }

    return {
        postMessageToParent: postMessageToParent,
        postMessageToFrame: postMessageToFrame,
        site: site
    };
})();