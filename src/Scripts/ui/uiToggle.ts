// Controller for Settings screen which controls what is being displayed
// and which UI to use.
//
// RBB (Dec 2018)  Added support for selecting attachment to show

// Import CSS
import "../../Content/uiToggle.css";

import $ from "jquery";

import { isError, joinArray, parseError } from "../Errors";
import { ImportedStrings } from "../Strings";
import { GetAttachments } from "../utils/GetAttachments";
import { AndRuleSet, GetRules, SimpleRuleSet } from "../utils/GetRules";
import { ClearHeaderSources, HeaderSourceChoice, SetDefaultHeaderSource, UpdateShowChoices } from "../utils/HeaderSource";
import { sendHeadersRequest } from "./getHeaders/GetHeaders";

export let viewModel = null;
export const UiModel = function () {
    this.currentChoice = {};
    this.currentHeaderSource = [];
    this.errors = [];
    this.deferredErrors = [];
    this.deferredStatus = [];
    this.headers = "";
    this.apiUsed = "not set";
};

UiModel.prototype.currentChoice = {};
UiModel.prototype.currentHeaderSource = {};
UiModel.prototype.errors = [];
UiModel.prototype.deferredErrors = [];
UiModel.prototype.deferredStatus = [];
UiModel.prototype.headers = "";
UiModel.prototype.apiUsed = "not set";

export let iFrame = null;
export const UiChoice = function (label, url, checked) {
    this.label = label;
    this.url = url;
    this.checked = checked;
};

UiChoice.prototype.label = "";
UiChoice.prototype.url = "";
UiChoice.prototype.checked = "";

export const uiChoices = [
    new UiChoice("classic", "classicDesktopFrame.html", false),
    new UiChoice("new", "newDesktopFrame.html", true),
    new UiChoice("new-mobile", "newMobilePaneIosFrame.html", false)
];

function setDefault() {
    let uiDefault = getQueryVariable("default");
    if (uiDefault === null) {
        uiDefault = "new";
    }

    for (let iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        if (uiDefault === uiChoices[iChoice].label) {
            uiChoices[iChoice].checked = true;
        }
        else {
            uiChoices[iChoice].checked = false;
        }
    }
}

function getQueryVariable(variable) {
    const vars = window.location.search.substring(1).split("&");
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split("=");
        if (pair[0] === variable) {
            return pair[1];
        }
    }
    return null;
}

// Safely initialize Office when it becomes available
function initializeOffice() {
    if (typeof (globalThis as any).Office !== "undefined") {
        Office.initialize = function (reason) {
            $(document).ready(function () {
                setDefault();
                viewModel = new UiModel();
                window.viewModel = viewModel; // Make viewModel accessible to child frames
                InitUI();
                initFabric();
                window.addEventListener("message", eventListener, false);
                loadNewItem();
            });
        };
        return true;
    }
    return false;
}

// Try to initialize immediately, or wait for Office to load
if (!initializeOffice()) {
    // Office not available yet, wait for it to load
    const checkOffice = () => {
        if (initializeOffice()) {
            return; // Successfully initialized
        }
        // Check again in 100ms
        setTimeout(checkOffice, 100);
    };
    checkOffice();
}

function site() { return window.location.protocol + "//" + window.location.host; }

function postMessageToFrame(eventName, data) {
    if (iFrame) {
        iFrame.postMessage({ eventName: eventName, data: data }, site());
    }
}

function eventListener(event) {
    if (!event || event.origin !== site()) {
        return;
    }

    if (event.data) {
        switch (event.data.eventName) {
            case "frameActive":
                SetFrame(event.source);
                break;
            case "debugStatus":
                console.log("🔍 DEBUG STATUS from mobile pane:", event.data.data.message);
                break;
            case "requestRuleValidation":
                console.log("🔍 eventListener: Mobile pane requesting rule validation");
                if (SimpleRuleSet?.length > 0 || AndRuleSet?.length > 0) {
                    console.log("🔍 eventListener: 🎯 Sending validateRules message to mobile pane");
                    postMessageToFrame("validateRules", { SimpleRuleSet, AndRuleSet });
                } else {
                    console.log("🔍 eventListener: ⚠️ No rules available yet for validation");
                }
                break;
            case "LogError":
                LogError(JSON.parse(event.data.data.error), event.data.data.message);
                break;
        }
    }
}

