/* global $ */
/* global appInsights */
/* global fabric */
/* global isError */
/* global joinArray */
/* global LogError */
/* global Office */
/* global parseError */
/* global sendHeadersRequest */
/* exported pushError */
/* exported ShowError */
/* exported UpdateStatus */

// Controller for Settings screen which controls what is being displayed
// and which UI to use.

var viewModel = null;
var UiModel = function () {
    this.currentChoice = {};
    this.errors = [];
    this.deferredErrors = [];
    this.deferredStatus = [];
    this.headers = "";
    this.apiUsed = "not set";
};

UiModel.prototype.currentChoice = {};
UiModel.prototype.errors = [];
UiModel.prototype.deferredErrors = [];
UiModel.prototype.deferredStatus = [];
UiModel.prototype.headers = "";
UiModel.prototype.apiUsed = "not set";

var iFrame = null;
var UiChoice = function (label, url, checked) {
    this.label = label;
    this.url = url;
    this.checked = checked;
};

UiChoice.prototype.label = "";
UiChoice.prototype.url = "";
UiChoice.prototype.checked = "";

var uiChoices = [
    new UiChoice("classic", "classicDesktopFrame.html", false),
    new UiChoice("new", "newDesktopFrame.html", true),
    new UiChoice("new-mobile", "newMobilePaneIosFrame.html", false)
];

function setDefault() {
    var uiDefault = getQueryVariable("default");
    if (uiDefault === null) {
        uiDefault = "new";
    }

    for (var iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        if (uiDefault === uiChoices[iChoice].label) {
            uiChoices[iChoice].checked = true;
        }
        else {
            uiChoices[iChoice].checked = false;
        }
    }
}

function getQueryVariable(variable) {
    var vars = window.location.search.substring(1).split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] === variable) {
            return pair[1];
        }
    }
    return null;
}

Office.initialize = function () {
    $(document).ready(function () {
        setDefault();
        viewModel = new UiModel();
        InitUI();
        window.addEventListener("message", eventListener, false);
        loadNewItem();

        window.DiagnosticsMap = getDiagnosticsMap();
        var client = new XMLHttpRequest();
        client.open("HEAD", window.location.origin + window.location.pathname, true);
        client.onreadystatechange = function () {
            if (this.readyState == 2) {
                window.DiagnosticsMap["Last Update"] = client.getResponseHeader("Last-Modified");
            }
        }

        client.send();
    });
};

function site() { return window.location.protocol + "//" + window.location.host; }

function postMessageToFrame(eventName, data) {
    if (iFrame) {
        iFrame.postMessage({ eventName: eventName, data: data }, site());
    }
}

function eventListener(event) {
    if (!event || event.origin !== site()) return;

    if (event.data) {
        switch (event.data.eventName) {
            case "frameActive":
                SetFrame(event.source);
                break;
            case "LogError":
                LogError(JSON.parse(event.data.data.error), event.data.data.message);
                break;
        }
    }
}

function InitUI() {
    addChoices(uiChoices);
    initFabric();

    try {
        var choice = Office.context.roamingSettings.get(getSettingsKey());
        var input = $("#uiToggle" + choice.label);
        input.prop("checked", true);
        go(choice);
    }
    catch (e) {
        goDefaultChoice(uiChoices);
    }

    registerItemChangeEvent();
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
        sendHeadersRequest(function (headers, apiUsed) {
            viewModel.headers = headers;
            viewModel.apiUsed = apiUsed;
            if (iFrame) {
                postMessageToFrame("renderItem", viewModel.headers);
            }
        });
    }
}

function SetFrame(frame) {
    iFrame = frame;

    if (iFrame) {
        // If we have any deferred status, signal them
        for (var iStatus = 0; iStatus < viewModel.deferredStatus.length; iStatus++) {
            postMessageToFrame("updateStatus", viewModel.deferredStatus[iStatus]);
        }

        // Clear out the now displayed status
        viewModel.deferredStatus = [];

        // If we have any deferred errors, signal them
        for (var iError = 0; iError < viewModel.deferredErrors.length; iError++) {
            postMessageToFrame("showError", { error: JSON.stringify(viewModel.deferredErrors[iError][0]), message: viewModel.deferredErrors[iError][1] });
        }

        // Clear out the now displayed errors
        viewModel.deferredErrors = [];

        postMessageToFrame("renderItem", viewModel.headers);
    }
}

