/**
 * GetHeaderRest.js
 * 
 * This file has all the methods to get PR_TRANSPORT_MESSAGE_HEADERS
 * from the current message via REST.
 * 
 * To use this file, your page JS needs to implement the following methods:
 * 
 * - updateStatus(message): Should be a method that displays a status to the user,
 *   preferably with some sort of activity indicator (spinner)
 * - hideStatus: Method to hide the status displays
 * - showError(error, message): Method to communicate an error to the user.
 *
 * Requirement Sets and Permissions
 * getCallbackTokenAsync requires 1.5 and ReadItem
 * convertToRestId requires 1.3 and Restricted
 * restUrl requires 1.5 and ReadItem
 */

function sendHeadersRequestRest(headersLoadedCallback) {
    // TODO: Can/should we do a status update from here?
    //updateStatus(ImportedStrings.mha_RequestSent);

    Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
        if (result.status === "succeeded") {
            var accessToken = result.value;
            getHeaders(accessToken, headersLoadedCallback);
        } else {
            showError(null, 'Unable to obtain callback token.\n' + result.error);
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
    var parts = url.split("/");

    return parts[0] + "//" + parts[2];
}

function getRestUrl(accessToken) {
    // Shim function to workaround
    // mailbox.restUrl == null case
    if (Office.context.mailbox.restUrl) {
        return getBaseUrl(Office.context.mailbox.restUrl);
    }

    // parse the token
    var jwt = window.jwt_decode(accessToken);

    // 'aud' parameter from token can be in a couple of
    // different formats.

    // Format 1: It's just the URL
    if (jwt.aud.match(/https:\/\/([^@]*)/)) {
        return jwt.aud;
    }

    // Format 2: GUID/hostname@GUID
    var match = jwt.aud.match(/\/([^@]*)@/);
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

    // Get the item's REST ID
    var itemId = getItemRestId();

    var getMessageUrl = getRestUrl(accessToken) +
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
        if (item.SingleValueExtendedProperties !== undefined) {
            headersLoadedCallback(item.SingleValueExtendedProperties[0].Value);
        } else {
            showError(null, ImportedStrings.mha_headersMissing);
        }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            if (textStatus === "error" && jqXHR.status === 0) {
                sendHeadersRequestEWS(headersLoadedCallback);
            } else {
                showError(null, "textStatus: " + textStatus + '\nerrorThrown: ' + errorThrown + "\nState: " + jqXHR.state() + "\njqXHR: " + JSON.stringify(jqXHR, null, 2));
            }
    });
}