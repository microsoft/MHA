import { jwtDecode } from "jwt-decode";

import { GetHeaders } from "./GetHeaders";
import { diagnostics } from "../../Diag";
import { Errors } from "../../Errors";
import { mhaStrings } from "../../mhaStrings";
import { ParentFrame } from "../../ParentFrame";
import { getAccessToken } from "../msal/authHelper";

/*
 * GetHeadersRest.js
 *
 * This file has all the methods to get PR_TRANSPORT_MESSAGE_HEADERS
 * from the current message via REST.
 *
 * Requirement Sets and Permissions
 * getCallbackTokenAsync requires 1.5 and ReadItem
 * convertToRestId requires 1.3 and Restricted
 * restUrl requires 1.5 and ReadItem
 */

export class GetHeadersRest {
    private static minRestSet = "1.5";

    public static canUseRest(): boolean { return GetHeaders.canUseAPI("Rest", GetHeadersRest.minRestSet); }

    private static getItemRestId(): string {
        if (!Office.context.mailbox.item) return "";
        // Currently the only Outlook Mobile version that supports add-ins
        // is Outlook for iOS.
        if (Office.context.mailbox.diagnostics.hostName === "OutlookIOS") {
            // itemId is already REST-formatted
            return Office.context.mailbox.item.itemId;
        } else {
            // Convert to an item ID for API v2.0
            return Office.context.mailbox.convertToRestId(
                Office.context.mailbox.item.itemId,
                Office.MailboxEnums.RestVersion.v2_0
            );
        }
    }

    private static getBaseUrl(url: string): string {
        const parts = url.split("/");

        return parts[0] + "//" + parts[2];
    }

    private static getRestUrl(accessToken: string): string {
        // Shim function to workaround
        // mailbox.restUrl == null case
        if (Office.context.mailbox.restUrl) {
            return GetHeadersRest.getBaseUrl(Office.context.mailbox.restUrl);
        }

        // parse the token
        const jwt = jwtDecode(accessToken);

        // 'aud' parameter from token can be in a couple of
        // different formats.
        const aud = Array.isArray(jwt.aud) ? jwt.aud[0] : jwt.aud;

        if (aud) {
            // Format 1: It's just the URL
            if (aud.match(/https:\/\/([^@]*)/)) {
                return aud;
            }

            // Format 2: GUID/hostname@GUID
            const match = aud.match(/\/([^@]*)@/);
            if (match && match[1]) {
                return "https://" + match[1];
            }
        }

        // Couldn't find what we expected, default to
        // outlook.office.com
        return "https://outlook.office.com";
    }

    private static async getHeaders(accessToken: string): Promise<string> {
        if (!accessToken || accessToken === "") {
            Errors.logMessage("No access token?");
            return "";
        }

        if (!Office.context.mailbox.item) {
            Errors.logMessage("No item");
            return "";
        }

        if (!Office.context.mailbox.item.itemId) {
            Errors.logMessage("No itemId");
            return "";
        }

        // Get the item's REST ID
        const itemId = GetHeadersRest.getItemRestId();

        const getMessageUrl = GetHeadersRest.getRestUrl(accessToken) +
            "/api/v2.0/me/messages/" +
            itemId +
            // PR_TRANSPORT_MESSAGE_HEADERS
            "?$select=SingleValueExtendedProperties&$expand=SingleValueExtendedProperties($filter=PropertyId eq 'String 0x007D')";

        try{
            const response = await fetch(getMessageUrl, {
                headers: {
                    "Authorization": "Bearer " + accessToken, //eslint-disable-line @typescript-eslint/naming-convention
                    "Accept": "application/json; odata.metadata=none" //eslint-disable-line @typescript-eslint/naming-convention
                }
            });

            if (!response.ok) {
                diagnostics.set("getHeadersFailure", JSON.stringify(response));
                if (response.status === 0) {
                    // Fallback to EWS now
                } else if (response.status === 404) {
                    ParentFrame.showError(null, mhaStrings.mhaMessageMissing, true);
                }

                return "";
            }

            const item = await response.json();

            if (item.SingleValueExtendedProperties !== undefined) {
                return item.SingleValueExtendedProperties[0].Value;
            } else {
                ParentFrame.showError(null, mhaStrings.mhaHeadersMissing, true);
                return "";
            }
        }
        catch (e) {
            ParentFrame.showError(e, "Failed parsing headers");
        }

        return "";
    }

    private static async getCallbackToken(): Promise<string> {
        return new Promise((resolve) => {
            Office.context.mailbox.getCallbackTokenAsync((result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    resolve(result.value);
                } else {
                    diagnostics.set("callbackTokenFailure", JSON.stringify(result));
                    Errors.log(result.error, "Unable to obtain callback token.\nFallback to EWS.\n" + JSON.stringify(result, null, 2), true);
                    resolve("");
                }
            });
        });
    }

    public static async send(): Promise<string> {
        if (!GetHeaders.validItem()) {
            Errors.logMessage("No item selected (REST)");
            return "";
        }

        if (!GetHeadersRest.canUseRest()) {
            return "";
        }

        ParentFrame.updateStatus(mhaStrings.mhaRequestSent);

        try {
            const accessToken =  await getAccessToken(["Mail.Read"]);
            const headers = await GetHeadersRest.getHeaders(accessToken);

            return headers;
        }
        catch (e) {
            ParentFrame.showError(e, "Failed using NAA");
        }

        try {
            const accessToken= await GetHeadersRest.getCallbackToken();
            const headers = await GetHeadersRest.getHeaders(accessToken);

            return headers;
        }
        catch (e) {
            ParentFrame.showError(e, "Failed using getCallbackTokenAsync");
        }

        return "";
    }
}
