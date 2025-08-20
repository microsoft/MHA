import $ from "jquery";

import { Choice } from "./Choice";
import { DeferredError } from "./DeferredError";
import { diagnostics } from "./Diag";
import { Errors } from "./Errors";
import { findTabStops } from "./findTabStops";
import { Poster } from "./Poster";
import { Strings } from "./Strings";
import { GetHeaders } from "./ui/getHeaders/GetHeaders";

// Debug info to help identify this process
console.log("🔍 MHA Debug Info:");
console.log("Process ID:", window.location.href);
console.log("User Agent:", navigator.userAgent);
console.log("Timestamp:", new Date().toISOString());

// Fluent UI Web Components interfaces
interface FluentDialog extends HTMLElement {
    show(): void;
    hide(): void;
    hidden: boolean;
    addEventListener(type: "dismiss", listener: (event: Event) => void): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

interface FluentRadioGroup extends HTMLElement {
    value: string;
}

interface FluentRadio extends HTMLElement {
    value: string;
    checked: boolean;
}

interface FluentCheckbox extends HTMLElement {
    checked: boolean;
}

export class ParentFrame {
    private static iFrame: Window | null;
    private static currentChoice = {} as Choice;
    private static deferredErrors: DeferredError[] = [];
    private static deferredStatus: string[] = [];
    private static headers = "";
    private static modelToString = "";
    protected static telemetryCheckbox: FluentCheckbox | null = null;

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
            Poster.postMessageToFrame(ParentFrame.iFrame, eventName, data);
        }
    }

    private static render(): void {
        if (ParentFrame.headers) diagnostics.trackEvent({ name: "analyzeHeaders" });
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
        if (!event || event.origin !== Poster.site()) return;

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

    private static async loadNewItem() {
        if (Office.context.mailbox.item) {
            await GetHeaders.send(function (headers: string, apiUsed: string): void {
                ParentFrame.headers = headers;
                diagnostics.set("API used", apiUsed);
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
                        diagnostics.clear();
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

    // Create list of choices to display for the UI types
    private static addChoices(): void {
        const radioGroup = document.getElementById("uiChoice") as FluentRadioGroup;
        if (!radioGroup) return;

        // Clear existing options
        radioGroup.innerHTML = "";

        ParentFrame.choices.forEach((choice: Choice, iChoice: number) => {
            const radio = document.createElement("fluent-radio") as FluentRadio;
            radio.value = iChoice.toString();
            radio.textContent = choice.label;

            if (choice.checked) {
                radio.checked = true;
            }

            radioGroup.appendChild(radio);
        });
    }

    // Hook the UI together for display
    private static initFabric(): void {
        const header: Element | null = document.querySelector(".header-row");
        if (!header) return;

        const dialogSettings = document.getElementById("dialog-Settings") as FluentDialog;
        const dialogDiagnostics = document.getElementById("dialog-Diagnostics") as FluentDialog;

        if (!dialogSettings || !dialogDiagnostics) return;

        // Ensure dialogs are initially hidden
        dialogSettings.hidden = true;
        dialogDiagnostics.hidden = true;

        // Add click-outside-to-dismiss functionality
        dialogSettings.addEventListener("click", (e) => {
            if (e.target === dialogSettings) {
                dialogSettings.hidden = true;
            }
        });

        dialogDiagnostics.addEventListener("click", (e) => {
            if (e.target === dialogDiagnostics) {
                dialogDiagnostics.hidden = true;
            }
        });

        // Add escape key to dismiss dialogs
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (!dialogSettings.hidden) {
                    dialogSettings.hidden = true;
                }
                if (!dialogDiagnostics.hidden) {
                    dialogDiagnostics.hidden = true;
                }
            }
        });

        const telemetryCheckbox = document.getElementById("telemetryInput") as FluentCheckbox;
        if (telemetryCheckbox) {
            ParentFrame.telemetryCheckbox = telemetryCheckbox;
            ParentFrame.setSendTelemetryUI(diagnostics.canSendTelemetry());
        }

        function getDiagnostics(): string {
            let diagnosticsString = "";
            try {
                const diagnosticMap = diagnostics.get();
                for (const diag in diagnosticMap) {
                    if (Object.prototype.hasOwnProperty.call(diagnosticMap, diag)) {
                        diagnosticsString += diag + " = " + diagnosticMap[diag] + "\n";
                    }
                }
            } catch {
                diagnosticsString += "ERROR: Failed to get diagnostics\n";
            }

            const errors: string[] = Errors.get();
            errors.forEach((error: string) => {
                diagnosticsString += "ERROR: " + error + "\n";
            });

            return diagnosticsString;
        }

        // Wire up action buttons
        const okButton = document.getElementById("actionsSettings-OK");
        okButton?.addEventListener("click", () => {
            // Get selected choice from radio group
            const radioGroup = document.getElementById("uiChoice") as FluentRadioGroup;
            if (radioGroup && radioGroup.value) {
                const iChoice = parseInt(radioGroup.value);
                const choice: Choice | undefined = ParentFrame.choices[iChoice];
                if (choice && choice.label !== ParentFrame.currentChoice.label) {
                    ParentFrame.go(choice);
                }
            }

            // Update telemetry setting
            if (ParentFrame.telemetryCheckbox) {
                diagnostics.setSendTelemetry(ParentFrame.telemetryCheckbox.checked);
            }

            dialogSettings.hidden = true;
        });

        const diagButton = document.getElementById("actionsSettings-diag");
        diagButton?.addEventListener("click", () => {
            const diagnosticsText = getDiagnostics();
            const diagnosticsElement = document.getElementById("diagnostics");
            if (diagnosticsElement) {
                diagnosticsElement.textContent = diagnosticsText;
            }

            // Hide settings dialog and show diagnostics dialog
            dialogSettings.hidden = true;
            dialogDiagnostics.hidden = false;
            document.getElementById("diagpre")?.focus();
        });

        const diagOkButton = document.getElementById("actionsDiag-OK");
        diagOkButton?.addEventListener("click", () => {
            dialogDiagnostics.hidden = true;
        });

        const settingsButton = document.getElementById("settingsButton");
        settingsButton?.addEventListener("click", () => {
            // Set the current choice in the radio group
            const radioGroup = document.getElementById("uiChoice") as FluentRadioGroup;
            if (radioGroup) {
                const currentIndex = ParentFrame.choices.findIndex(c => c.label === ParentFrame.currentChoice.label);
                if (currentIndex >= 0) {
                    radioGroup.value = currentIndex.toString();
                }
            }
            dialogSettings.hidden = false;
        });

        const copyButton = document.getElementById("copyButton");
        copyButton?.addEventListener("click", () => {
            Strings.copyToClipboard(ParentFrame.modelToString);
        });

        // Tabbing into the radio buttons doesn't do what we want by default, so watch for tabbing and handle all the cases
        document.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                const shiftPressed = e.shiftKey;
                const focused: HTMLElement = document.activeElement as HTMLElement;
                ParentFrame.logElement("focused", focused);
                console.log("Shift pressed = " + shiftPressed);

                // Get the currently checked radio button in Fluent UI
                const radioGroup = document.getElementById("uiChoice") as FluentRadioGroup;
                const checkedRadio = radioGroup?.querySelector("fluent-radio[checked]") as HTMLElement;

                // Tab forward from body, or OK should go to radio buttons
                // Tab backwards from telemetry checkbox should go to radio buttons
                if ((!shiftPressed && focused === document.body) ||
                    (!shiftPressed && focused.id === "actionsSettings-OK") ||
                    (shiftPressed && focused.id === "telemetryInput")) {
                    if (checkedRadio) {
                        checkedRadio.focus();
                        e.preventDefault();
                    }
                }
                // Shift tab from radio buttons or body should go to OK
                else if ((shiftPressed && focused.tagName.toLowerCase() === "fluent-radio") ||
                    (shiftPressed && focused === document.body)) {
                    const okButton: HTMLElement = document.getElementById("actionsSettings-OK")!;
                    okButton.focus();
                    e.preventDefault();
                }
                // Tab or shift tab from diagnostics OK should go to code
                else if (focused.id === "actionsDiag-OK") {
                    const diagButton: HTMLElement = document.getElementById("diagpre")!;
                    diagButton.focus();
                    e.preventDefault();
                }

                // Insert the settings and copy buttons into the tab order for the ribbon if we have one
                // This handles tabbing out from these buttons.
                // Tabbing into these buttons is over in newDesktopFrame.ts
                if (!shiftPressed && focused.id === "settingsButton") {
                    // Find first header-view which is visible, but skip the tab buttons
                    const view = ParentFrame.iFrame?.document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
                    if (view) {
                        // Look for focusable elements in the content area, excluding the tab buttons
                        const contentArea = view.querySelector(".ms-Pivot-content, .header-view-content, [role='tabpanel']") as HTMLElement;
                        const targetArea = contentArea || view;

                        const tabStops = findTabStops(targetArea);
                        // Filter out any tab buttons from the focusable elements
                        const contentTabStops = tabStops.filter(el =>
                            !el.classList.contains("ms-Pivot-link") &&
                            !el.classList.contains("ms-Button--pivot") &&
                            !el.id.includes("-btn") &&
                            !el.getAttribute("role")?.includes("tab")
                        );

                        // Set focus on first content element if we can
                        if (contentTabStops.length > 0){
                            contentTabStops[0]?.focus();
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
        if (ParentFrame.telemetryCheckbox) {
            ParentFrame.telemetryCheckbox.checked = sendTelemetry;
        }
    }

    public static async initUI() {
        ParentFrame.setDefault();
        ParentFrame.addChoices();
        ParentFrame.initFabric();

        try {
            const choice: Choice = Office.context.roamingSettings.get(ParentFrame.getSettingsKey());
            const sendTelemetry: boolean = Office.context.roamingSettings.get("sendTelemetry");
            diagnostics.initSendTelemetry(sendTelemetry);

            const input: JQuery<HTMLElement> = $("#uiToggle" + choice.label);
            input.prop("checked", "true");
            ParentFrame.go(choice);
        } catch {
            ParentFrame.goDefaultChoice();
        }

        ParentFrame.registerItemChangedEvent();

        window.addEventListener("message", ParentFrame.eventListener, false);
        await ParentFrame.loadNewItem();
    }

    public static get choice(): Choice { return ParentFrame.currentChoice; }
}
