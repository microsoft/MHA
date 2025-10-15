/* global $ */
import { ImportedStrings } from "../../Strings";
import { LogError, ShowError, UpdateStatus } from "../uiToggle";
import { sendHeadersRequestEWS } from "./GetHeadersEWSOld";
import { validItem } from "./GetHeadersOld";

/**
 * GetHeaderRest.js
 *
 * This file has all the methods to get PR_TRANSPORT_MESSAGE_HEADERS
 * from the current message via REST.
 *
 * Requirement Sets and Permissions
 * getCallbackTokenAsync requires 1.5 and ReadItem
 * convertToRestId requires 1.3 and Restricted
 * restUrl requires 1.5 and ReadItem
 */

export function sendHeadersRequestRest(headersLoadedCallback) {
    if (!validItem()) {
        LogError(null, "No item selected (REST)", true);
        return;
    }

    UpdateStatus(ImportedStrings.mha_RequestSent);

    Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
        try {
            if (result.status === "succeeded") {
                const accessToken = result.value;
                getHeaders(accessToken, headersLoadedCallback);
            } else {
                LogError(null, "Unable to obtain callback token.\nFallback to EWS.\n" + JSON.stringify(result, null, 2), true);
                sendHeadersRequestEWS(headersLoadedCallback);
            }
        }
        catch (e) {
            ShowError(e, "Failed in getCallbackTokenAsync");
        }
    });
}

function getItemRestId() {
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

function getBaseUrl(url) {
    const parts = url.split("/");

    return parts[0] + "//" + parts[2];
}

function getRestUrl(accessToken) {
    // Shim function to workaround
    // mailbox.restUrl == null case
    if (Office.context.mailbox.restUrl) {
        return getBaseUrl(Office.context.mailbox.restUrl);
    }

    // parse the token
    const jwt = window.jwt_decode(accessToken);

    // 'aud' parameter from token can be in a couple of
    // different formats.

    // Format 1: It's just the URL
    if (jwt.aud.match(/https:\/\/([^@]*)/)) {
        return jwt.aud;
    }

    // Format 2: GUID/hostname@GUID
    const match = jwt.aud.match(/\/([^@]*)@/);
    if (match && match[1]) {
        return "https://" + match[1];
    }

    // Couldn't find what we expected, default to
    // outlook.office.com
    return "https://outlook.office.com";
}

function getHeaders(accessToken, headersLoadedCallback) {
    if (!accessToken) {
        LogError(null, "No access token?");
    }

    if (!Office.context.mailbox.item.itemId) {
        LogError(null, "No itemId?");
    }

    // Get the item's REST ID
    const itemId = getItemRestId();

    const getMessageUrl = getRestUrl(accessToken) +
        "/api/v2.0/me/messages/" +
        itemId +
        // PR_TRANSPORT_MESSAGE_HEADERS
        "?$select=SingleValueExtendedProperties&$expand=SingleValueExtendedProperties($filter=PropertyId eq 'String 0x007D')";

    $.ajax({
        url: getMessageUrl,
        dataType: "json",
        headers: {
            "Authorization": "Bearer " + accessToken,
            "Accept": "application/json; odata.metadata=none"
        }
    }).done(function (item) {
        try {
            if (item.SingleValueExtendedProperties !== undefined) {
                headersLoadedCallback(item.SingleValueExtendedProperties[0].Value, "REST");
            } else {
                headersLoadedCallback(null, "REST");
                ShowError(null, ImportedStrings.mha_headersMissing, true);
            }
        }
        catch (e) {
            ShowError(e, "Failed parsing headers");
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        try {
            if (textStatus === "error" && jqXHR.status === 0) {
                // Log this, but don't error for the user
                sendHeadersRequestEWS(headersLoadedCallback);
            } else if (textStatus === "error" && jqXHR.status === 404) {
                ShowError(null, ImportedStrings.mha_messageMissing, true);
            } else {
                ShowError(null, "textStatus: " + textStatus + "\nerrorThrown: " + errorThrown + "\nState: " + jqXHR.state() + "\njqXHR: " + JSON.stringify(jqXHR, null, 2));
            }
        }
        catch (e) {
            ShowError(e, "Failed handling REST failure case");
        }
    });
}