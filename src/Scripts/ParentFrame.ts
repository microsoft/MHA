import { Choice } from "./Choice";
import { DeferredError } from "./DeferredError";
import { diagnostics } from "./Diag";
import { Errors } from "./Errors";
import { Poster } from "./Poster";
import { Strings } from "./Strings";
import { TabNavigation } from "./TabNavigation";
import { GetHeaders } from "./ui/getHeaders/GetHeaders";

// Fluent UI Web Components interfaces
interface FluentDialog extends HTMLElement {
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
        TabNavigation.setIFrame(frame);

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
    private static initFluent(): void {
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

        // Add escape key to dismiss dialogs and enter key to apply settings
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (!dialogSettings.hidden) {
                    dialogSettings.hidden = true;
                }
                if (!dialogDiagnostics.hidden) {
                    dialogDiagnostics.hidden = true;
                }
            }

            if (e.key === "Enter" && !dialogSettings.hidden) {
                // Only trigger OK action when focused on radio buttons or checkboxes
                const activeElement = document.activeElement;
                const isRadioOrCheckbox = activeElement &&
                    (activeElement.tagName.toLowerCase() === "fluent-radio" ||
                     activeElement.tagName.toLowerCase() === "fluent-checkbox");

                if (isRadioOrCheckbox) {
                    // Trigger the same action as the OK button
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
                    e.preventDefault(); // Prevent default form submission behavior
                }
            }

            if (e.key === "Enter" && !dialogDiagnostics.hidden) {
                // Close diagnostics dialog when Enter is pressed on the code box
                const activeElement = document.activeElement;
                if (activeElement && activeElement.id === "diagpre") {
                    dialogDiagnostics.hidden = true;
                    e.preventDefault();
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

        // Initialize tab navigation handling
        TabNavigation.initialize();
    }

    public static setSendTelemetryUI(sendTelemetry: boolean) {
        if (ParentFrame.telemetryCheckbox) {
            ParentFrame.telemetryCheckbox.checked = sendTelemetry;
        }
    }

    public static async initUI() {
        ParentFrame.setDefault();
        ParentFrame.addChoices();
        ParentFrame.initFluent();

        try {
            const choice: Choice = Office.context.roamingSettings.get(ParentFrame.getSettingsKey());
            const sendTelemetry: boolean = Office.context.roamingSettings.get("sendTelemetry");
            diagnostics.initSendTelemetry(sendTelemetry);

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