export function InitUI() {
    addChoices(uiChoices);
}

function registerItemChangeEvent() {
    try {
        if (Office.context.mailbox.addHandlerAsync !== undefined) {
            Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, function () {
                viewModel.errors = [];
                loadNewItem();
            });
        }
    } catch (e) {
        LogError(e, "Could not register item change event");
    }
}

function loadNewItem() {
    if (Office.context.mailbox.item) {
        // 🚀 KICK OFF RULES DOWNLOAD FIRST - async in background
        GetRules(DoGetAttachments, function() {
            // Rules download still in progress
        });

        // Continue with headers processing while rules download in background
        sendHeadersRequest(function (headers, apiUsed) {
            viewModel.headers = headers;
            viewModel.apiUsed = apiUsed;

            viewModel.currentHeaderSource = new HeaderSourceChoice( ImportedStrings.mha_thisEmail, viewModel.headers, true);
            SetDefaultHeaderSource (viewModel.currentHeaderSource);
            window.viewModel = viewModel; // Ensure window.viewModel is updated with currentHeaderSource
            ClearHeaderSources();

            if (SimpleRuleSet?.length > 0 || AndRuleSet?.length > 0) {
                if (iFrame) {
                    postMessageToFrame("renderItem", [viewModel.headers, SimpleRuleSet, AndRuleSet]);
                }
            } else {
                if (iFrame) {
                    postMessageToFrame("renderItem", viewModel.headers);
                }
            }
        });
    }
}

function DoGetAttachments(guid)
{
    console.log("🔍 DoGetAttachments: ✅ Rules download COMPLETED!");
    console.log("🔍 DoGetAttachments: SimpleRuleSet length:", SimpleRuleSet?.length || 0);
    console.log("🔍 DoGetAttachments: AndRuleSet length:", AndRuleSet?.length || 0);

    // Now that rules are downloaded, trigger rule validation in the mobile pane
    if (iFrame && (SimpleRuleSet?.length > 0 || AndRuleSet?.length > 0)) {
        console.log("🔍 DoGetAttachments: 🎯 Triggering rule validation with downloaded rules");
        postMessageToFrame("validateRules", { SimpleRuleSet, AndRuleSet });
    }

    // Get the attachments from the EmailHeaderService.  Upon completion
    // call the CompleteInitialization to finalize screen initialization
    GetAttachments(guid, CompleteInitialization);
}

// Function called upon completion of GetAttachments to finalize initialization
export function CompleteInitialization()
{
    console.log("🔍 CompleteInitialization: ✅ All initialization steps completed!");
    console.log("🔍 CompleteInitialization: SimpleRuleSet length:", SimpleRuleSet?.length || 0);
    console.log("🔍 CompleteInitialization: AndRuleSet length:", AndRuleSet?.length || 0);

    if (SimpleRuleSet?.length > 0 || AndRuleSet?.length > 0) {
        console.log("🔍 CompleteInitialization: ✅ Rules are now available! Will update view with rules");
    } else {
        console.log("🔍 CompleteInitialization: ⚠️  Still no rules available after initialization");
    }

    // Set up list of items that we could show (this email and attachments)
    UpdateShowChoices();
    initFabric();

    try
    {
        const choice = Office.context.roamingSettings.get( getSettingsKey() );
        const input = $( "#uiToggle" + choice.label );
        input.prop( "checked", true );
        const headerChoice = $( "#showChoice input:checked" );
        headerChoice.prop( "checked", true );
        go( choice );
    }
    catch ( e )
    {
        goDefaultChoice( uiChoices );
    }

    registerItemChangeEvent();

    // Now that rules are loaded, send renderItem with headers and rules
    console.log("🔍 CompleteInitialization: Calling SendRenderItemWithRules to update view with rules");
    SendRenderItemWithRules();
}

