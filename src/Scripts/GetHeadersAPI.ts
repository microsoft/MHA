import { diagnostics } from "./Diag";
import { Errors } from "./Errors";
import { GetHeaders } from "./GetHeaders";
import { mhaStrings } from "./mhaStrings";
import { ParentFrame } from "./ParentFrame";

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

    private static async getAllInternetHeaders(item: Office.MessageRead): Promise<string> {
        return new Promise((resolve) => {
            item.getAllInternetHeadersAsync((asyncResult) => {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                    resolve(asyncResult.value);
                } else {
                    diagnostics.set("getAllInternetHeadersAsyncFailure", JSON.stringify(asyncResult));
                    Errors.log(asyncResult.error, "Unable to obtain callback token.\nFallback to Rest.\n" + JSON.stringify(asyncResult, null, 2), true);
                }
            });
        });
    }

    public static async send(): Promise<string> {
        if (!GetHeaders.validItem() || !Office.context.mailbox.item) {
            Errors.log(null, "No item selected (API)", true);
            return "";
        }

        if (!GetHeadersAPI.canUseAPI()) {
            return "";
        }

        ParentFrame.updateStatus(mhaStrings.mhaRequestSent);

        try {
            const headers = await GetHeadersAPI.getAllInternetHeaders(Office.context.mailbox.item);
            return headers;
        }
        catch (e) {
            ParentFrame.showError(e, "Failed in getAllInternetHeadersAsync");
        }

        return "";
    }
}
