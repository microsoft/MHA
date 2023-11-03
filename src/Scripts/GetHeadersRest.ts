import * as $ from "jquery";
import { mhaStrings } from "./mhaStrings";
import { Errors } from "./Errors";
import { ParentFrame } from "./parentFrame";
import { GetHeaders } from "./GetHeaders";
import { GetHeadersEWS } from "./GetHeadersEWS";
import { Diagnostics } from "./diag";
import { jwtDecode } from "jwt-decode";

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
    private static minRestSet: string = "1.5";

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

    private static getHeaders(accessToken: string, headersLoadedCallback: (_headers: string, apiUsed: string) => void): void {
        if (!accessToken) {
            Errors.log(null, "No access token?");
            return;
        }

        if (!Office.context.mailbox.item) {
            Errors.log(null, "No item");
            return;
        }

        if (!Office.context.mailbox.item.itemId) {
            Errors.log(null, "No itemId");
            return;
        }

        // Get the item's REST ID
        const itemId = GetHeadersRest.getItemRestId();

        const getMessageUrl = GetHeadersRest.getRestUrl(accessToken) +
            "/api/v2.0/me/messages/" +
            itemId +
            // PR_TRANSPORT_MESSAGE_HEADERS
            "?$select=SingleValueExtendedProperties&$expand=SingleValueExtendedProperties($filter=PropertyId eq 'String 0x007D')";

        $.ajax({
            url: getMessageUrl,
            dataType: "json",
            headers: {
                "Authorization": "Bearer" + accessToken,
                "Accept": "application/json; odata.metadata=none"
            }
        }).done(function (item) {
            try {
                if (item.SingleValueExtendedProperties !== undefined) {
                    headersLoadedCallback(item.SingleValueExtendedProperties[0].Value, "REST");
                } else {
                    headersLoadedCallback("", "REST");
                    ParentFrame.showError(null, mhaStrings.mhaHeadersMissing, true);
                }
            }
            catch (e) {
                ParentFrame.showError(e, "Failed parsing headers");
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            try {
                Diagnostics.set("jqXHR", JSON.stringify(jqXHR));
                Diagnostics.set("textStatus", JSON.stringify(textStatus));
                Diagnostics.set("resterror", JSON.stringify(errorThrown));
                if (textStatus === "error" && jqXHR.status === 0) {
                    GetHeadersEWS.send(headersLoadedCallback);
                } else if (textStatus === "error" && jqXHR.status === 404) {
                    ParentFrame.showError(null, mhaStrings.mhaMessageMissing, true);
                } else {
                    ParentFrame.showError(null, "textStatus: " + textStatus + "\nerrorThrown: " + errorThrown + "\nState: " + jqXHR.state() + "\njqXHR: " + JSON.stringify(jqXHR, null, 2));
                }
            }
            catch (e) {
                ParentFrame.showError(e, "Failed handling REST failure case");
            }
        });
    }

    public static send(headersLoadedCallback: (_headers: string, apiUsed: string) => void) {
        if (!GetHeaders.validItem()) {
            Errors.log(null, "No item selected (REST)", true);
            return;
        }

        if (!GetHeadersRest.canUseRest()) {
            GetHeadersEWS.send(headersLoadedCallback);
            return;
        }

        ParentFrame.updateStatus(mhaStrings.mhaRequestSent);

        Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
            try {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    const accessToken: string = result.value;
                    GetHeadersRest.getHeaders(accessToken, headersLoadedCallback);
                } else {
                    Diagnostics.set("callbackTokenFailure", JSON.stringify(result));
                    Errors.log(result.error, "Unable to obtain callback token.\nFallback to EWS.\n" + JSON.stringify(result, null, 2), true);
                    GetHeadersEWS.send(headersLoadedCallback);
                }
            }
            catch (e) {
                ParentFrame.showError(e, "Failed in getCallbackTokenAsync");
            }
        });
    }
}
