/* global $ */
/* global ImportedStrings */
/* global jQuery */
/* global Office */
/* global ShowError */
/* global UpdateStatus */
/* global viewModel */
/* exported sendHeadersRequestEWS */

/**
 * GetHeaderEWS.js
 *
 * This file has all the methods to get PR_TRANSPORT_MESSAGE_HEADERS
 * from the current message via EWS.
 *
 * Requirement Sets and Permissions
 * makeEwsRequestAsync requires 1.0 and ReadWriteMailbox
 */

function sendHeadersRequestEWS(headersLoadedCallback) {
    try {
        UpdateStatus(ImportedStrings.mha_RequestSent);
        var mailbox = Office.context.mailbox;
        var request = getHeadersRequest(mailbox.item.itemId);
        var envelope = getSoapEnvelope(request);
        mailbox.makeEwsRequestAsync(envelope, function (asyncResult) {
            callbackEWS(asyncResult, headersLoadedCallback);
        });
    } catch (e) {
        ShowError(e, ImportedStrings.mha_requestFailed);
    }
}

// Function called when the EWS request is complete.
function callbackEWS(asyncResult, headersLoadedCallback) {
    try {
        // Process the returned response here.
        var prop = null;
        if (asyncResult.value) {
            viewModel.originalHeaders = asyncResult.value;
            var response = $.parseXML(asyncResult.value);
            var responseDom = $(response);

            if (responseDom) {
                // See http://stackoverflow.com/questions/853740/jquery-xml-parsing-with-namespaces
                // See also http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000
                // We can do this because we know there's only the one property.
                var extendedProperty = responseDom.filterNode("t:ExtendedProperty");
                if (extendedProperty.length > 0) {
                    prop = extendedProperty[0];
                }

                // We might not have a prop and also no error. This is OK if the prop is just missing.
                if (!prop) {
                    var ResponseCode = responseDom.filterNode("m:ResponseCode");
                    if (ResponseCode.length > 0 && ResponseCode[0].firstChild && ResponseCode[0].firstChild.data === "NoError") {
                        ShowError(null, ImportedStrings.mha_headersMissing, true);
                        return;
                    }
                }
            }
        }

        if (prop) {
            headersLoadedCallback(prop.textContent, "EWS");
        }
        else {
            throw new Error(ImportedStrings.mha_requestFailed);
        }
    }
    catch (e) {
        ShowError(e, "EWS callback failed\n" + JSON.stringify(asyncResult, null, 2));
    }
}

function getSoapEnvelope(request) {
    // Wrap an Exchange Web Services request in a SOAP envelope.
    return "<?xml version='1.0' encoding='utf-8'?>" +
        "<soap:Envelope xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'" +
        "               xmlns:t='http://schemas.microsoft.com/exchange/services/2006/types'>" +
        "  <soap:Header>" +
        "     <t:RequestServerVersion Version='Exchange2013'/>" +
        "  </soap:Header>" +
        "  <soap:Body>" +
        request +
        "  </soap:Body>" +
        "</soap:Envelope>";
}

function getHeadersRequest(id) {
    // Return a GetItem EWS operation request for the headers of the specified item.
    return "<GetItem xmlns='http://schemas.microsoft.com/exchange/services/2006/messages'>" +
        "  <ItemShape>" +
        "    <t:BaseShape>IdOnly</t:BaseShape>" +
        "    <t:BodyType>Text</t:BodyType>" +
        "    <t:AdditionalProperties>" +
        // PR_TRANSPORT_MESSAGE_HEADERS
        "      <t:ExtendedFieldURI PropertyTag='0x007D' PropertyType='String' />" +
        "    </t:AdditionalProperties>" +
        "  </ItemShape>" +
        "  <ItemIds><t:ItemId Id='" + id + "'/></ItemIds>" +
        "</GetItem>";
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
