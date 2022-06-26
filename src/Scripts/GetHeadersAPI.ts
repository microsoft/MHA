import { mhaStrings } from "./mhaStrings";
import { Errors } from "./Errors";
import { ParentFrame } from "./parentFrame";
import { GetHeaders } from "./GetHeaders";
import { GetHeadersRest } from "./GetHeadersRest";
import { Diagnostics } from "./diag";

/*
 * GetHeadersAPI.js
 *
 * This file has all the methods to get PR_TRANSPORT_MESSAGE_HEADERS
 * from the current message via getAllInternetHeadersAsync.
 *
 * Requirement Sets and Permissions
 * getAllInternetHeadersAsync requires 1.9 and ReadItem
 */

export const GetHeadersAPI = (function () {
    //const minAPISet: string = "1.9";

    //function canUseAPI(): boolean { return GetHeaders.canUseAPI("API", minAPISet); }
    function canUseAPI(): boolean { return false; }

    function send(headersLoadedCallback: Function): void {
        if (!GetHeaders.validItem()) {
            Errors.log(null, "No item selected (API)", true);
            return;
        }

        if (!canUseAPI()) {
            GetHeadersRest.send(headersLoadedCallback);
            return;
        }

        ParentFrame.updateStatus(mhaStrings.mhaRequestSent);

        try {
            Office.context.mailbox.item.getAllInternetHeadersAsync(function (asyncResult) {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                    headersLoadedCallback(asyncResult.value, "API");
                } else {
                    Diagnostics.set("getAllInternetHeadersAsyncFailure", JSON.stringify(asyncResult));
                    Errors.log(asyncResult.error, 'Unable to obtain callback token.\nFallback to Rest.\n' + JSON.stringify(asyncResult, null, 2), true);
                    GetHeadersRest.send(headersLoadedCallback);
                }
            });
        }
        catch (e) {
            ParentFrame.showError(e, "Failed in getAllInternetHeadersAsync");
        }
    }

    return {
        send: send,
        canUseAPI: canUseAPI
    };
})();
