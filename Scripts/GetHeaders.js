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

    if (!Office.context.mailbox.item.itemId) {
        ShowError(null, "Item has no itemId", true);
        return;
    }

    if (!sufficientPermission(false)) {
        ShowError(null, "Insufficient permissions to request headers", false);
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

function sufficientPermission(strict) {
    if (!Office.context.mailbox) return false;
    // In strict mode, we must find permissions to conclude we have them
    // In non-strict mode, if we don't find permissions, we assume we might have them
    // Some down level clients (such as we would use EWS on) don't have _initialData$p$0 at all.
    if (!Office.context.mailbox._initialData$p$0) return !strict;
    if (Office.context.mailbox._initialData$p$0._permissionLevel$p$0 < 1) return false;
    return true;
}

function canUseRest() {
    if (!Office.context.requirements.isSetSupported("Mailbox", 1.5)) return false;
    if (!sufficientPermission(true)) return false;
    if (!Office.context.mailbox.getCallbackTokenAsync) return false;
    return true;
}