import { mhaStrings } from "./mhaStrings";
import { Errors } from "./Errors";
import { ParentFrame } from "./parentFrame";
import { GetHeaders } from "./GetHeaders";
import { GetHeadersRest } from "./GetHeadersRest";
import { diagnostics } from "./diag";

/*
 * GetHeadersAPI.js
 *
 * This file has all the methods to get PR_TRANSPORT_MESSAGE_HEADERS
 * from the current message via getAllInternetHeadersAsync.
 *
 * Requirement Sets and Permissions
 * getAllInternetHeadersAsync requires 1.9 and ReadItem
 */

export class GetHeadersAPI {
    private static minAPISet = "1.9";

    public static canUseAPI(): boolean { return GetHeaders.canUseAPI("API", GetHeadersAPI.minAPISet); }

    public static send(headersLoadedCallback: (_headers: string, apiUsed: string) => void): void {
        if (!GetHeaders.validItem() || !Office.context.mailbox.item) {
            Errors.log(null, "No item selected (API)", true);
            return;
        }

        if (!GetHeadersAPI.canUseAPI()) {
            GetHeadersRest.send(headersLoadedCallback);
            return;
        }

        ParentFrame.updateStatus(mhaStrings.mhaRequestSent);

        try {
            Office.context.mailbox.item.getAllInternetHeadersAsync(function (asyncResult) {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                    headersLoadedCallback(asyncResult.value, "API");
                } else {
                    diagnostics.set("getAllInternetHeadersAsyncFailure", JSON.stringify(asyncResult));
                    Errors.log(asyncResult.error, "Unable to obtain callback token.\nFallback to Rest.\n" + JSON.stringify(asyncResult, null, 2), true);
                    GetHeadersRest.send(headersLoadedCallback);
                }
            });
        }
        catch (e) {
            ParentFrame.showError(e, "Failed in getAllInternetHeadersAsync");
        }
    }
}
