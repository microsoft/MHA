import { GetHeaders } from "./GetHeaders";
import { diagnostics } from "../../Diag";
import { Errors } from "../../Errors";
import { mhaStrings } from "../../mhaStrings";
import { ParentFrame } from "../../ParentFrame";

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
                    Errors.log(asyncResult.error, "getAllInternetHeadersAsync failed.\nFallback to Rest.\n" + JSON.stringify(asyncResult, null, 2), true);
                    resolve("");
                }
            });
        });
    }

    public static async send(): Promise<string> {
        if (!GetHeaders.validItem() || !Office.context.mailbox.item) {
            Errors.logMessage("No item selected (API)");
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
            Errors.log(e, "Failed in getAllInternetHeadersAsync");
        }

        return "";
    }
}
