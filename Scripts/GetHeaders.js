/**
 * GetHeaderRest.js
 *
 * Selector for switching between EWS and Rest logic
 */

function sendHeadersRequest(headersLoadedCallback) {
    try {
        if (Office.context.requirements.isSetSupported("Mailbox", 1.5)) {
            sendHeadersRequestRest(headersLoadedCallback);
        }
        else {
            sendHeadersRequestEWS(headersLoadedCallback);
        }
    } catch (e) {
        // TODO: showError from outer frame to inner
        LogError(e, "Could not send header request");
    }
}