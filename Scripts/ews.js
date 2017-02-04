/// <reference path="Table.js" />
/// <reference path="Strings.js" />
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
        updateStatus(ImportedStrings.mha_ewsRequestSent);
    } catch (e) {
        updateStatus(ImportedStrings.mha_ewsFailed);
        disableSpinner();
    }
}

// This function plug in filters nodes for the one that matches the given name.
// This sidesteps the issues in jquery"s selector logic.
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
            var responseDOM = $(response);

            if (responseDOM) {
                updateStatus(ImportedStrings.mha_lookingForHeaders);

                //// See http://stackoverflow.com/questions/853740/jquery-xml-parsing-with-namespaces
                //// See also http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000
                // We can do this because we know there's only the one property.
                prop = responseDOM.filterNode("t:ExtendedProperty")[0];
            }
        } catch (e) {
        }

        if (prop) {
            updateStatus(ImportedStrings.mha_foundHeaders);

            // Initialize originalHeaders in case we have parsing problems
            viewModel.originalHeaders = prop.textContent;
            $("#originalHeaders").text(viewModel.originalHeaders);

            parseHeadersToTables(viewModel.originalHeaders);
        } else {
            updateStatus(ImportedStrings.mha_failedToFind);
            $("#originalHeaders").text(viewModel.originalHeaders);
        }
    } else if (asyncResult.error) {
        updateStatus(asyncResult.error.message);
    }
}