// Tells the UI to show an error.
function ShowError(error, message, suppressTracking) {
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
function LogError(error, message, suppressTracking) {
    if (error && document.domain !== "localhost" && !suppressTracking) {
        var props = window.DiagnosticsMap;
        props["Message"] = message;
        props["Error"] = JSON.stringify(error, null, 2);

        if (isError(error) && error.exception) {
            appInsights.trackException(error, props);
        }
        else {
            appInsights.trackEvent("Unknown error object", props);
        }
    }

    parseError(error, message, function (eventName, stack) {
        pushError(eventName, stack, suppressTracking);
    });
}

function pushError(eventName, stack, suppressTracking) {
    if (eventName || stack) {
        var stackString = joinArray(stack, "\n");
        viewModel.errors.push(joinArray([eventName, stackString], "\n"));

        if (document.domain !== "localhost" && !suppressTracking) {
            var props = window.DiagnosticsMap;
            props["Stack"] = stackString;
            appInsights.trackEvent(eventName, props);
        }
    }
}

// Tells the UI to show an error.
function UpdateStatus(statusText) {
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
    for (var iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        var choice = uiChoices[iChoice];
        if (choice.checked) {
            go(choice);
            return;
        }
    }
}

function Create(parentElement, newType, newClass) {
    var newElement = $(document.createElement(newType));
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
    var list = $("#uiChoice-list");
    list.empty();

    for (var iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        var choice = uiChoices[iChoice];

        // Create html: <li class="ms-RadioButton">
        var listItem = Create(list, "li", "ms-RadioButton");

        // Create html: <input tabindex="-1" type="radio" class="ms-RadioButton-input" value="classic">
        var input = Create(listItem, "input", "ms-RadioButton-input");

        input.attr("tabindex", "-1");
        input.attr("type", "radio");
        input.attr("value", iChoice);

        //  Create html: <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
        var label = Create(listItem, "label", "ms-RadioButton-field");
        label.attr("role", "radio");
        label.attr("tabindex", "0");
        label.attr("name", "uiChoice");
        label.attr("value", choice.label);

        // Create html: <span class="ms-Label">classic</span>
        var inputSpan = Create(label, "span", "ms-Label");
        inputSpan.text(choice.label);
    }
}

// Hook the UI together for display
function initFabric() {
    var i;
    var header = document.querySelector(".header-row");

    var dialogSettings = header.querySelector("#dialog-Settings");
    // Wire up the dialog
    var dialogSettingsComponent = new fabric["Dialog"](dialogSettings);

    var dialogDiagnostics = header.querySelector("#dialog-Diagnostics");
    // Wire up the dialog
    var dialogDiagnosticsComponent = new fabric["Dialog"](dialogDiagnostics);

    var actionButtonElements = header.querySelectorAll(".ms-Dialog-action");
    // Wire up the buttons
    for (i = 0; i < actionButtonElements.length; i++) {
        new fabric["Button"](actionButtonElements[i], actionHandler);
    }

    var choiceGroup = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
    new fabric["ChoiceFieldGroup"](choiceGroup[0]);

    var choiceFieldGroupElements = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
    for (i = 0; i < choiceFieldGroupElements.length; i++) {
        new fabric["ChoiceFieldGroup"](choiceFieldGroupElements[i]);
    }

    var button = header.querySelector(".dialog-button");
    // When clicking the button, open the dialog
    button.onclick = function () {
        // Set the current choice in the UI.
        $("#uiChoice input").attr("checked", false);
        var labels = $("#uiChoice label");
        labels.removeClass("is-checked");
        labels.attr("aria-checked", "false");
        var currentSelected = $("#uiChoice label[value=" + viewModel.currentChoice.label + "]");
        currentSelected.addClass("is-checked");
        currentSelected.attr("aria-checked", "true");
        var input = currentSelected.prevAll("input:first");
        input.prop("checked", "true");
        dialogSettingsComponent.open();
    };

    function actionHandler() {
        var action = this.id;

        switch (action) {
            case "actionsSettings-OK":
                // How did the user say to display it (UI to display)

                var iChoice = $("#uiChoice input:checked")[0].value;
                var choice = uiChoices[iChoice];
                if (choice.label !== viewModel.currentChoice.label) {
                    go(choice);
                }
                break;
            case "actionsSettings-diag":
                var diagnostics = getDiagnostics();
                $("#diagnostics").text(diagnostics);
                dialogDiagnosticsComponent.open();
                break;
        }
    }
}

function getDiagnosticsMap() {
    var diagnosticsMap = {};

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

    diagnosticsMap["origin"] = window.location.origin;
    diagnosticsMap["path"] = window.location.pathname;
    return diagnosticsMap;
}

function getDiagnostics() {
    var diagnostics = "";
    try {
        for (var diag in window.DiagnosticsMap) {
            if (window.DiagnosticsMap.hasOwnProperty(diag)) {
                diagnostics += diag + " = " + window.DiagnosticsMap[diag] + "\n";
            }
        }
    } catch (e) {
        diagnostics += "ERROR: Failed to get diagnostics\n";
    }

    for (var iError = 0; iError < viewModel.errors.length; iError++) {
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
