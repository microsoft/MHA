/* global $ */
/* global appInsights */
/* global fabric */
/* global isError */
/* global joinArray */
/* global LogError */
/* global Office */
/* global parseError */
/* global sendHeadersRequest */
/* global getDiagnosticsMap */
/* global setItemDiagnostics */
/* global clearItemDiagnostics */
/* global ensureDiagnostics */
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
};

UiModel.prototype.currentChoice = {};
UiModel.prototype.errors = [];
UiModel.prototype.deferredErrors = [];
UiModel.prototype.deferredStatus = [];
UiModel.prototype.headers = "";

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
        ensureDiagnostics();
        setDefault();
        viewModel = new UiModel();
        InitUI();
        window.addEventListener("message", eventListener, false);
        loadNewItem();
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
                clearItemDiagnostics();
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
            setItemDiagnostics("API used", apiUsed);
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
    if (error && appInsights && !suppressTracking) {
        var props = {};
        props["Message"] = message;
        props["Error"] = JSON.stringify(error, null, 2);

        if (isError(error) && error.exception) {
            props["Source"] = "LogErrorException";
            appInsights.trackException(error, props);
        }
        else {
            props["Source"] = "LogErrorEvent";
            if (error.description) props["Error description"] = error.description;
            if (error.message) props["Error message"] = error.message;
            if (error.stack) props["Stack"] = error.stack;

            appInsights.trackEvent(error.description || error.message || props.Message || "Unknown error object", props);
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

        if (!suppressTracking) {
            var props = {};
            props["Stack"] = stackString;
            props["Source"] = "pushError";
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

    function getDiagnostics() {
        var diagnostics = "";
        try {
            var diagnosticMap = getDiagnosticsMap();
            for (var diag in diagnosticMap) {
                if (diagnosticMap.hasOwnProperty(diag)) {
                    diagnostics += diag + " = " + diagnosticMap[diag] + "\n";
                }
            }
        } catch (e) {
            diagnostics += "ERROR: Failed to get diagnostics\n";
        }

        for (var iError = 0; iError < window.viewModel.errors.length; iError++) {
            if (window.viewModel.errors[iError]) {
                diagnostics += "ERROR: " + window.viewModel.errors[iError] + "\n";
            }
        }

        return diagnostics;
    }
}