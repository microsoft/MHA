import $ from "jquery";

import { GetHeaders } from "./GetHeaders";
import { Errors } from "../../Errors";
import { mhaStrings } from "../../mhaStrings";
import { ParentFrame } from "../../ParentFrame";

/*
 * GetHeadersEWS.js
 *
 * This file has all the methods to get PR_TRANSPORT_MESSAGE_HEADERS
 * from the current message via EWS.
 *
 * Requirement Sets and Permissions
 * makeEwsRequestAsync requires 1.0 and ReadWriteMailbox
 */
interface HeaderProp {
    prop: string;
    responseCode: string;
}

export class GetHeadersEWS {
    public static extractHeadersFromXml(xml: string): HeaderProp {
        // This filters nodes for the one that matches the given name.
        function filterNode(xmlResponse: JQuery<XMLDocument>, node: string): string {
            const response: JQuery<HTMLElement> = xmlResponse.find("*").filter(function (): boolean {
                return this.nodeName === node;
            });
            if (response[0] && response[0].textContent) {
                return response[0].textContent.replace(/\r\n|\r|\n/g, "\n");
            }

            return "";
        }

        const ret = {} as HeaderProp;
        try {
            // Strip encoded embedded null characters from our XML. parseXML doesn't like them.
            xml = xml.replace(/&#x0;/g, "");
            const response = $.parseXML(xml);
            const responseDom = $(response);

            if (responseDom) {
                // We can do this because we know there's only the one property.
                const extendedProperty = filterNode(responseDom, "t:ExtendedProperty");
                if (extendedProperty.length > 0) {
                    ret.prop = filterNode(responseDom, "t:ExtendedProperty");
                }
            }

            if (!ret.prop) {
                ret.responseCode = filterNode(responseDom, "m:ResponseCode");
            }
        } catch {
            // Exceptions thrown from parseXML are super chatty and we do not want to log them.
            // We throw this exception away and just return nothing.
        }

        return ret;
    }

    private static stripHeaderFromXml(xml: string): string {
        if (!xml) return "";
        return xml
            .replace(/<t:Value>[\s\S]*<\/t:Value>/g, "<t:Value>redacted</t:Value>")
            .replace(/<t:ItemId.*?\/>/g, "<t:ItemId ID=\"redacted\"/>");
    }

    // Function called when the EWS request is complete.
    private static callbackEws(asyncResult: Office.AsyncResult<string>): string {
        try {
            // Process the returned response here.
            let header = null;
            if (asyncResult.value) {
                header = GetHeadersEWS.extractHeadersFromXml(asyncResult.value);

                // We might not have a prop and also no error. This is OK if the prop is just missing.
                if (!header.prop) {
                    if (header.responseCode === "NoError") {
                        ParentFrame.showError(null, mhaStrings.mhaHeadersMissing, true);
                        return "";
                    }
                }
            }

            if (header && header.prop) {
                return header.prop;
            }
            else {
                throw new Error(mhaStrings.mhaRequestFailed);
            }
        }
        catch (e) {
            if (asyncResult) {
                Errors.log(asyncResult.error, "Async Response\n" + GetHeadersEWS.stripHeaderFromXml(JSON.stringify(asyncResult, null, 2)));
            }

            ParentFrame.showError(e, "EWS callback failed");
        }

        return "";
    }

    private static getSoapEnvelope(request: string): string {
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

    private static getHeadersRequest(id: string): string {
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

    private static async makeEwsRequest(mailbox: Office.Mailbox, envelope:string): Promise<string> {
        return new Promise((resolve) => {
            mailbox.makeEwsRequestAsync(envelope, function (asyncResult: Office.AsyncResult<string>) {
                resolve(GetHeadersEWS.callbackEws(asyncResult));
            });
        });
    }

    public static async send(): Promise<string> {
        if (!GetHeaders.validItem()) {
            Errors.logMessage("No item selected (EWS)");
            return "";
        }

        try {
            ParentFrame.updateStatus(mhaStrings.mhaRequestSent);
            const mailbox = Office.context.mailbox;
            if (mailbox && mailbox.item) {
                const request = GetHeadersEWS.getHeadersRequest(mailbox.item.itemId);
                const envelope = GetHeadersEWS.getSoapEnvelope(request);
                const headers = await GetHeadersEWS.makeEwsRequest(mailbox, envelope);
                return headers;
            }
        } catch (e2) {
            ParentFrame.showError(e2, mhaStrings.mhaRequestFailed);
        }

        return "";
    }
}
