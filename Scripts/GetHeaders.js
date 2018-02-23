/**
 * GetHeaderRest.js
 *
 * Selector for switching between EWS and Rest logic
 */

function sendHeadersRequest() {
    try {
        if (Office.context.requirements.isSetSupported("Mailbox", 1.5)) {
            sendHeadersRequestRest();
        }
        else {
            sendHeadersRequestEWS();
        }
    } catch (e) {
        showError("Could not send header request");
    }
}