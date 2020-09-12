/* global $ */
/* global appInsights */
/* global fabric */
/* global Office */
/* global Diagnostics */
/* global Errors */
/* global GetHeaders */
/* exported ParentFrame */

// Controller for Settings screen which controls what is being displayed
// and which UI to use.

var ParentFrame = (function () {
    var iFrame = null;
    var currentChoice = {};
    var deferredErrors = [];
    var deferredStatus = [];
    var headers = "";

    function choice(label, url, checked) {
        return { label: label, url: url, checked: checked };
    }

    var choices = [
        choice("classic", "classicDesktopFrame.html", false),
        choice("new", "newDesktopFrame.html", true),
        choice("new-mobile", "newMobilePaneIosFrame.html", false)
    ];

    function setDefault() {
        var uiDefault = getQueryVariable("default");
        if (uiDefault === null) {
            uiDefault = "new";
        }

        for (var iChoice = 0; iChoice < choices.length; iChoice++) {
            if (uiDefault === choices[iChoice].label) {
                choices[iChoice].checked = true;
            } else {
                choices[iChoice].checked = false;
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
                    setFrame(event.source);
                    break;
                case "LogError":
                    Errors.log(JSON.parse(event.data.data.error), event.data.data.message);
                    break;
            }
        }
    }

    function initUI() {
        setDefault();
        addChoices();
        initFabric();

        try {
            var choice = Office.context.roamingSettings.get(getSettingsKey());
            var input = $("#uiToggle" + choice.label);
            input.prop("checked", true);
            go(choice);
        } catch (e) {
            goDefaultChoice();
        }

        registerItemChangedEvent();

        window.addEventListener("message", eventListener, false);
        loadNewItem();
    }

    function registerItemChangedEvent() {
        try {
            if (Office.context.mailbox.addHandlerAsync !== undefined) {
                Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged,
                    function () {
                        Errors.clear();
                        Diagnostics.clear();
                        loadNewItem();
                    });
            }
        } catch (e) {
            Errors.log(e, "Could not register item changed event");
        }
    }

    function loadNewItem() {
        if (Office.context.mailbox.item) {
            GetHeaders.send(function (_headers, apiUsed) {
                headers = _headers;
                Diagnostics.set("API used", apiUsed);
                render();
            });
        }
    }

    function setFrame(frame) {
        iFrame = frame;

        if (iFrame) {
            // If we have any deferred status, signal them
            for (var iStatus = 0; iStatus < deferredStatus.length; iStatus++) {
                postMessageToFrame("updateStatus", deferredStatus[iStatus]);
            }

            // Clear out the now displayed status
            deferredStatus = [];

            // If we have any deferred errors, signal them
            for (var iError = 0; iError < deferredErrors.length; iError++) {
                postMessageToFrame("showError",
                    {
                        error: JSON.stringify(deferredErrors[iError][0]),
                        message: deferredErrors[iError][1]
                    });
            }

            // Clear out the now displayed errors
            deferredErrors = [];

            render();
        }
    }

    function render() {
        if (appInsights && headers) appInsights.trackEvent("analyzeHeaders");
        postMessageToFrame("renderItem", headers);
    }

    // Tells the UI to show an error.
    function showError(error, message, suppressTracking) {
        Errors.log(error, message, suppressTracking);

        if (iFrame) {
            postMessageToFrame("showError", { error: JSON.stringify(error), message: message });
        } else {
            // We don't have an iFrame, so defer the message
            deferredErrors.push([error, message]);
        }
    }

    // Tells the UI to show an error.
    function updateStatus(statusText) {
        if (iFrame) {
            postMessageToFrame("updateStatus", statusText);
        } else {
            // We don't have an iFrame, so defer the status
            deferredStatus.push(statusText);
        }
    }

    function getSettingsKey() {
        try {
            return "frame" + Office.context.mailbox.diagnostics.hostName;
        } catch (e) {
            return "frame";
        }
    }

    // Display primary UI
    function go(choice) {
        iFrame = null;
        currentChoice = choice;
        document.getElementById("uiFrame").src = choice.url;
        if (Office.context) {
            Office.context.roamingSettings.set(getSettingsKey(), choice);
            Office.context.roamingSettings.saveAsync();
        }
    }

    function goDefaultChoice() {
        for (var iChoice = 0; iChoice < choices.length; iChoice++) {
            var choice = choices[iChoice];
            if (choice.checked) {
                go(choice);
                return;
            }
        }
    }

    function create(parentElement, newType, newClass) {
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
    function addChoices() {
        var list = $("#uiChoice-list");
        list.empty();

        for (var iChoice = 0; iChoice < choices.length; iChoice++) {
            var choice = choices[iChoice];

            // Create html: <li class="ms-RadioButton">
            var listItem = create(list, "li", "ms-RadioButton");

            // Create html: <input tabindex="-1" type="radio" class="ms-RadioButton-input" value="classic">
            var input = create(listItem, "input", "ms-RadioButton-input");

            input.attr("tabindex", "-1");
            input.attr("type", "radio");
            input.attr("value", iChoice);

            //  Create html: <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
            var label = create(listItem, "label", "ms-RadioButton-field");
            label.attr("role", "radio");
            label.attr("tabindex", "0");
            label.attr("name", "uiChoice");
            label.attr("value", choice.label);

            // Create html: <span class="ms-Label">classic</span>
            var inputSpan = create(label, "span", "ms-Label");
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

        var settingsButton = header.querySelector(".gear-button");
        // When clicking the button, open the dialog
        settingsButton.onclick = function () {
            // Set the current choice in the UI.
            $("#uiChoice input").attr("checked", false);
            var labels = $("#uiChoice label");
            labels.removeClass("is-checked");
            labels.attr("aria-checked", "false");
            var currentSelected = $("#uiChoice label[value=" + currentChoice.label + "]");
            currentSelected.addClass("is-checked");
            currentSelected.attr("aria-checked", "true");
            var input = currentSelected.prevAll("input:first");
            input.prop("checked", "true");
            dialogSettingsComponent.open();
        };

        var copyButton = header.querySelector(".copy-button");
        copyButton.onclick = function () {
            // Do the copy.
            postMessageToFrame("copy");
        };

        function actionHandler() {
            var action = this.id;

            switch (action) {
                case "actionsSettings-OK":
                    // How did the user say to display it (UI to display)

                    var iChoice = $("#uiChoice input:checked")[0].value;
                    var choice = choices[iChoice];
                    if (choice.label !== currentChoice.label) {
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
                var diagnosticMap = Diagnostics.get();
                for (var diag in diagnosticMap) {
                    if (diagnosticMap.hasOwnProperty(diag)) {
                        diagnostics += diag + " = " + diagnosticMap[diag] + "\n";
                    }
                }
            } catch (e) {
                diagnostics += "ERROR: Failed to get diagnostics\n";
            }

            var errors = Errors.get();
            for (var iError = 0; iError < errors.length; iError++) {
                if (errors[iError]) {
                    diagnostics += "ERROR: " + errors[iError] + "\n";
                }
            }

            return diagnostics;
        }
    }

    return {
        initUI: initUI,
        updateStatus: updateStatus,
        showError: showError,
        get choice() { return currentChoice;}
    }
})();

Office.initialize = function () {
    $(document).ready(function () {
        ParentFrame.initUI();
    });
};