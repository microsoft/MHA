import $ from "jquery";
import { fabric } from "office-ui-fabric-js/dist/js/fabric";
import { Diagnostics } from "./diag";
import { Errors } from "./Errors";
import { GetHeaders } from "./GetHeaders";
import { poster } from "./poster";
import { strings } from "./Strings";
import { findTabStops } from "./findTabStops";
import { Choice } from "./Choice";
import { DeferredError } from "./DeferredError";

export class ParentFrame {
    private static iFrame: Window | null;
    private static currentChoice = {} as Choice;
    private static deferredErrors: DeferredError[] = [];
    private static deferredStatus: string[] = [];
    private static headers = "";
    private static modelToString = "";
    protected static telemetryCheckboxComponent: fabric.CheckBox;

    private static choices: Array<Choice> = [
        { label: "classic", url: "classicDesktopFrame.html", checked: false },
        { label: "new", url: "newDesktopFrame.html", checked: true },
        { label: "new-mobile", url: "newMobilePaneIosFrame.html", checked: false }
    ];

    private static getQueryVariable(variable: string): string {
        const vars: string[] = window.location.search.substring(1).split("&");

        let found = "";
        // Find seems appropriate here but still fails in IE. Use forEach instead.
        vars.forEach((v: string) => {
            if (found === "") {
                const pair: string[] = v.split("=");
                if (pair[0] === variable) {
                    found = pair[1] ?? "";
                }
            }
        });

        return found;
    }

    private static setDefault(): void {
        let uiDefault: string = ParentFrame.getQueryVariable("default");
        if (uiDefault === null) {
            uiDefault = "new";
        }

        ParentFrame.choices.forEach((choice: Choice) => {
            if (uiDefault === choice.label) {
                choice.checked = true;
            } else {
                choice.checked = false;
            }
        });
    }

    private static postMessageToFrame(eventName: string, data: string | { error: string, message: string }): void {
        if (ParentFrame.iFrame) {
            poster.postMessageToFrame(ParentFrame.iFrame, eventName, data);
        }
    }

    private static render(): void {
        if (ParentFrame.headers) Diagnostics.trackEvent({ name: "analyzeHeaders" });
        ParentFrame.postMessageToFrame("renderItem", ParentFrame.headers);
    }

    private static setFrame(frame: Window): void {
        ParentFrame.iFrame = frame;

        if (ParentFrame.iFrame) {
            // If we have any deferred status, signal them
            ParentFrame.deferredStatus.forEach((status: string) => {
                ParentFrame.postMessageToFrame("updateStatus", status);
            });

            // Clear out the now displayed status
            ParentFrame.deferredStatus = [];

            // If we have any deferred errors, signal them
            ParentFrame.deferredErrors.forEach((deferredError: DeferredError) => {
                ParentFrame.postMessageToFrame("showError",
                    {
                        error: JSON.stringify(deferredError.error),
                        message: deferredError.message
                    });
            });

            // Clear out the now displayed errors
            ParentFrame.deferredErrors = [];

            ParentFrame.render();
        }
    }

    private static eventListener(event: MessageEvent): void {
        if (!event || event.origin !== poster.site()) return;

        if (event.data) {
            switch (event.data.eventName) {
                case "frameActive":
                    ParentFrame.setFrame(event.source as Window);
                    break;
                case "LogError":
                    Errors.log(JSON.parse(event.data.data.error), event.data.data.message);
                    break;
                case "modelToString":
                    ParentFrame.modelToString = event.data.data;
                    break;
            }
        }
    }

    private static loadNewItem(): void {
        if (Office.context.mailbox.item) {
            GetHeaders.send(function (_headers: string, apiUsed: string): void {
                ParentFrame.headers = _headers;
                Diagnostics.set("API used", apiUsed);
                ParentFrame.render();
            });
        }
    }

