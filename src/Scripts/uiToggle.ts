import * as $ from "jquery";
import { appInsights } from './diag'
/* global fabric */
/* global Office */
import { Diagnostics } from "./diag";
import { Errors } from "./Errors";
import { GetHeaders } from "./GetHeaders";
import { message } from "./message";
import { mhaStrings } from "./Strings";

// Controller for Settings screen which controls what is being displayed
// and which UI to use.

export const ParentFrame = (function () {
    "use strict";

    class Choice {
        label: string;
        url: string;
        checked: boolean;
    }

    let iFrame = null;
    let currentChoice = {} as Choice;
    let deferredErrors = [];
    let deferredStatus = [];
    let headers = "";
    let modelToString = "";

    const choices: Array<Choice> = [
        { label: "classic", url: "classicDesktopFrame.html", checked: false },
        { label: "new", url: "newDesktopFrame.html", checked: true },
        { label: "new-mobile", url: "newMobilePaneIosFrame.html", checked: false }
    ];

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

    function setDefault() {
        let uiDefault = getQueryVariable("default");
        if (uiDefault === null) {
            uiDefault = "new";
        }

        for (let iChoice = 0; iChoice < choices.length; iChoice++) {
            if (uiDefault === choices[iChoice].label) {
                choices[iChoice].checked = true;
            } else {
                choices[iChoice].checked = false;
            }
        }
    }

    function postMessageToFrame(eventName, data) {
        message.postMessageToFrame(iFrame, eventName, data);
    }

    function render() {
        if (appInsights && headers) appInsights.trackEvent("analyzeHeaders");
        postMessageToFrame("renderItem", headers);
    }

    function setFrame(frame) {
        iFrame = frame;

        if (iFrame) {
            // If we have any deferred status, signal them
            for (let iStatus = 0; iStatus < deferredStatus.length; iStatus++) {
                postMessageToFrame("updateStatus", deferredStatus[iStatus]);
            }

            // Clear out the now displayed status
            deferredStatus = [];

            // If we have any deferred errors, signal them
            for (let iError = 0; iError < deferredErrors.length; iError++) {
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

    function eventListener(event) {
        if (!event || event.origin !== message.site()) return;

        if (event.data) {
            switch (event.data.eventName) {
                case "frameActive":
                    setFrame(event.source);
                    break;
                case "LogError":
                    Errors.log(JSON.parse(event.data.data.error), event.data.data.message);
                    break;
                case "modelToString":
                    modelToString = event.data.data;
                    break;
            }
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

    // Tells the UI to show an error.
    function showError(error, message: string, suppressTracking?: boolean) {
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
    function go(choice: Choice) {
        iFrame = null;
        currentChoice = choice;
        document.getElementById("uiFrame").src = choice.url;
        if (Office.context) {
            Office.context.roamingSettings.set(getSettingsKey(), choice);
            Office.context.roamingSettings.saveAsync();
        }
    }

    function goDefaultChoice() {
        for (let iChoice = 0; iChoice < choices.length; iChoice++) {
            const choice = choices[iChoice];
            if (choice.checked) {
                go(choice);
                return;
            }
        }
    }

    function create(parentElement, newType, newClass) {
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
    function addChoices() {
        const list = $("#uiChoice-list");
        list.empty();

        for (let iChoice = 0; iChoice < choices.length; iChoice++) {
            const choice = choices[iChoice];

            // Create html: <li class="ms-RadioButton">
            const listItem = create(list, "li", "ms-RadioButton");

            // Create html: <input tabindex="-1" type="radio" class="ms-RadioButton-input" value="classic">
            const input = create(listItem, "input", "ms-RadioButton-input");

            input.attr("tabindex", "-1");
            input.attr("type", "radio");
            input.attr("value", iChoice);

            //  Create html: <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
            const label = create(listItem, "label", "ms-RadioButton-field");
            label.attr("role", "radio");
            label.attr("tabindex", "0");
            label.attr("name", "uiChoice");
            label.attr("value", choice.label);

            // Create html: <span class="ms-Label">classic</span>
            const inputSpan = create(label, "span", "ms-Label");
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

        function actionHandler() {
            const action = this.id;

            function getDiagnostics() {
                let diagnostics = "";
                try {
                    const diagnosticMap = Diagnostics.get();
                    for (const diag in diagnosticMap) {
                        if (diagnosticMap.hasOwnProperty(diag)) {
                            diagnostics += diag + " = " + diagnosticMap[diag] + "\n";
                        }
                    }
                } catch (e) {
                    diagnostics += "ERROR: Failed to get diagnostics\n";
                }

                const errors = Errors.get();
                for (let iError = 0; iError < errors.length; iError++) {
                    if (errors[iError]) {
                        diagnostics += "ERROR: " + errors[iError] + "\n";
                    }
                }

                return diagnostics;
            }

            switch (action) {
                case "actionsSettings-OK": {
                    // How did the user say to display it (UI to display)
                    const iChoice = $("#uiChoice input:checked")[0].value;
                    const choice: Choice = choices[iChoice];
                    if (choice.label !== currentChoice.label) {
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

        const settingsButton = header.querySelector(".gear-button");
        // When clicking the button, open the dialog
        settingsButton.onclick = function () {
            // Set the current choice in the UI.
            $("#uiChoice input").attr("checked", false);
            const labels = $("#uiChoice label");
            labels.removeClass("is-checked");
            labels.attr("aria-checked", "false");
            const currentSelected = $("#uiChoice label[value=" + currentChoice.label + "]");
            currentSelected.addClass("is-checked");
            currentSelected.attr("aria-checked", "true");
            const input = currentSelected.prevAll("input:first");
            input.prop("checked", "true");
            dialogSettingsComponent.open();
        };

        const copyButton = header.querySelector(".copy-button");
        copyButton.onclick = function () {
            mhaStrings.copyToClipboard(modelToString);
        };
    }

    function initUI() {
        setDefault();
        addChoices();
        initFabric();

        try {
            const choice: Choice = Office.context.roamingSettings.get(getSettingsKey());
            const input = $("#uiToggle" + choice.label);
            input.prop("checked", true);
            go(choice);
        } catch (e) {
            goDefaultChoice();
        }

        registerItemChangedEvent();

        window.addEventListener("message", eventListener, false);
        loadNewItem();
    }

    return {
        initUI: initUI,
        updateStatus: updateStatus,
        showError: showError,
        get choice(): Choice { return currentChoice; }
    };
})();