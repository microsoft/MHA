/* global Office */
/* global sendHeadersRequestEWS */
/* global sendHeadersRequestRest */
/* global ShowError */
/* exported sendHeadersRequest */

/**
 * GetHeaderRest.js
 *
 * Selector for switching between EWS and Rest logic
 */

function sendHeadersRequest(headersLoadedCallback) {
    if (!Office.context.mailbox || !Office.context.mailbox.item) {
        ShowError(null, "No item selected", true);
        return;
    }

    try {
        if (canUseRest()) {
            sendHeadersRequestRest(headersLoadedCallback);
        }
        else {
            sendHeadersRequestEWS(headersLoadedCallback);
        }
    } catch (e) {
        ShowError(e, "Could not send header request");
    }
}

function canUseRest() {
    if (!Office.context.requirements.isSetSupported("Mailbox", 1.5)) return false;
    if (Office.context.mailbox._initialData$p$0._permissionLevel$p$0 < 1) return false;
    if (!Office.context.mailbox.getCallbackTokenAsync) return false;
    return true;
}