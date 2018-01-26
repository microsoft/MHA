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
 * - showError(message): Method to communicate an error to the user.
 * - getHeadersComplete(headers): Callback to receive headers.
 */

function sendHeadersRequest() {
    updateStatus(ImportedStrings.mha_RequestSent);

    Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
        if (result.status === "succeeded") {
            var accessToken = result.value;
            getHeaders(accessToken);
        } else {
            showError("Unable to obtain callback token.");
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

function getHeaders(accessToken) {
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
            getHeadersComplete(item.SingleValueExtendedProperties[0].Value);
        } else {
            showError(ImportedStrings.mha_headersMissing);
        }
    }).fail(function (error) {
        showError(JSON.stringify(error, null, 2));
    }).always(function () {
        hideStatus();
    });
}

function getDiagnostics() {
    var diagnostics = "";
    try {
        diagnostics += "Requirement set = " + getRequirementSet() + "\n";
        diagnostics += "hostname = " + Office.context.mailbox.diagnostics.hostName + "\n";
        diagnostics += "hostVersion = " + Office.context.mailbox.diagnostics.hostVersion + "\n";
        if (Office.context.mailbox.diagnostics.OWAView) {
            diagnostics += "OWAView = " + Office.context.mailbox.diagnostics.OWAView + "\n";
        }

        diagnostics += "itemType = " + Office.context.mailbox.item.itemType + "\n";

        diagnostics += "contentLanguage = " + Office.context.contentLanguage + "\n";
        diagnostics += "displayLanguage = " + Office.context.displayLanguage + "\n";
        diagnostics += "touchEnabled = " + Office.context.touchEnabled + "\n";
    } catch (e) {
        diagnostics = "Failed to get diagnostics";
    }

    return diagnostics;
}

function getRequirementSet() {
    if (Office.context.requirements && Office.context.requirements.isSetSupported) {
        if (Office.context.requirements.isSetSupported("Mailbox", 1.6)) return "1.6";
        if (Office.context.requirements.isSetSupported("Mailbox", 1.5)) return "1.5";
        if (Office.context.requirements.isSetSupported("Mailbox", 1.4)) return "1.4";
        if (Office.context.requirements.isSetSupported("Mailbox", 1.3)) return "1.3";
        if (Office.context.requirements.isSetSupported("Mailbox", 1.2)) return "1.2";
        if (Office.context.requirements.isSetSupported("Mailbox", 1.1)) return "1.1";
        if (Office.context.requirements.isSetSupported("Mailbox", 1.0)) return "1.0";
    }

    if (Office.context.mailbox.addHandlerAsync) return "1.5?";
    if (Office.context.ui.displayDialogAsync) return "1.4?";
    if (Office.context.mailbox.item.saveAsync) return "1.3?";
    if (Office.context.mailbox.item.setSelectedDataAsync) return "1.2?";
    if (Office.context.mailbox.item.removeAttachmentAsync) return "1.1?";
    return "1.0?";
}