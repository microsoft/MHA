/* global $ */
/* global appInsights */
/* global fabric */
/* global joinArray */
/* global LogError */
/* global Office */
/* global parseError */
/* global sendHeadersRequest */
/* exported pushError */
/* exported ShowError */
/* exported UpdateStatus */

var viewModel = null;
var uiModel = function () {
    this.currentChoice = {};
    this.errors = [];
    this.deferredErrors = [];
    this.deferredStatus = [];
    this.headers = "";
    this.apiUsed = "";
};

uiModel.prototype.currentChoice = {};
uiModel.prototype.errors = [];
uiModel.prototype.deferredErrors = [];
uiModel.prototype.deferredStatus = [];
uiModel.prototype.headers = "";
uiModel.prototype.apiUsed = "";

var iFrame = null;
var uiChoice = function (label, url, checked) {
    this.label = label;
    this.url = url;
    this.checked = checked;
};

uiChoice.prototype.label = "";
uiChoice.prototype.url = "";
uiChoice.prototype.checked = "";

var uiChoices = [
    new uiChoice('classic', 'classicDesktopFrame.html', false),
    new uiChoice('new', 'newDesktopFrame.html', true),
    new uiChoice('new-mobile', 'newMobilePaneIosFrame.html', false)
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
}

Office.initialize = function () {
    $(document).ready(function () {
        setDefault();
        viewModel = new uiModel();
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
    buildGearDialog('uiToggleFrame', uiChoices);

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
    if (!suppressTracking && error && Object.prototype.toString.call(error) !== "[object String]") {
        appInsights.trackException(error);
    }

    parseError(error, message, function (eventName, stack) {
        pushError(eventName, stack, suppressTracking);
    });
}

function pushError(eventName, stack, suppressTracking) {
    if (eventName || stack) {
        var stackString = joinArray(stack, '\n');
        viewModel.errors.push(joinArray([eventName, stackString], '\n'));

        if (!suppressTracking) {
            var props = getDiagnosticsMap();
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
        return 'frame' + Office.context.mailbox.diagnostics.hostName;
    }
    catch (e) {
        return 'frame';
    }
}

function go(choice) {
    iFrame = null;
    viewModel.currentChoice = choice;
    document.getElementById('uiFrame').src = choice.url;
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

function buildGearDialog(id, uiChoices) {
    var pane = $("#" + id);

    //<div class="header-row">
    var headerRow = Create(pane, "div", "header-row");
    //  <div class="ms-Style-button">
    var buttonDiv = Create(headerRow, "div", "ms-Style-button");
    //    <button class="ms-Button ms-Button--hero dialog-button gear-button">
    var button = Create(buttonDiv, "button", "ms-Button ms-Button--hero dialog-button gear-button");
    //      <span class="ms-Button-label">
    var buttonSpan = Create(button, "span", "ms-Button-label");
    //        <i class="ms-Icon ms-Icon--Settings" aria-hidden="true"></i>
    var buttonIcon = Create(buttonSpan, "i", "ms-Icon ms-Icon--Settings");
    buttonIcon.attr("aria-hidden", "true");
    //      </span>
    //    </button>
    //  </div>

    // Settings Dialog
    //  <div class="ms-Dialog">
    var dialogSettings = Create(headerRow, "div", "ms-Dialog ms-Dialog--lgHeader");
    dialogSettings.attr("id", "dialog-Settings");
    //    <div class="ms-Dialog-title">Styles</div>
    var dialogSettingsTitle = Create(dialogSettings, "div", "ms-Dialog-title");
    dialogSettingsTitle.text("Settings");
    //    <div class="ms-Dialog-content">
    var dialogSettingsContent = Create(dialogSettings, "div", "ms-Dialog-content");
    //      <p class="ms-Dialog-subText">Select UI style</p>
    var dialogSettingsSubText = Create(dialogSettingsContent, "p", "ms-Dialog-subText");
    dialogSettingsSubText.text("UI style");
    //      <div class="ms-ChoiceFieldGroup" id="uiChoice" role="radiogroup">
    var choiceGroup = Create(dialogSettingsContent, "div", "ms-ChoiceFieldGroup");
    choiceGroup.attr("id", "uiChoice");
    choiceGroup.attr("role", "radiogroup");
    //        <ul class="ms-ChoiceFieldGroup-list">
    var list = Create(choiceGroup, "ul", "ms-ChoiceFieldGroup-list");
    for (var iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        var choice = uiChoices[iChoice];
        // <li class="ms-RadioButton">
        var listItem = Create(list, "li", "ms-RadioButton");
        //   <input tabindex="-1" type="radio" class="ms-RadioButton-input" value="classic">
        var input = Create(listItem, "input", "ms-RadioButton-input");
        input.attr("tabindex", '-1');
        input.attr("type", 'radio');
        input.attr("value", iChoice);
        //   <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
        var label = Create(listItem, "label", "ms-RadioButton-field");
        label.attr("role", 'radio');
        label.attr("tabindex", '0');
        label.attr("name", 'uiChoice');
        label.attr("value", choice.label);
        //     <span class="ms-Label">classic</span>
        var inputSpan = Create(label, "span", "ms-Label");
        inputSpan.text(choice.label);
        //   </label>
        // </li>
    }
    //        </ul>
    //      </div>
    //    </div>
    //    <div class="ms-Dialog-actions">
    var actionsSettings = Create(dialogSettings, "div", "ms-Dialog-actions");
    //      <button class="ms-Button ms-Dialog-action">
    var actionsSettingsButtonDiag = Create(actionsSettings, "button", "ms-Button ms-Dialog-action");
    actionsSettingsButtonDiag.attr("id", "actionsSettings-diag");
    //        <span class="ms-Button-label">OK</span>
    Create(actionsSettingsButtonDiag, "span", "ms-Button-label");
    actionsSettingsButtonDiag.text("diagnostics");
    //      </button>
    //      <button class="ms-Button ms-Dialog-action ms-Button--primary">
    var actionsSettingsButtonOK = Create(actionsSettings, "button", "ms-Button ms-Button--primary ms-Dialog-action");
    actionsSettingsButtonOK.attr("id", "actionsSettings-OK");
    //        <span class="ms-Button-label">OK</span>
    var actionsSettingsButtonOKLabel = Create(actionsSettingsButtonOK, "span", "ms-Button-label");
    actionsSettingsButtonOKLabel.text("OK");
    //      </button>
    //    </div>
    //  <div>
    //</div>

    // Diagnostics dialog
    //  <div class="ms-Dialog">
    var dialogDiag = Create(headerRow, "div", "ms-Dialog ms-Dialog--lgHeader");
    dialogDiag.attr("id", "dialog-Diagnostics");
    //    <div class="ms-Dialog-title">Styles</div>
    var dialogDiagTitle = Create(dialogDiag, "div", "ms-Dialog-title");
    dialogDiagTitle.text("Diagnostics");
    //    <div class="ms-Dialog-content">
    var dialogDiagContent = Create(dialogDiag, "div", "ms-Dialog-content");
    //      <p class="ms-Dialog-subText">Select UI style</p>
    var dialogDiagSubText = Create(dialogDiagContent, "div", "code-box");
    var pre = Create(dialogDiagSubText, "pre", null);
    var code = Create(pre, "code", null);
    code.attr("id", "diagnostics");
    //    </div>
    //    <div class="ms-Dialog-actions">
    var actionsDiag = Create(dialogDiag, "div", "ms-Dialog-actions");
    //      <button class="ms-Button ms-Dialog-action ms-Button--primary">
    var actionsDiagButtonOK = Create(actionsDiag, "button", "ms-Button ms-Button--primary ms-Dialog-action");
    actionsDiagButtonOK.attr("id", "actionsDiag-OK");
    //        <span class="ms-Button-label">OK</span>
    var actionsDiagButtonOKLabel = Create(actionsDiagButtonOK, "span", "ms-Button-label");
    actionsDiagButtonOKLabel.text("OK");
    //      </button>
    //    </div>
    //  <div>
    //</div>

    //<div class="frame-row">
    var frameRow = Create(pane, "div", "frame-row");
    //  <iframe id="uiFrame" src="newDesktopFrame.html"></iframe>
    var frame = Create(frameRow, "iFrame");
    frame.attr("id", 'uiFrame');
    //</div>

    initFabric();
}

function initFabric() {
    var i;
    var header = document.querySelector(".header-row");

    var dialogSettings = header.querySelector("#dialog-Settings");
    // Wire up the dialog
    var dialogSettingsComponent = new fabric['Dialog'](dialogSettings);

    var dialogDiagnostics = header.querySelector("#dialog-Diagnostics");
    // Wire up the dialog
    var dialogDiagnosticsComponent = new fabric['Dialog'](dialogDiagnostics);

    var actionButtonElements = header.querySelectorAll(".ms-Dialog-action");
    // Wire up the buttons
    for (i = 0; i < actionButtonElements.length; i++) {
        new fabric['Button'](actionButtonElements[i], actionHandler);
    }

    var choiceGroup = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
    new fabric['ChoiceFieldGroup'](choiceGroup[0]);

    var ChoiceFieldGroupElements = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
    for (i = 0; i < ChoiceFieldGroupElements.length; i++) {
        new fabric['ChoiceFieldGroup'](ChoiceFieldGroupElements[i]);
    }

    var button = header.querySelector(".dialog-button");
    // When clicking the button, open the dialog
    button.onclick = function () {
        // Set the current choice in the UI.
        $("#uiChoice input").attr("checked", false);
        var labels = $("#uiChoice label");
        labels.removeClass("is-checked");
        labels.attr("aria-checked", "false");
        var current = $("#uiChoice label[value=" + viewModel.currentChoice.label + "]");
        current.addClass("is-checked");
        current.attr("aria-checked", "true");
        var input = current.prevAll("input:first");
        input.prop("checked", "true");
        dialogSettingsComponent.open();
    };

    function actionHandler(event) {
        var action = this.id;

        switch (action) {
            case "actionsSettings-OK":
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
            diagnosticsMap["touchEnabled"] = Office.context.touchEnabled;

            if (Office.context.mailbox) {
                if (Office.context.mailbox.diagnostics) {
                    diagnosticsMap["hostname"] = Office.context.mailbox.diagnostics.hostName;
                    diagnosticsMap["hostVersion"] = Office.context.mailbox.diagnostics.hostVersion;

                    if (Office.context.mailbox.diagnostics.OWAView) {
                        diagnosticsMap["OWAView"] = Office.context.mailbox.diagnostics.OWAView;
                    }
                }

                if (Office.context.mailbox.item) {
                    diagnosticsMap["itemType"] = Office.context.mailbox.item.itemType;
                    diagnosticsMap["itemClass"] = Office.context.mailbox.item.itemClass;
                }

                if (Office.context.mailbox._initialData$p$0) {
                    diagnosticsMap["permissions"] = Office.context.mailbox._initialData$p$0._permissionLevel$p$0;
                }
            }
        }
    }

    return diagnosticsMap;
}

function getDiagnostics() {
    var diagnostics = "";
    try {
        var diagnosticsMap = getDiagnosticsMap();
        for (var diag in diagnosticsMap) {
            diagnostics += diag + " = " + diagnosticsMap[diag] + "\n";
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