function SetFrame(frame) {
    iFrame = frame;

    if (iFrame) {
        // If we have any deferred status, signal them
        for (let iStatus = 0; iStatus < viewModel.deferredStatus.length; iStatus++) {
            postMessageToFrame("updateStatus", viewModel.deferredStatus[iStatus]);
        }

        // Clear out the now displayed status
        viewModel.deferredStatus = [];

        // If we have any deferred errors, signal them
        for (let iError = 0; iError < viewModel.deferredErrors.length; iError++) {
            postMessageToFrame("showError", { error: JSON.stringify(viewModel.deferredErrors[iError][0]), message: viewModel.deferredErrors[iError][1] });
        }

        // Clear out the now displayed errors
        viewModel.deferredErrors = [];

        // Send renderItem immediately if we have headers, regardless of rules status
        if (viewModel && viewModel.headers) {
            // Add a small delay to ensure iframe is ready to receive messages
            setTimeout(() => {
                if (SimpleRuleSet?.length > 0 || AndRuleSet?.length > 0) {
                    postMessageToFrame("renderItem", [viewModel.headers, SimpleRuleSet, AndRuleSet]);
                } else {
                    postMessageToFrame("renderItem", viewModel.headers);
                }
            }, 100); // 100ms delay
        }
    }
}

// New function to send renderItem after rules are loaded
function SendRenderItemWithRules() {
    if (iFrame && viewModel.headers) {
        if (SimpleRuleSet?.length > 0 || AndRuleSet?.length > 0) {
            postMessageToFrame("renderItem", [viewModel.headers, SimpleRuleSet, AndRuleSet]);
        } else {
            postMessageToFrame("renderItem", viewModel.headers);
        }
    }
}

// Tells the UI to show an error.
export function ShowError(error, message, suppressTracking) {
    LogError(error, message, suppressTracking);

    if (iFrame) {
        postMessageToFrame("showError", { error: JSON.stringify(error), message: message });
    }
    else {
        // We don't have an iFrame, so defer the message
        viewModel.deferredErrors.push([error, message]);
    }
}

// error - an exception object
// message - a string describing the error
// suppressTracking - boolean indicating if we should suppress tracking
export function LogError(error, message, suppressTracking) {
    // Application Insights logging disabled
    // if (error && document.domain !== "localhost" && !suppressTracking) {
    //     if (isError(error)) {
    //         appInsights.trackException(error);
    //     }
    //     else {
    //         const props = getDiagnosticsMap();
    //         props["Message"] = message;
    //         props["Error"] = JSON.stringify(error, null, 2);
    //         appInsights.trackEvent("Unknown error object", props);
    //     }
    // }

    parseError(error, message, function (eventName, stack) {
        pushError(eventName, stack, suppressTracking);
    });
}

function pushError(eventName, stack, suppressTracking) {
    if (eventName || stack) {
        const stackString = joinArray(stack, "\n");
        viewModel.errors.push(joinArray([eventName, stackString], "\n"));

        // Application Insights logging disabled
        // if (document.domain !== "localhost" && !suppressTracking) {
        //     const props = getDiagnosticsMap();
        //     props["Stack"] = stackString;
        //     appInsights.trackEvent(eventName, props);
        // }
    }
}

// Tells the UI to show an error.
export function UpdateStatus(statusText) {
    if (iFrame) {
        postMessageToFrame("updateStatus", statusText);
    }
    else {
        // We don't have an iFrame, so defer the status
        viewModel.deferredStatus.push(statusText);
    }
}

function getSettingsKey() {
    try {
        return "frame" + Office.context.mailbox.diagnostics.hostName;
    }
    catch (e) {
        return "frame";
    }
}

// Display primary UI
function go(choice) {
    iFrame = null;
    viewModel.currentChoice = choice;
    document.getElementById("uiFrame").src = choice.url;
    if (Office.context) {
        Office.context.roamingSettings.set(getSettingsKey(), choice);
        Office.context.roamingSettings.saveAsync();
    }
}

function goDefaultChoice(uiChoices) {
    for (let iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        const choice = uiChoices[iChoice];
        if (choice.checked) {
            go(choice);
            return;
        }
    }
}

