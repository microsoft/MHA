/* global $ */
/* global $h */
/* global jQuery */
import { ImportedStrings } from "../../Strings";
import { LogError, ShowError, UpdateStatus } from "../uiToggle";
import { validItem } from "./GetHeadersOld";

/**
 * GetHeaderEWS.js
 *
 * This file has all the methods to get PR_TRANSPORT_MESSAGE_HEADERS
 * from the current message via EWS.
 *
 * Requirement Sets and Permissions
 * makeEwsRequestAsync requires 1.0 and ReadWriteMailbox
 */

export function sendHeadersRequestEWS(headersLoadedCallback) {
    if (!validItem()) {
        LogError(null, "No item selected (EWS)", true);
        return;
    }

    let logResponse;

    try {
        if ($h && $h.EwsRequest && $h.EwsRequest.prototype && $h.EwsRequest.prototype._parseExtraResponseData$i$1) {
            $h.EwsRequest.prototype._parseExtraResponseData$i$1 = function (response) {
                logResponse = response;
            };
        }
    } catch (e) {
        LogError(e, null);
    }

    try {
        UpdateStatus(ImportedStrings.mha_RequestSent);
        const mailbox = Office.context.mailbox;
        const request = getHeadersRequest(mailbox.item.itemId);
        const envelope = getSoapEnvelope(request);
        mailbox.makeEwsRequestAsync(envelope, function (asyncResult) {
            callbackEws(asyncResult, headersLoadedCallback);
        });
    } catch (e2) {
        ShowError(e2, ImportedStrings.mha_requestFailed);
    }

    // Function called when the EWS request is complete.
    function callbackEws(asyncResult, headersLoadedCallback) {
        try {
            // Process the returned response here.
            let header = null;
            if (asyncResult.value) {
                header = extractHeadersFromXml(asyncResult.value);

                // We might not have a prop and also no error. This is OK if the prop is just missing.
                if (header && !header.prop) {
                    if (header.responseCode && header.responseCode.length > 0 && header.responseCode[0].firstChild && header.responseCode[0].firstChild.data === "NoError") {
                        headersLoadedCallback(null, "EWS");
                        ShowError(null, ImportedStrings.mha_headersMissing, true);
                        return;
                    }
                }
            }

            if (header && header.prop) {
                headersLoadedCallback(header.prop, "EWS");
            }
            else {
                throw new Error(ImportedStrings.mha_requestFailed);
            }
        }
        catch (e) {
            if (asyncResult) {
                LogError(null, "Async Response\n" + stripHeaderFromXml(JSON.stringify(asyncResult, null, 2)));
            }

            if (logResponse) {
                LogError(null, "Original Response\n" + stripHeaderFromXml(JSON.stringify(logResponse, null, 2)));
            }

            headersLoadedCallback(null, "EWS");
            ShowError(e, "EWS callback failed");
        }
    }

    function stripHeaderFromXml(xml) {
        if (!xml) return null;
        return xml
            .replace(/<t:Value>[\s\S]*<\/t:Value>/g, "<t:Value>redacted</t:Value>")
            .replace(/<t:ItemId.*?\/>/g, "<t:ItemId ID=\"redacted\"/>");
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
}

export function extractHeadersFromXml(xml) {
    // This function plug in filters nodes for the one that matches the given name.
    // This sidesteps the issues in jquery's selector logic.
    (function ($) {
        $.fn.filterNode = function (node) {
            return this.find("*").filter(function () {
                return this.nodeName === node;
            });
        };
    })(jQuery);

    const ret = {};
    try {
        // Strip encoded embedded null characters from our XML. parseXML doesn't like them.
        xml = xml.replace(/&#x0;/g, "");
        const response = $.parseXML(xml);
        const responseDom = $(response);

        if (responseDom) {
            // We can do this because we know there's only the one property.
            const extendedProperty = responseDom.filterNode("t:ExtendedProperty");
            if (extendedProperty.length > 0) {
                ret.prop = extendedProperty[0].textContent;
            }
        }

        if (!ret.prop) {
            ret.responseCode = responseDom.filterNode("m:ResponseCode");
        }
    } catch (e) {
        // Exceptions thrown from parseXML are super chatty and we do not want to log them.
        // We throw this exception away and just return nothing.
    }

    return ret;
}