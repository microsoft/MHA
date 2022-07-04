import * as $ from "jquery";
import { fabric } from "office-ui-fabric-js/dist/js/fabric";
import { Diagnostics } from "./diag";
import { Errors } from "./Errors";
import { GetHeaders } from "./GetHeaders";
import { poster } from "./poster";
import { strings } from "./Strings";

class Choice {
    label: string = "";
    url: string = "";
    checked: boolean = false;
}

class DeferredError {
    error: Error = <Error>{};
    message: string = "";
}

export class ParentFrame {
    private static iFrame: Window | null;;
    private static currentChoice = {} as Choice;
    private static deferredErrors: DeferredError[] = [];
    private static deferredStatus: string[] = [];
    private static headers: string = "";
    private static modelToString: string = "";
    protected static telemetryCheckboxComponent: fabric.CheckBox;

    private static choices: Array<Choice> = [
        { label: "classic", url: "classicDesktopFrame.html", checked: false },
        { label: "new", url: "newDesktopFrame.html", checked: true },
        { label: "new-mobile", url: "newMobilePaneIosFrame.html", checked: false }
    ];

    private static getQueryVariable(variable: string): string {
        const vars: string[] = window.location.search.substring(1).split("&");

        let found: string = "";
        vars.find((v: string) => {
            const pair: string[] = v.split("=");
            if (pair[0] === variable) {
                found = pair[1] ?? "";
                return true;
            }

            return false;
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

    private static postMessageToFrame(eventName: string, data: string | { error: string, message: any }): void {
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
    public static showError(error: any, message: string, suppressTracking?: boolean): void {
        // TODO: Do something with the error
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
        } catch (e) {
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
        const choice = ParentFrame.choices.find((choice: Choice) => { return choice.checked; });
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

            input.attr("tabindex", "-1");
            input.attr("type", "radio");
            input.attr("value", iChoice);

            //  Create html: <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
            const label: JQuery<HTMLLabelElement> = ParentFrame.create(listItem, "label", "ms-RadioButton-field");
            label.attr("role", "radio");
            label.attr("tabindex", "0");
            label.attr("name", "uiChoice");
            label.attr("value", choice.label);

            // Create html: <span class="ms-Label">classic</span>
            const inputSpan: JQuery<HTMLSpanElement> = ParentFrame.create(label, "span", "ms-Label");
            inputSpan.text(choice.label);
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
        ParentFrame.setSendTelemetryUI();

        function actionHandler(event: PointerEvent): void {
            const action = (event.currentTarget as HTMLButtonElement).id;

            function getDiagnostics(): string {
                let diagnostics: string = "";
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

                const errors: string[] = Errors.get();
                for (let iError: number = 0; iError < errors.length; iError++) {
                    if (errors[iError]) {
                        diagnostics += "ERROR: " + errors[iError] + "\n";
                    }
                }

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
                    break;
                }
            }
        }

        // Wire up the buttons
        for (let i: number = 0; i < actionButtonElements.length; i++) {
            const button = actionButtonElements[i];
            if (!button) continue;
            new fabric["Button"](button, actionHandler);
        }

        const choiceGroup: NodeListOf<HTMLElement> = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
        new fabric["ChoiceFieldGroup"](choiceGroup[0]);

        const choiceFieldGroupElements: NodeListOf<HTMLElement> = dialogSettings.querySelectorAll(".ms-ChoiceFieldGroup");
        for (let i: number = 0; i < choiceFieldGroupElements.length; i++) {
            new fabric["ChoiceFieldGroup"](choiceFieldGroupElements[i]);
        }

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
        };

        const copyButton: HTMLButtonElement = header.querySelector(".copy-button") as HTMLButtonElement;
        copyButton.onclick = function (): void {
            strings.copyToClipboard(ParentFrame.modelToString);
        };
    }

    public static setSendTelemetryUI() {
        Diagnostics.canSendTelemetry() ? this.telemetryCheckboxComponent.check() : this.telemetryCheckboxComponent.unCheck();
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
        } catch (e) {
            ParentFrame.goDefaultChoice();
        }

        ParentFrame.registerItemChangedEvent();

        window.addEventListener("message", ParentFrame.eventListener, false);
        ParentFrame.loadNewItem();
    }

    public static get choice(): Choice { return ParentFrame.currentChoice; }
}