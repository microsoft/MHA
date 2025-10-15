/* global Office */
import { Configuration } from "./Configuration";
import { ShowError } from "../ui/uiToggle";

export let AlreadyRetrievedRules = false;

// Use objects to avoid binding issues with let exports
export const RuleStore = {
    SimpleRuleSet: [],
    AndRuleSet: []
};

// For backward compatibility, also export direct references
export const SimpleRuleSet = RuleStore.SimpleRuleSet;
export const AndRuleSet = RuleStore.AndRuleSet;

// Define xhr variable
let xhr: XMLHttpRequest;

// Get Attachments function performs all the steps necessary to get the attachment information
// from the Email Server and to add the retrieved information into the HeaderSourceChoices
// global variable for access by the UI.  That information includes the attachment name
// and the header associated with that attachment.  Once attachment information is gathered,
// the function passed in (callOnCompletion) is invoked.
// All code for getting attachment information (on the client) is nested inside the
// GetRules function
export function GetRules(doOnCompletion, doWhileStillRunning) {

    console.log("🔍 GetRules: ⚡ Starting rules download process");
    console.log("🔍 GetRules: Target service:", Configuration.Server + ":" + Configuration.Port + "/api/" + Configuration.RulesServiceName);
    console.log("🔍 GetRules: 🏠 Using LOCAL MOCK SERVER for development");
    console.log("🔍 GetRules: AlreadyRetrievedRules:", AlreadyRetrievedRules);

    // Initialize a context object for the add-in.
    //   Set the fields that are used on the request
    //   object to default values.

    const serviceRequest = {
        attachmentToken: "",
        ewsUrl:  Office.context.mailbox.ewsUrl,
        restUrl: Office.context.mailbox.restUrl,
        emailRestId: "",
        isRest: false,
        UserToken: "",
        timeoutInMS: 50,
        browser: "",
        attachments: []
    };

    let requestedTokenToBeSent = false;

    if (AlreadyRetrievedRules === false) {
        console.log("🔍 GetRules: First time downloading rules, starting process");
        AlreadyRetrievedRules = true;

        // Check if we're using local mock server
        if (Configuration.Server === "http://localhost") {
            console.log("🔍 GetRules: 🏠 LOCALHOST DETECTED - Bypassing Office authentication");
            console.log("🔍 GetRules: 🚀 Making direct request to mock server");
            makeDirectMockRequest();
        } else {
            console.log("🔍 GetRules: Using production flow with Office authentication");
            getCallbackToken();
        }
    }
    else {
        console.log("🔍 GetRules: Rules already retrieved, calling completion handler");
        if (doOnCompletion) {
            doOnCompletion();
        }
    }

    // Direct request to mock server (bypasses Office authentication)
    function makeDirectMockRequest() {
        console.log("🔍 GetRules: makeDirectMockRequest - Creating simple mock request");

        const mockRequest = {
            timestamp: new Date().toISOString(),
            source: "mock-development"
        };

        console.log("🔍 GetRules: makeDirectMockRequest - Sending request to mock server");
        sendRequest(mockRequest, requestReadyStateChange, Configuration.RulesServiceName);
    }

    // Gets the attachment Token and triggers request for attachment information.
    function getCallbackToken() {
        console.log("🔍 GetRules: getCallbackToken - Starting token retrieval");
        if (serviceRequest.attachmentToken == "") {
            console.log("🔍 GetRules: getCallbackToken - Requesting callback token from Office");
            Office.context.mailbox.getCallbackTokenAsync({isRest: true}, attachmentTokenCallback);

            if (doWhileStillRunning) {
                console.log("🔍 GetRules: getCallbackToken - Calling progress callback");
                doWhileStillRunning();
            }
        } else {
            console.log("🔍 GetRules: getCallbackToken - Token already exists:", serviceRequest.attachmentToken);
        }
    }

    function loggerCallback(logLevel, message, piiEnabled) {
        console.log("MSAL LOG level " + logLevel + ": " + message);
    }

    function NewGuid() {

        const digit = function (char) {
            const random = Math.random() * 16 | 0;
            let valueToUse;

            if (char === "X") {
                valueToUse = random;
            }
            else {
                valueToUse = (random & 0x03 | 0x08);
            }

            return valueToUse.toString(16);
        };

        const format = "XXXXXXXX-XXXX-4XXX-zXXX-XXXXXXXXXXXX";

        return format.replace(/[Xz]/g, digit);
    }

    // Save the token and trigger actual call to email header service to get the attachment(s)
    // header information.
    function attachmentTokenCallback(asyncResult, userContext) {
        console.log("🔍 GetRules: attachmentTokenCallback - Called with status:", asyncResult.status);
        if (asyncResult.status === "succeeded") {
            console.log("🔍 GetRules: attachmentTokenCallback - ✅ Token retrieved successfully");
            // Cache the result from the server.
            serviceRequest.attachmentToken = asyncResult.value;
            serviceRequest.emailRestId = getItemRestId(Office.context.mailbox.item.itemId);
            serviceRequest.isRest = (Office.context.mailbox.diagnostics.hostName == "OutlookIOS");
            serviceRequest.state = 3;
            serviceRequest.UserToken = Office.context.mailbox.userProfile.emailAddress; //NewGuid();

            console.log("🔍 GetRules: attachmentTokenCallback - Getting identity token...");
            Office.context.mailbox.getUserIdentityTokenAsync(identityTokenCallback);
        } else {
            console.log("🔍 GetRules: attachmentTokenCallback - ❌ FAILED to get token:", asyncResult.error?.message);
            ShowError("Error", "Could not get attachmentcallback token: " + asyncResult.error.message);
        }
    }

    function identityTokenCallback(asyncResult, userContext) {
        console.log("🔍 GetRules: identityTokenCallback - Called with status:", asyncResult.status);
        if (asyncResult.status === "succeeded") {
            console.log("🔍 GetRules: identityTokenCallback - ✅ Identity token retrieved successfully");
            serviceRequest.IdToken = asyncResult.value;
        } else {
            console.log("🔍 GetRules: identityTokenCallback - ❌ FAILED to get identity token:", asyncResult.error?.message);
            ShowError("Error", "Could not get identity token: " + asyncResult.error.message);
        }

        serviceRequest.timeoutInMS = 20;

        console.log("🔍 GetRules: identityTokenCallback - Starting service request...");
        makeServiceRequest();
    }

    function browserType() {
        if (Office.context.mailbox.diagnostics.hostName == "Outlook") {
            return "Outlook.exe";
        }

        const userAgent = window.navigator.userAgent;
        const msie = userAgent.indexOf("MSIE ");
        const msie11 = userAgent.indexOf("Trident/");
        const msedge = userAgent.indexOf("Edge/");
        const internetExplorer = msie > 0 || msie11 > 0;
        const edge = msedge > 0;

        if (internetExplorer) {
            return "InternetExplorer";
        }
        else if (edge) {
            return "Edge";
        }
        else if (userAgent.includes && userAgent.includes("Chrome")) {
            return "Chrome";
        }
        else {
            return userAgent;
        }
    }

    function CanRequestToken() {
        const browser = browserType();

        console.log("Browser: " + browser);

        if ((browser == "Chrome") || (browser == "InternetExplorer")) {
            return true;
        }
        else {
            return false;
        }
    }

    function RequestToken() {

        if (CanRequestToken() && !requestedTokenToBeSent) {

            requestedTokenToBeSent = true;

            const logger = new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Verbose });

            myMSALObj = new Msal.UserAgentApplication(
                Configuration.WebSiteApplicationClientId,
                Configuration.AzureTenant,
                function (errorDesc, token, error, tokenType, state) {

                    myMSALObj.acquireTokenSilent([Configuration.ServerExposedScope]).then(function (accessToken) {

                        serviceRequest.state = 3;
                        sendRequest(serviceRequest, requestReadyStateChange, Configuration.RulesServiceName, accessToken);
                        //makeServiceRequest(accessToken);
                    }, function (error) {
                        console.log("Error", "Could not get Bearer Token: " + error);
                    });
                },
                { logger: logger, redirectUri: Configuration.RedirectUri, state: serviceRequest.attachmentToken });

            const browser = browserType();

            console.log("Browser: " + browser);

            if ((browser == "Chrome") || (browser == "InternetExplorer")) {

                // Following works in Chrome and IE 11.437 (in Outlook.exe we get dialog 'You need a new app to open this about' prompts to go to the App Store)
                myMSALObj.acquireTokenPopup([Configuration.ServerExposedScope])
                    .then(function (accessToken) {
                        console.log("acquireTokenPopup THEN CLAUSE");
                    },
                    function (error) {
                        console.log("acquireTokenPopup ERROR CLAUSE");
                        console.log(error);
                        myMSALObj.loginPopup([Configuration.ServerExposedScope]).then(function (idToken) {

                            console.log("acquireTokenPopup.error.loginPopup THEN.");
                            myMSALObj.acquireTokenSilent([Configuration.ServerExposedScope]).then(function (accessToken) {
                                console.log("acquireTokenPopup.error.loginPopup.acquireTokenSilent THEN.");
                            }, function (error) {
                                console.log("acquireTokenPopup.error.loginPopup.acquireTokenSilent ERROR.");
                                myMSALObj.acquireTokenPopup([Configuration.ServerExposedScope]).then(function (accessToken) {
                                }, function (error) {
                                    console.log(error);
                                });
                            });
                        }, function (error) {
                            if (error.startsWith && error.startsWith("user_cancelled")) {
                                console.log("Token Acknowledged");
                            }
                            else {
                                console.log("acquireTokenPopup.error.loginPopup ERROR.");
                                console.log(error);
                            }
                        });
                    });
            }
        }
    }

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

    // Make the actual call (Post) to the email header service
    function makeServiceRequest() {
        console.log("🔍 GetRules: makeServiceRequest - Starting HTTP request to rules service");
        sendRequest(serviceRequest, requestReadyStateChange, Configuration.RulesServiceName);
    };

    function sendRequest(request, onCompletion, serviceName) {
        console.log("🔍 GetRules: sendRequest - Preparing HTTP request");
        console.log("🔍 GetRules: sendRequest - Service name:", serviceName);
        console.log("🔍 GetRules: sendRequest - Request object:", {
            attachmentToken: request.attachmentToken ? "***" : "empty",
            ewsUrl: request.ewsUrl,
            restUrl: request.restUrl,
            emailRestId: request.emailRestId,
            isRest: request.isRest,
            UserToken: request.UserToken,
            timeoutInMS: request.timeoutInMS
        });

        xhr = new XMLHttpRequest();

        let portInfo;

        if (Configuration.Port) {
            portInfo = ":" + Configuration.Port;
        }
        else {
            portInfo = "";
        }

        const fullServiceName = Configuration.Server + portInfo + "/api/" + serviceName;
        console.log("🔍 GetRules: sendRequest - Full service URL:", fullServiceName);

        // Update the URL to point to your service location.
        xhr.open("POST", fullServiceName, true);

        // xhr.setRequestHeader("Authorization", "Bearer " + serviceRequest.attachmentToken);
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhr.onreadystatechange = onCompletion;

        console.log("🔍 GetRules: sendRequest - Sending HTTP POST request...");
        // Send the request. The response is handled in the
        // onCompletion function.
        xhr.send(JSON.stringify(request));
    }

    // Handles all state changes for the service call.  This includes the response from the Email Header
    // service (state 4).
    function requestReadyStateChange() {
        console.log("🔍 GetRules: requestReadyStateChange - readyState:", xhr.readyState, "status:", xhr.status);

        if (xhr.readyState == 4) {
            console.log("🔍 GetRules: requestReadyStateChange - HTTP request completed");
            console.log("🔍 GetRules: requestReadyStateChange - Status:", xhr.status);
            console.log("🔍 GetRules: requestReadyStateChange - Response text:", xhr.responseText?.substring(0, 500));

            if (xhr.status == 200) {
                console.log("🔍 GetRules: requestReadyStateChange - ✅ HTTP 200 OK - parsing response");
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log("🔍 GetRules: requestReadyStateChange - Response parsed:", {
                        IsError: response.IsError,
                        SimpleRulesCount: response.SimpleRules?.length || 0,
                        AndRulesCount: response.AndRules?.length || 0,
                        Message: response.Message
                    });

                    if (!response.IsError) {
                        console.log("🔍 GetRules: requestReadyStateChange - ✅ SUCCESS - Rules received!");
                        console.log("🔍 GetRules: requestReadyStateChange - SimpleRules:", response.SimpleRules?.length || 0, "rules");
                        console.log("🔍 GetRules: requestReadyStateChange - AndRules:", response.AndRules?.length || 0, "rules");

                        // Log the actual rules received
                        if (response.SimpleRules) {
                            console.log("🔍 GetRules: SimpleRules details:", response.SimpleRules.map(rule => ({
                                name: rule.name,
                                checkSection: rule.checkSection,
                                errorMessage: rule.errorMessage
                            })));
                        }

                        if (response.AndRules) {
                            console.log("🔍 GetRules: AndRules details:", response.AndRules.map(rule => ({
                                name: rule.name,
                                errorMessage: rule.errorMessage
                            })));
                        }

                        // Update the arrays in place to maintain references
                        RuleStore.SimpleRuleSet.length = 0; // Clear existing
                        RuleStore.SimpleRuleSet.push(...response.SimpleRules);
                        RuleStore.AndRuleSet.length = 0; // Clear existing
                        RuleStore.AndRuleSet.push(...response.AndRules);                        console.log("🔍 GetRules: ✅ Rules successfully stored in global variables");
                        console.log("🔍 GetRules: Final SimpleRuleSet length:", RuleStore.SimpleRuleSet?.length || 0);
                        console.log("🔍 GetRules: Final AndRuleSet length:", RuleStore.AndRuleSet?.length || 0);

                    } else {
                        console.log("🔍 GetRules: requestReadyStateChange - ❌ Service returned error:", response.Message);
                        if ((requestedTokenToBeSent == false) && CanRequestToken() && (response.Message == "Security Token is Invalid")) {

                            console.log("🔍 GetRules: requestReadyStateChange - Retrying with security token...");
                            // Request a security Token to be sent to Service and retry to get rules one time
                            serviceRequest.timeoutInMS = 30000;
                            RequestToken();
                            makeServiceRequest();
                            return;
                        }
                        else {
                            showMessage("Runtime error", response.message);
                        }
                    }
                } catch (e) {
                    console.log("🔍 GetRules: requestReadyStateChange - ❌ PARSE ERROR:", e);
                    showMessage("Parse error", "Could not parse response: " + e.message);
                }
            } else {
                console.log("🔍 GetRules: requestReadyStateChange - ❌ HTTP ERROR:", xhr.status, xhr.statusText);
                if (xhr.status == 404) {
                    console.log("🔍 GetRules: requestReadyStateChange - Service not found (404)");
                    showMessage("Service not found", "The app server could not be found.");
                } else {
                    console.log("🔍 GetRules: requestReadyStateChange - Unknown HTTP error");
                    showMessage("Unknown error", "There was an unexpected error: " + xhr.status + " -- " + xhr.statusText);
                }
            }

            console.log("🔍 GetRules: requestReadyStateChange - Calling completion handler");
            if (doOnCompletion) {
                doOnCompletion(serviceRequest.UserToken);
            }
        }
    };

    // Displays an error message
    function showMessage( title, message )
    {
        const text = "GetRules - " + title + ":\n" + message;

        //console.log( text );

        if ( typeof updateStatus !== "undefined" )
        {
            updateStatus( text );
        }
    };
}
