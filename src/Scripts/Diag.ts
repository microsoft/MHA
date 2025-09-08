import { ApplicationInsights, ICustomProperties, IEventTelemetry, ITelemetryItem } from "@microsoft/applicationinsights-web";
import stackTrace from "stacktrace-js";

import { aikey } from "./aikey";
import { buildTime } from "./buildTime";
import { mhaVersion } from "./mhaVersion";
import { ParentFrame } from "./ParentFrame";
import { GetHeaders } from "./ui/getHeaders/GetHeaders";
import { GetHeadersAPI } from "./ui/getHeaders/GetHeadersAPI";
import { GetHeadersRest } from "./ui/getHeaders/GetHeadersRest";

import "promise-polyfill/dist/polyfill";

// diagnostics module

class Diag {
    private appDiagnostics: { [k: string]: string | number | boolean } | null = null;
    private itemDiagnostics: { [k: string]: string | boolean } | null = null;
    private inGet = false;
    private sendTelemetry = true;
    private appInsights = new ApplicationInsights({
        config: {
            instrumentationKey: aikey(),
            disableAjaxTracking: true,
            disableFetchTracking: true,
            /* ...Other Configuration Options... */
        }
    });

    constructor() {
        this.appInsights.addTelemetryInitializer((envelope: ITelemetryItem): boolean => {
            if (!envelope || !envelope.data) return false;
            envelope.data["baseType"] = envelope.baseType;
            envelope.data["baseType"] = envelope.baseData;
            // This will get called for any appInsights tracking - we can augment or suppress logging from here
            // No appInsights logging for localhost/dev
            if (!this.sendTelemetry) {
                return false;
            }
            const doLog: boolean = (document.domain !== "localhost" && document.location.protocol !== "file:");
            if (envelope.baseType === "PageviewData") return doLog;
            if (envelope.baseType === "PageviewPerformanceData") return doLog;

            envelope.baseData = envelope.baseData || {};
            envelope.baseData["properties"] = envelope.baseData["properties"] || {};
            Object.assign(envelope.baseData["properties"], this.get());

            // If we're not one of the above types, tag in our diagnostics data
            if (envelope.baseType === "ExceptionData" && envelope.baseData) {
                // custom data for the ExceptionData type lives in a different place
                // Log an extra event with parsed stack frame
                if (envelope.baseData["exceptions"].length > 0) {
                    stackTrace.fromError(envelope.baseData["exceptions"][0])
                        .then((stackframes: stackTrace.StackFrame[]): void => {
                            this.appInsights.trackEvent({
                                name: "Exception Details", properties: {
                                    stack: stackframes,
                                    error: (envelope && envelope.baseData) ? envelope.baseData["exceptions"][0] : ""
                                }
                            });
                        });
                }
            }

            return doLog;
        });

        this.appInsights.loadAppInsights();
        if (process.env["NODE_ENV"] !== "test") {
            this.appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview        }
        }
    }

    public initSendTelemetry(sendTelemetry: boolean): void {
        this.sendTelemetry = sendTelemetry;
        ParentFrame.setSendTelemetryUI(sendTelemetry);
    }

    public setSendTelemetry(sendTelemetry: boolean): void {
        const changed = this.sendTelemetry != sendTelemetry;

        if (changed) {
            ParentFrame.setSendTelemetryUI(sendTelemetry);
            this.sendTelemetry = sendTelemetry;
            if (typeof (Office) !== "undefined" && Office.context) {
                Office.context.roamingSettings.set("sendTelemetry", this.sendTelemetry);
                Office.context.roamingSettings.saveAsync((result: Office.AsyncResult<void>) => {
                    if (result && result.status !== Office.AsyncResultStatus.Succeeded) {
                        console.log(`setSendTelemetry = ${JSON.stringify(result)}`);
                    }
                });
            }
        }
    }

    public canSendTelemetry(): boolean {
        return this.sendTelemetry;
    }

    public trackEvent(event: IEventTelemetry, customProperties?: ICustomProperties): void {
        if (this.sendTelemetry) {
            this.appInsights.trackEvent(event, customProperties);
        }
        else {
            const mgsBase = `Event ${JSON.stringify(event)}: ${JSON.stringify(customProperties)}`;
            console.log(mgsBase);
        }
    }

    public trackException(event: IEventTelemetry, customProperties?: ICustomProperties): void {
        if (this.sendTelemetry) {
            this.appInsights.trackException(event, customProperties);
        }
        else {
            const mgsBase = `Exception ${JSON.stringify(event)}: ${JSON.stringify(customProperties)}`;
            console.log(mgsBase);
        }
    }

    public trackError(eventType: string, source: string, e: unknown): void {
        const message = (e as Error).message;
        if (this.sendTelemetry) {
            const stack = (e as Error).stack;
            this.appInsights.trackEvent({ name: eventType, properties: { source: source, exception: JSON.stringify(e), message: message, stack: stack } });
        }
        else {
            const mgsBase = `Error ${eventType} from ${source}: ${message}`;
            console.log(mgsBase + " exception: " + JSON.stringify(e));
        }
    }

    private ensureItemDiagnostics(): void {
        try {
            if (this.itemDiagnostics) return;
            this.itemDiagnostics = {};

            this.itemDiagnostics["API used"] = "Not set";
            if (window.Office) {
                if (window.Office.context) {
                    if (window.Office.context.mailbox) {
                        if (window.Office.context.mailbox.item) {
                            this.itemDiagnostics["itemId"] = !!window.Office.context.mailbox.item.itemId;
                            this.itemDiagnostics["itemType"] = window.Office.context.mailbox.item.itemType;
                            this.itemDiagnostics["itemClass"] = window.Office.context.mailbox.item.itemClass;
                        }
                        else {
                            this.itemDiagnostics["Office.context.mailbox.item"] = "missing";
                        }
                    }
                    else {
                        this.itemDiagnostics["Office.context.mailbox"] = "missing";
                    }
                }
                else {
                    this.itemDiagnostics["Office.context"] = "missing";
                }
            }
            else {
                this.itemDiagnostics["Office"] = "missing";
            }
        }
        catch (e) {
            this.trackError("diagError", "Diagnostics.ensureItemDiagnostics", e);
        }
    }

    private ensureOfficeDiagnostics(): void {
        if (!this.appDiagnostics) return;

        try {
            if (ParentFrame) {
                const choice = ParentFrame.choice;
                if (choice) {
                    this.appDiagnostics["ui"] = choice.label;
                }
            }
            else {
                this.appDiagnostics["ui"] = "standalone";
            }

            this.appDiagnostics["Last Update"] = buildTime();
            this.appDiagnostics["mhaVersion"] = mhaVersion();

            if (window.Office) {
                delete this.appDiagnostics["Office"];
                if (window.Office.context) {
                    delete this.appDiagnostics["Office.context"];
                    this.appDiagnostics["contentLanguage"] = window.Office.context.contentLanguage;
                    this.appDiagnostics["displayLanguage"] = window.Office.context.displayLanguage;

                    if (window.Office.context.mailbox) {
                        delete this.appDiagnostics["Office.context.mailbox"];
                        if (window.Office.context.mailbox.diagnostics) {
                            delete this.appDiagnostics["Office.context.mailbox.diagnostics"];
                            this.appDiagnostics["hostname"] = window.Office.context.mailbox.diagnostics.hostName;
                            this.appDiagnostics["hostVersion"] = window.Office.context.mailbox.diagnostics.hostVersion;

                            if (window.Office.context.mailbox.diagnostics.OWAView) {
                                this.appDiagnostics["OWAView"] = window.Office.context.mailbox.diagnostics.OWAView;
                            }
                        }
                        else {
                            this.appDiagnostics["Office.context.mailbox.diagnostics"] = "missing";
                        }

                        // @ts-expect-error early version of initialData
                        if (window.Office.context.mailbox._initialData$p$0) {
                            delete this.appDiagnostics["Office.context.mailbox.initialData"];
                        }
                        // @ts-expect-error initialData is missing from the type file
                        else if (window.Office.context.mailbox.initialData) {
                            delete this.appDiagnostics["Office.context.mailbox.initialData"];
                        }
                        else {
                            this.appDiagnostics["Office.context.mailbox.initialData"] = "missing";
                        }
                    }
                    else {
                        this.appDiagnostics["Office.context.mailbox"] = "missing";
                    }
                }
                else {
                    this.appDiagnostics["Office.context"] = "missing";
                }
            }
            else {
                this.appDiagnostics["Office"] = "missing";
            }

            if (GetHeaders) {
                this.appDiagnostics["permissionLevel"] = GetHeaders.permissionLevel();
                this.appDiagnostics["canUseAPI"] = GetHeadersAPI.canUseAPI();
                this.appDiagnostics["canUseRest"] = GetHeadersRest.canUseRest();
                this.appDiagnostics["sufficientPermission"] = GetHeaders.sufficientPermission(true);
            }
        }
        catch (e) {
            this.trackError("diagError", "Diagnostics.ensureOfficeDiagnostics", e);
        }
    }

    private getRequirementSet(): string {
        // https://docs.microsoft.com/en-us/office/dev/add-ins/reference/requirement-sets/outlook-api-requirement-sets
        try {
            if (!("Office" in window)) return "none";
            if (!window.Office.context) return "no context";
            if (window.Office.context.requirements && window.Office.context.requirements.isSetSupported) {
                if (window.Office.context.requirements.isSetSupported("Mailbox", "1.11")) return "1.11";
                if (window.Office.context.requirements.isSetSupported("Mailbox", "1.10")) return "1.10";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.9)) return "1.9";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.8)) return "1.8";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.7)) return "1.7";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.6)) return "1.6";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.5)) return "1.5";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.4)) return "1.4";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.3)) return "1.3";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.2)) return "1.2";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.1)) return "1.1";
                if (window.Office.context.requirements.isSetSupported("Mailbox", 1.0)) return "1.0";
            }

            // This check is for severly broken office.js implementations that still crop up
            // @ts-expect-error: TS2774 false positive
            if (window.Office.context.mailbox && window.Office.context.mailbox.addHandlerAsync) return "1.5?";
            // @ts-expect-error: TS2774 false positive
            if (window.Office.context.ui && window.Office.context.ui.displayDialogAsync) return "1.4?";
            // @ts-expect-error: TS2774 false positive
            if (window.Office.context.mailbox && window.Office.context.mailbox.item.saveAsync) return "1.3?";
            // @ts-expect-error: TS2774 false positive
            if (window.Office.context.mailbox && window.Office.context.mailbox.item.setSelectedDataAsync) return "1.2?";
            // @ts-expect-error: TS2774 false positive
            if (window.Office.context.mailbox && window.Office.context.mailbox.item.removeAttachmentAsync) return "1.1?";
            return "1.0?";
        }
        catch (e) {
            this.trackError("diagError", "Diagnostics.getRequirementSet", e);
            return "Could not detect requirements set";
        }
    }

    private ensureAppDiagnostics(): void {
        try {
            if (this.appDiagnostics) {
                // We may have initialized earlier before we had an Office object, so repopulate it
                this.ensureOfficeDiagnostics();
                return;
            }

            this.appDiagnostics = {};

            if (window.navigator) this.appDiagnostics["User Agent"] = window.navigator.userAgent;
            this.appDiagnostics["Requirement set"] = this.getRequirementSet();
            this.ensureOfficeDiagnostics();

            this.appDiagnostics["origin"] = window.location.origin;
            this.appDiagnostics["path"] = window.location.pathname;
        }
        catch (e) {
            this.trackError("diagError", "Diagnostics.ensureAppDiagnostics", e);
        }
    }

    // Combines appDiagnostics and itemDiagnostics and returns a single object
    public get(): { [k: string]: string | number | boolean } {
        if (!this.inGet) {
            this.inGet = true;
            try {
                this.ensureAppDiagnostics();
                this.ensureItemDiagnostics();
            }
            catch (e) {
                this.trackError("diagError", "Diagnostics.get", e);
            }
            this.inGet = false;
        }

        // Use Object.assign for object merging
        return Object.assign({}, this.appDiagnostics, this.itemDiagnostics);
    }

    public set(field: string, value: string): void {
        try {
            this.ensureItemDiagnostics();
            if (this.itemDiagnostics) this.itemDiagnostics[field] = value;
        }
        catch (e) { this.trackError("diagError", "Diagnostics.set", e); }
    }

    public clear(): void {
        this.itemDiagnostics = null;
    }
}

export const diagnostics: Diag = new Diag();
