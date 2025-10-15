/* global Office */
import { ShowError } from "../ui/uiToggle";

// Get Attachments function performs all the steps necessary to get the attachment information
// from the Email Server and to add the retrieved information into the HeaderSourceChoices
// global variable for access by the UI.  That information includes the attachment name
// and the header associated with that attachment.  Once attachment information is gathered,
// the function passed in (callOnCompletion) is invoked.
// All code for getting attachment information (on the client) is nested inside the
// GetAttachments function
export function GetAttachments(guid, callOnCompletion) {

    // Initialize a context object for the add-in.
    //   Set the fields that are used on the request
    //   object to default values.

    const serviceRequest = {
        attachmentToken: "",
        ewsUrl:  Office.context.mailbox.ewsUrl,
        restUrl: Office.context.mailbox.restUrl,
        emailRestId: "",
        isRest: false,
        UserToken: guid,
        timeoutInMS: 50,
        attachments: []
    };

    getAttachmentToken();

    // Gets the attachment Token and triggers request for attachment information.
    function getAttachmentToken() {
        if (serviceRequest.attachmentToken == "") {
            serviceRequest.isRest = (Office.context.mailbox.diagnostics.hostName == "OutlookIOS");
            // FORCE IsRest code to run on Server
            serviceRequest.isRest = true;

            // Setting first parameter to '{isRest: true}' will simulate behavior from IOS and possibly
            // other Rest based devices.
            Office.context.mailbox.getCallbackTokenAsync({ isRest: serviceRequest.isRest }, attachmentTokenCallback);
        }
    }

    // Save the token and trigger actual call to email header service to get the attachment(s)
    // header information.
    function attachmentTokenCallback(asyncResult, userContext) {
        if (asyncResult.status === "succeeded") {
            // Cache the result from the server.
            serviceRequest.attachmentToken = asyncResult.value;
            serviceRequest.emailId = Office.context.mailbox.item.itemId;
            serviceRequest.emailRestId = getItemRestId(serviceRequest.emailId);
            serviceRequest.state = 3;
            makeServiceRequest();
        } else {
            ShowError("Error", "Could not get callback token: " + asyncResult.error.message);
        }
    }

    // Convert the item ID to a Rest Format (IOS always returns rest format)
    function getItemRestId(itemId) {
        if (Office.context.mailbox.diagnostics.hostName === "OutlookIOS") {
            // itemId is already REST-formatted
            return itemId;
        } else {
            // Convert to an item ID for API v2.0
            return Office.context.mailbox.convertToRestId(
                itemId,
                Office.MailboxEnums.RestVersion.v2_0
            );
        }
    }

    // convert attachment ID to type desired by server depending on if using
    // the rest interface.
    function makeAttachmentId(id) {
        if (serviceRequest.isRest) {
            return getItemRestId(id);
        }
        else {
            return id;
        }
    }

    // Make the actual call (Post) to the email header service
    function makeServiceRequest() {
        // Translate the attachment details into a form easily understood by WCF.
        for (i = 0; i < Office.context.mailbox.item.attachments.length; i++) {

            const officeAttachment = Office.context.mailbox.item.attachments[i];
            const attachment = officeAttachment._data$p$0 || officeAttachment.$0_0;

            if ( attachment !== undefined )
            {
                attachment.id = makeAttachmentId(attachment.id);
                serviceRequest.attachments.push ( JSON.parse( JSON.stringify( attachment ) ) );
            }
        }

        sendRequest(serviceRequest, requestReadyStateChange, Configuration.ServiceName);
    };

    // Send the request to the service
    function sendRequest(request,onCompletion, serviceName) {
        xhr = new XMLHttpRequest();

        let portInfo;

        if (Configuration.Port) {
            portInfo = ":" + Configuration.Port;
        }
        else {
            portInfo = "";
        }

        const fullServiceName = Configuration.Server + portInfo + "/api/" + serviceName;

        // Update the URL to point to your service location.
        xhr.open("POST", fullServiceName, true);

        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhr.onreadystatechange = onCompletion;

        // Send the request. The response is handled in the
        // onCompletion function.
        xhr.send(JSON.stringify(request));
    }

    // Handles all state changes for the service call.  This includes the response from the Email Header
    // service (state 4).
    function requestReadyStateChange() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                const response = JSON.parse(xhr.responseText);
                if (!response.IsError) {

                    ClearHeaderSources();

                    for (i = 0; i < response.AttachmentNames.length; i++) {
                        HeaderSourceChoices.push(new HeaderSourceChoice(response.AttachmentNames[i], response.AttachmentHeaders[i], false));
                    }

                } else {
                    showMessage("Runtime error", response.message);
                }
            } else {
                if (xhr.status == 404) {
                    showMessage("Service not found", "The app server could not be found.");
                } else {
                    showMessage("Unknown error", "There was an unexpected error: " + xhr.status + " -- " + xhr.statusText);
                }
            }

            callOnCompletion();
        }
    };

    // Displays an error message
    function showMessage( title, message )
    {
        const text = "GetAttachments - " + title + ":\n" + message;

        //console.log( text );

        if ( typeof updateStatus !== "undefined" )
        {
            updateStatus( text );
        }
    };
}