function Create(parentElement, newType, newClass) {
    const newElement = $(document.createElement(newType));
    if (newClass) {
        newElement.addClass(newClass);
    }

    if (parentElement) {
        parentElement.append(newElement);
    }

    return newElement;
}

// Create list of choices to display for the UI types
function addChoices(uiChoices) {
    const list = $("#uiChoice-list");
    list.empty();

    for (let iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        const choice = uiChoices[iChoice];

        // Create html: <li class="ms-RadioButton">
        const listItem = Create(list, "li", "ms-RadioButton");

        // Create html: <input tabindex="-1" type="radio" class="ms-RadioButton-input" value="classic">
        const input = Create(listItem, "input", "ms-RadioButton-input");

        input.attr("tabindex", "-1");
        input.attr("type", "radio");
        input.attr("value", iChoice);

        //  Create html: <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
        const label = Create(listItem, "label", "ms-RadioButton-field");
        label.attr("role", "radio");
        label.attr("tabindex", "0");
        label.attr("name", "uiChoice");
        label.attr("value", choice.label);

        // Create html: <span class="ms-Label">classic</span>
        const inputSpan = Create(label, "span", "ms-Label");
        inputSpan.text(choice.label);
    }
}

// Hook the UI together for display
function initFabric() {
    let i;
    const header = document.querySelector(".header-row");

    const dialogSettings = header.querySelector("#dialog-Settings");
    // Wire up the dialog
    const dialogSettingsComponent = new fabric["Dialog"](dialogSettings);

    const dialogDiagnostics = header.querySelector("#dialog-Diagnostics");
    // Wire up the dialog
    const dialogDiagnosticsComponent = new fabric["Dialog"](dialogDiagnostics);

    const actionButtonElements = header.querySelectorAll(".ms-Dialog-action");
    // Wire up the buttons
    for (i = 0; i < actionButtonElements.length; i++) {
        new fabric["Button"](actionButtonElements[i], actionHandler);
    }

    const choiceGroup = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
    new fabric["ChoiceFieldGroup"](choiceGroup[0]);

    const choiceFieldGroupElements = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
    for (i = 0; i < choiceFieldGroupElements.length; i++) {
        new fabric["ChoiceFieldGroup"](choiceFieldGroupElements[i]);
    }

    const button = header.querySelector(".dialog-button");
    // When clicking the button, open the dialog
    button.onclick = function () {
        try {
            // Set the current choice in the UI.
            $("#uiChoice input").attr("checked", false);
            let labels = $("#uiChoice label");
            labels.removeClass("is-checked");
            labels.attr("aria-checked", "false");
            let currentSelected = $("#uiChoice label[value=" + viewModel.currentChoice.label + "]");
            currentSelected.addClass("is-checked");
            currentSelected.attr("aria-checked", "true");
            let input = currentSelected.prevAll("input:first");
            input.prop("checked", "true");

            // Set the current choice for the item to get the header from (email or attachment)

            // Set all labels to unchecked
            $("#showChoice input").attr("checked", false);
            labels = $("#showChoice label");
            labels.removeClass("is-checked");
            labels.attr("aria-checked", "false");

            // Set the currently selected (according to the viewModel) to checked
            // Following line of code throws an exception on some email titles.  Attempted to put a try-catch around
            // it but try-catch causes this file not to load into Outlook.exe as an add-on.
            currentSelected = $("#showChoice label[value='" + EscapeCharacters (viewModel.currentHeaderSource.label) + "']");
            currentSelected.addClass("is-checked");
            currentSelected.attr("aria-checked", "true");
            input = currentSelected.prevAll("input:first");
            input.prop("checked", "true");

            dialogSettingsComponent.open();
        } catch (error) {
            console.error("❌ Error in gear button click handler:", error);
        }
    };

    // Escape the special characters
    function EscapeCharacters(input) {
        const results = input.replace("'", "\\'");

        return results;
    }

    // Perform a user initiated action
    function actionHandler() {
        const action = this.id;

        switch (action) {
            case "actionsSettings-OK": {

                // What did the user select to show (email or attachment)

                const itemChecked = $( "#showChoice input:checked" )[0];
                let headerChoice;

                if ( itemChecked )
                {
                    const headerSourceIndex = itemChecked.value;
                    headerChoice = HeaderSourceChoices[headerSourceIndex];

                    if ( headerChoice )
                    {
                        headerChoice.SetChecked();
                    }
                }
                else
                {
                    headerChoice = viewModel.currentHeaderSource;
                }

                // How did the user say to display it (UI to display)

                const iChoice = $("#uiChoice input:checked")[0].value;
                const choice = uiChoices[iChoice];

                if ( ( choice.label !== viewModel.currentChoice.label ) || ( headerChoice.label !== viewModel.currentHeaderSource.label ) )
                {
                    // Set up header to show
                    viewModel.currentHeaderSource = headerChoice;
                    viewModel.headers = headerChoice.header;

                    // Update UI
                    go(choice);
                }
                break;
            }
            case "actionsSettings-diag": {
                const diagnostics = getDiagnostics();
                $("#diagnostics").text(diagnostics);
                dialogDiagnosticsComponent.open();
                break;
            }
        }
    }
}

