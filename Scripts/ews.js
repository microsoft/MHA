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
        sendHeadersRequestREST();
        //sendHeadersRequest();
    });
};

function getSoapEnvelope(request) {
    // Wrap an Exchange Web Services request in a SOAP envelope.
    var result =
    "<?xml version='1.0' encoding='utf-8'?>" +
    "<soap:Envelope xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'" +
    "               xmlns:t='http://schemas.microsoft.com/exchange/services/2006/types'>" +
    "  <soap:Header>" +
    "     <t:RequestServerVersion Version='Exchange2013'/>" +
    "  </soap:Header>" +
    "  <soap:Body>" +
    request +
    "  </soap:Body>" +
    "</soap:Envelope>";

    return result;
}

function getHeadersRequest(id) {
    // Return a GetItem EWS operation request for the headers of the specified item.
    var result =
    "    <GetItem xmlns='http://schemas.microsoft.com/exchange/services/2006/messages'>" +
    "      <ItemShape>" +
    "        <t:BaseShape>IdOnly</t:BaseShape>" +
    "        <t:BodyType>Text</t:BodyType>" +
    "        <t:AdditionalProperties>" +
    // PR_TRANSPORT_MESSAGE_HEADERS
    "            <t:ExtendedFieldURI PropertyTag='0x007D' PropertyType='String' />" +
    "        </t:AdditionalProperties>" +
    "      </ItemShape>" +
    "      <ItemIds><t:ItemId Id='" + id + "'/></ItemIds>" +
    "    </GetItem>";

    return result;
}

function enableSpinner() {
    $("#response").css("background-image", "url(../Resources/loader.gif)");
    $("#response").css("background-repeat", "no-repeat");
    $("#response").css("background-position", "center");
}

function disableSpinner() {
    $("#response").css("background", "none");
}

function sendHeadersRequest() {
    enableSpinner();

    var mailbox = Office.context.mailbox;
    var request = getHeadersRequest(mailbox.item.itemId);
    var envelope = getSoapEnvelope(request);

    try {
        mailbox.makeEwsRequestAsync(envelope, callback);
        updateStatus(ImportedStrings.mha_RequestSent);
    } catch (e) {
        updateStatus(ImportedStrings.mha_ewsFailed);
        disableSpinner();
    }
}

// This function plug in filters nodes for the one that matches the given name.
// This sidesteps the issues in jquery's selector logic.
(function ($) {
    $.fn.filterNode = function (node) {
        return this.find("*").filter(function () {
            return this.nodeName === node;
        });
    };
})(jQuery);

// Function called when the EWS request is complete.
function callback(asyncResult) {
    updateStatus(ImportedStrings.mha_ewsResponseReceived);
    disableSpinner();

    // Process the returned response here.
    if (asyncResult.value) {
        viewModel.originalHeaders = asyncResult.value;
        var prop = null;
        try {
            var response = $.parseXML(asyncResult.value);
            var responseDom = $(response);

            if (responseDom) {
                updateStatus(ImportedStrings.mha_lookingForHeaders);

                //// See http://stackoverflow.com/questions/853740/jquery-xml-parsing-with-namespaces
                //// See also http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000
                // We can do this because we know there's only the one property.
                prop = responseDom.filterNode("t:ExtendedProperty")[0];
            }
        } catch (e) {
        }

        if (prop) {
            processHeaders(prop.textContent);
        } else {
            updateStatus(ImportedStrings.mha_failedToFind);
            $("#originalHeaders").text(viewModel.originalHeaders);
        }
    } else if (asyncResult.error) {
        updateStatus(asyncResult.error.message);
    }
}

function processHeaders(headers) {
    updateStatus(ImportedStrings.mha_foundHeaders);
    parseHeadersToTables(headers);
}

function sendHeadersRequestREST() {
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

function getHeaders(accessToken) {
    // Get the item's REST ID
    var itemId = getItemRestId();

    // Office.context.mailbox.restUrl appears to always be null, so we hard code our url
    var getMessageUrl = 'https://outlook.office.com' +
        "/api/v2.0/me/messages/" +
        itemId +
        // PR_TRANSPORT_MESSAGE_HEADERS
        "?select=SingleValueExtendedProperties&$expand=SingleValueExtendedProperties($filter=PropertyId eq 'String 0x007D')";

    $.ajax({
        url: getMessageUrl,
        dataType: "json",
        headers: { "Authorization": "Bearer " + accessToken }
    }).done(function (item) {
        processHeaders(item.SingleValueExtendedProperties[0].Value);
    }).fail(function (error) {
        updateStatus(getMessageUrl + "::" + JSON.stringify(error, null, 2));
    }).always(function () {
        disableSpinner();
    });
}