    private static registerItemChangedEvent(): void {
        try {
            if (Office.context.mailbox.addHandlerAsync !== undefined) {
                Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged,
                    function (): void {
                        Errors.clear();
                        Diagnostics.clear();
                        ParentFrame.loadNewItem();
                    });
            }
        } catch (e) {
            Errors.log(e, "Could not register item changed event");
        }
    }

    // Tells the UI to show an error.
    public static showError(error: unknown, message: string, suppressTracking?: boolean): void {
        Errors.log(error, message, suppressTracking);

        if (ParentFrame.iFrame) {
            ParentFrame.postMessageToFrame("showError", { error: JSON.stringify(error), message: message });
        } else {
            // We don't have an iFrame, so defer the message
            ParentFrame.deferredErrors.push(<DeferredError>{ error: error, message: message });
        }
    }

    // Tells the UI to show an error.
    public static updateStatus(statusText: string): void {
        if (ParentFrame.iFrame) {
            ParentFrame.postMessageToFrame("updateStatus", statusText);
        } else {
            // We don't have an iFrame, so defer the status
            ParentFrame.deferredStatus.push(statusText);
        }
    }

    private static getSettingsKey(): string {
        try {
            return "frame" + Office.context.mailbox.diagnostics.hostName;
        } catch {
            return "frame";
        }
    }

    // Display primary UI
    private static go(choice: Choice): void {
        ParentFrame.iFrame = null;
        ParentFrame.currentChoice = choice;
        (document.getElementById("uiFrame") as HTMLIFrameElement).src = choice.url;
        if (Office.context) {
            Office.context.roamingSettings.set(ParentFrame.getSettingsKey(), choice);
            Office.context.roamingSettings.saveAsync();
        }
    }

    private static goDefaultChoice(): void {
        let choice: Choice | undefined;
        ParentFrame.choices.forEach((c: Choice) => { if (!choice && c.checked) choice = c; });
        if (choice) {
            ParentFrame.go(choice);
        }
    }

    private static create<T extends HTMLElement>(parentElement: JQuery<HTMLElement>, newType: string, newClass: string): JQuery<T> {
        const newElement: JQuery<T> = $(document.createElement(newType)) as JQuery<T>;
        if (newClass) {
            newElement.addClass(newClass);
        }

        if (parentElement) {
            parentElement.append(newElement);
        }

        return newElement;
    }

    // Create list of choices to display for the UI types
    private static addChoices(): void {
        const list: JQuery<HTMLUListElement> = $("#uiChoice-list");
        list.empty();

        ParentFrame.choices.forEach((choice: Choice, iChoice: number) => {
            // Create html: <li class="ms-RadioButton">
            const listItem: JQuery<HTMLLIElement> = ParentFrame.create(list, "li", "ms-RadioButton");

            // Create html: <input tabindex="-1" type="radio" class="ms-RadioButton-input" value="classic">
            const input: JQuery<HTMLInputElement> = ParentFrame.create(listItem, "input", "ms-RadioButton-input");
            const id = choice.label;

            input.attr("type", "radio");
            input.attr("value", iChoice);
            input.attr("id", id);

            //  Create html: <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
            const label: JQuery<HTMLLabelElement> = ParentFrame.create(listItem, "label", "ms-RadioButton-field");
            label.attr("name", "uiChoice");
            label.attr("value", choice.label);
            label.attr("for", id);

            // Create html: <span class="ms-Label">classic</span>
            const inputSpan: JQuery<HTMLSpanElement> = ParentFrame.create(label, "span", "ms-Label");
            inputSpan.text(choice.label);

            // Keyboard navigation of the radio buttons isn't setting them, so we watch for focus and set them
            input.on("focus", function (): void {
                const labels: JQuery<HTMLElement> = $("#uiChoice label");
                labels.removeClass("is-checked");
                labels.attr("aria-checked", "false");
                label.addClass("is-checked");
                label.attr("aria-checked", "true");
                // ParentFrame.logElement("focus", label[0] as HTMLElement);
            });
        });
    }

    // Hook the UI together for display
    private static initFabric(): void {
        const header: Element | null = document.querySelector(".header-row");
        if (!header) return;

        const dialogSettings: HTMLElement | null = header.querySelector("#dialog-Settings");
        if (!dialogSettings) return;

        // Wire up the dialog
        const dialogSettingsComponent = new fabric["Dialog"](dialogSettings);

        const dialogDiagnostics: HTMLElement | null = header.querySelector("#dialog-Diagnostics");
        if (!dialogDiagnostics) return;
        // Wire up the dialog
        const dialogDiagnosticsComponent = new fabric["Dialog"](dialogDiagnostics);

        const actionButtonElements: NodeListOf<Element> = header.querySelectorAll(".ms-Dialog-action");
        if (!actionButtonElements) return;

        const telemetryCheckbox: HTMLElement | null = document.querySelector("#dialog-enableTelemetry");
        if (!telemetryCheckbox) return;
        this.telemetryCheckboxComponent = new fabric["CheckBox"](telemetryCheckbox);
        ParentFrame.setSendTelemetryUI(Diagnostics.canSendTelemetry());

        function actionHandler(event: Event): void {
            const action = (event.currentTarget as HTMLButtonElement).id;

            function getDiagnostics(): string {
                let diagnostics = "";
                try {
                    const diagnosticMap = Diagnostics.get();
                    for (const diag in diagnosticMap) {
                        if (Object.prototype.hasOwnProperty.call(diagnosticMap, diag)) {
                            diagnostics += diag + " = " + diagnosticMap[diag] + "\n";
                        }
                    }
                } catch {
                    diagnostics += "ERROR: Failed to get diagnostics\n";
                }

                const errors: string[] = Errors.get();
                errors.forEach((error: string) => {
                    diagnostics += "ERROR: " + error + "\n";
                });

                return diagnostics;
            }

            Diagnostics.setSendTelemetry(ParentFrame.telemetryCheckboxComponent.getValue());

            switch (action) {
                case "actionsSettings-OK": {
                    // How did the user say to display it (UI to display)
                    const iChoice: string = ($("#uiChoice .is-checked").prev()[0] as HTMLInputElement).value;
                    const choice: Choice | undefined = ParentFrame.choices[+iChoice];
                    if (choice && choice.label !== ParentFrame.currentChoice.label) {
                        ParentFrame.go(choice);
                    }

                    break;
                }
                case "actionsSettings-diag": {
                    const diagnostics: string = getDiagnostics();
                    $("#diagnostics").text(diagnostics);
                    dialogDiagnosticsComponent.open();
                    document.getElementById("diagpre")!.focus();
                    break;
                }
            }
        }

        // Wire up the buttons
        Array.prototype.forEach.call(actionButtonElements, (button: Element) => {
            new fabric["Button"](button, actionHandler);
        });

        const choiceFieldGroupElements: NodeListOf<HTMLElement> = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
        Array.prototype.forEach.call(choiceFieldGroupElements, (choiceFieldGroupElement: HTMLElement) => {
            new fabric["ChoiceFieldGroup"](choiceFieldGroupElement);
        });

        const settingsButton: HTMLButtonElement = header.querySelector(".gear-button") as HTMLButtonElement;
        // When clicking the button, open the dialog
        settingsButton.onclick = function (): void {
            // Set the current choice in the UI.
            $("#uiChoice input").attr("checked", "false");
            const labels: JQuery<HTMLElement> = $("#uiChoice label");
            labels.removeClass("is-checked");
            labels.attr("aria-checked", "false");
            const currentSelected: JQuery<HTMLLabelElement> = $("#uiChoice label[value=" + ParentFrame.currentChoice.label + "]");
            currentSelected.addClass("is-checked");
            currentSelected.attr("aria-checked", "true");
            const input: JQuery<HTMLLabelElement> = currentSelected.prevAll("input:first");
            input.prop("checked", "true");
            dialogSettingsComponent.open();
            // When dialog is opened, focus on the current selected radio button
            const inputLabel: HTMLElement = document.querySelector("#uiChoice label[value=" + ParentFrame.currentChoice.label + "]")!;
            inputLabel.focus();
        };

        const copyButton: HTMLButtonElement = header.querySelector(".copy-button") as HTMLButtonElement;
        copyButton.onclick = function (): void {
            strings.copyToClipboard(ParentFrame.modelToString);
        };

        // Tabbing into the radio buttons doesn't do what we want by default, so watch for tabbing and handle all the cases
        document.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                const shiftPressed = e.shiftKey;
                const checked: HTMLLabelElement = document.querySelector(".ms-RadioButton-field.is-checked")!;
                const focused: HTMLElement = document.activeElement as HTMLElement;
                ParentFrame.logElement("checked", checked);
                ParentFrame.logElement("focused", focused);
                console.log("Shift pressed = " + shiftPressed);
                if (checked && focused) {
                    // Tab forward from body, or OK should go to radio buttons
                    // Tab backwards from telemetry checkbox should go to radio buttons
                    if ((!shiftPressed && focused === this.body) ||
                        (!shiftPressed && focused.id === "actionsSettings-OK") ||
                        (shiftPressed && focused.id === "telemetryLabel")) {
                        // console.log("Tabbing into radio buttons");
                        checked.focus();
                        e.preventDefault();
                    }
                    // Shift tab from radio buttons or body should go to OK
                    else if ((shiftPressed && focused.className === "ms-RadioButton-input") ||
                        (shiftPressed && focused === this.body)) {
                        // console.log("Tabbing to OK");
                        const okButton: HTMLElement = document.getElementById("actionsSettings-OK")!;
                        okButton.focus();
                        e.preventDefault();
                    }
                    // Tab or shift tab from diagnostics OK should go to code
                    else if (focused.id === "actionsDiag-OK") {
                        // console.log("Tabbing to diagnostics");
                        const diagButton: HTMLElement = document.getElementById("diagpre")!;
                        diagButton.focus();
                        e.preventDefault();
                    }
                }

                // Insert the settings and copy buttons into the tab order for the ribbon if we have one
                // This handles tabbing out from these buttons.
                // Tabbing into these buttons is over in newDesktopFrame.ts
                if (!shiftPressed && focused.id === "settingsButton") {
                    // Find first header-view which is visible
                    const view = ParentFrame.iFrame?.document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
                    if (view) {
                        // set focus to first child in view which can get focus
                        const tabStops = findTabStops(view);
                        // Set focus on first element in the list if we can
                        if (tabStops.length > 0){
                            tabStops[0]?.focus();
                            e.preventDefault();
                        }
                    }
                }
                else if (shiftPressed && focused.id === "copyButton") {
                    const otherButton = ParentFrame.iFrame?.document.getElementById("other-btn");
                    if (otherButton) {
                        otherButton.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        // Mouse selection of radio buttons sets the focus on the body instead of the radio button.
        // Watch for "is checked" class changes and set the focus on the checked radio button
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    const target = mutation.target as HTMLElement;
                    if (target.classList.contains("is-checked")) {
                        // ParentFrame.logElement("MutationObserver", target);
                        target.focus();
                    }
                }
            });
        });

        const labels = document.querySelectorAll(".ms-RadioButton-field");
        labels.forEach((label) => {
            observer.observe(label, { attributes: true });
        });
    }

    private static logElement(title: string, element: HTMLElement): void {
        let out = title + " element:" + element;
        // make sure element isn't null
        if (element) {
            if (element.id) out += " id:" + element.id;
            if (element.className) out += " class:" + element.className;
            if (element.getAttribute("role")) out += " role:" + element.getAttribute("role");
            if (element.title) out += " title:" + element.title;
            if (element.getAttribute("aria-checked")) out += " aria-checked:" + element.getAttribute("aria-checked");
            if (element.getAttribute("for")) out += " for:" + element.getAttribute("for");
            if (element.getAttribute("name")) out += " name:" + element.getAttribute("name");
        }

        console.log(out);
    }

    public static setSendTelemetryUI(sendTelemetry: boolean) {
        if (sendTelemetry) {
            this.telemetryCheckboxComponent.check();
        } else {
            this.telemetryCheckboxComponent.unCheck();
        }
    }

    public static initUI(): void {
        ParentFrame.setDefault();
        ParentFrame.addChoices();
        ParentFrame.initFabric();

        try {
            const choice: Choice = Office.context.roamingSettings.get(ParentFrame.getSettingsKey());
            const sendTelemetry: boolean = Office.context.roamingSettings.get("sendTelemetry");
            Diagnostics.initSendTelemetry(sendTelemetry);

            const input: JQuery<HTMLElement> = $("#uiToggle" + choice.label);
            input.prop("checked", "true");
            ParentFrame.go(choice);
        } catch {
            ParentFrame.goDefaultChoice();
        }

        ParentFrame.registerItemChangedEvent();

        window.addEventListener("message", ParentFrame.eventListener, false);
        ParentFrame.loadNewItem();
    }

    public static get choice(): Choice { return ParentFrame.currentChoice; }
}
