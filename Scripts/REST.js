/// <reference path="Table.js" />
/// <reference path="Strings.js" />
/// <reference path="~/Scripts/Headers.js" />
/// <reference path="~/Scripts/siteTypesOffice.js" />
// This function is run when the app is ready to start interacting with the host application.
// It ensures the DOM is ready before updating the span elements with values from the current message.
Office.initialize = function () {
    $(document).ready(function () {
        $(window).resize(onResize);
        initViewModels();
        updateStatus(ImportedStrings.mha_loading);
        sendHeadersRequest();
    });
};

function enableSpinner() {
    $("#response").css("background-image", "url(../Resources/loader.gif)");
    $("#response").css("background-repeat", "no-repeat");
    $("#response").css("background-position", "center");
}

function disableSpinner() {
    $("#response").css("background", "none");
}

function processHeaders(headers) {
    updateStatus(ImportedStrings.mha_foundHeaders);
    $("#originalHeaders").text(headers);
    parseHeadersToTables(headers);
}

function sendHeadersRequest() {
    updateStatus(ImportedStrings.mha_RequestSent);
    enableSpinner();
    Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
        if (result.status === "succeeded") {
            var accessToken = result.value;
            getHeaders(accessToken);
        } else {
            disableSpinner();
            updateStatus("Unable to obtain callback token.");
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

function displayError(error) {
    disableSpinner();
    updateStatus(ImportedStrings.mha_failedToFind);
    viewModel.originalHeaders = error;
    rebuildSections();
}

function getRestUrl(accessToken) {
    // Shim function to workaround
    // mailbox.restUrl == null case
    if (Office.context.mailbox.restUrl) {
        return Office.context.mailbox.restUrl;
    }

    // parse the token
    var jwt = jwt_decode(accessToken);

    // 'aud' parameter from token can be in a couple
    // of different formats.

    // Format 1: It's just the URL
    if (jwt.aud.match(/https:\/\/([^@]*)/)) {
        return jwt.aud;
    }

    // Format 2: GUID/hostname@GUID
    var match = jwt.aud.match(/\/([^@]*)@/);
    if (match && match[1]) {
        return 'https://' + match[1];
    }

    // Couldn't find what we expected, default to
    // outlook.office.com
    return 'https://outlook.office.com';
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
                }).done(function(item) {
        processHeaders(item.SingleValueExtendedProperties[0].Value);
                }).fail(function(error) {
        displayError(JSON.stringify(error, null, 2));
                }).always(function() {
        disableSpinner();
                });
                }