function getDiagnosticsMap() {
    const diagnosticsMap = {};

    if (window.navigator) diagnosticsMap["User Agent"] = window.navigator.userAgent;
    diagnosticsMap["Requirement set"] = getRequirementSet();
    diagnosticsMap["API used"] = viewModel.apiUsed;
    if (Office) {
        if (Office.context) {
            diagnosticsMap["contentLanguage"] = Office.context.contentLanguage;
            diagnosticsMap["displayLanguage"] = Office.context.displayLanguage;

            if (Office.context.mailbox) {
                if (Office.context.mailbox.diagnostics) {
                    diagnosticsMap["hostname"] = Office.context.mailbox.diagnostics.hostName;
                    diagnosticsMap["hostVersion"] = Office.context.mailbox.diagnostics.hostVersion;

                    if (Office.context.mailbox.diagnostics.OWAView) {
                        diagnosticsMap["OWAView"] = Office.context.mailbox.diagnostics.OWAView;
                    }
                }
                else {
                    diagnosticsMap["Office.context.mailbox.diagnostics"] = "missing";
                }

                if (Office.context.mailbox.item) {
                    diagnosticsMap["itemId"] = !!Office.context.mailbox.item.itemId;
                    diagnosticsMap["itemType"] = Office.context.mailbox.item.itemType;
                    diagnosticsMap["itemClass"] = Office.context.mailbox.item.itemClass;
                }
                else {
                    diagnosticsMap["Office.context.mailbox.item"] = "missing";
                }

                if (Office.context.mailbox._initialData$p$0) {
                    diagnosticsMap["permissions"] = Office.context.mailbox._initialData$p$0._permissionLevel$p$0;
                }
                else {
                    diagnosticsMap["Office.context.mailbox._initialData$p$0"] = "missing";
                }
            }
            else {
                diagnosticsMap["Office.context.mailbox"] = "missing";
            }
        }
        else {
            diagnosticsMap["Office.context"] = "missing";
        }
    }
    else {
        diagnosticsMap["Office"] = "missing";
    }

    return diagnosticsMap;
}

function getDiagnostics() {
    let diagnostics = "";
    try {
        const diagnosticsMap = getDiagnosticsMap();
        for (const diag in diagnosticsMap) {
            if (diagnosticsMap.hasOwnProperty(diag)) {
                diagnostics += diag + " = " + diagnosticsMap[diag] + "\n";
            }
        }
    } catch (e) {
        diagnostics += "ERROR: Failed to get diagnostics\n";
    }

    for (let iError = 0; iError < viewModel.errors.length; iError++) {
        if (viewModel.errors[iError]) {
            diagnostics += "ERROR: " + viewModel.errors[iError] + "\n";
        }
    }

    return diagnostics;
}

function getRequirementSet() {
    try {
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
    catch (e) {
        return "Could not detect requirements set";
    }
}

function ShowPrivacy() {
    if (Office.context.platform == "PC") {
        Office.context.ui.displayDialogAsync(window.location.origin + "/Pages/PrivacyDialog.html", {height:60, width:60});
    }
    else {
        window.open("https://msdpn.azurewebsites.net/default?LID=62");
    }
    return false;
}
