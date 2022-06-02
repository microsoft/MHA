import * as $ from "jquery";
import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ParentFrame } from "./parentFrame";
import { GetHeaders } from "./GetHeaders";
import { aikey } from "./aikey";
import { mhaVersion } from "./version";
import { buildTime } from "./buildTime";

// diagnostics module

export const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: aikey(),
        /* ...Other Configuration Options... */
    }
});
appInsights.addTelemetryInitializer(function (envelope) {
    envelope.data.baseType = envelope.baseType;
    envelope.data.baseData = envelope.baseData;
    // This will get called for any appInsights tracking - we can augment or suppress logging from here
    // No appInsights logging for localhost/dev
    const doLog = (document.domain !== "localhost" && document.location.protocol !== "file:");
    if (envelope.baseType === "RemoteDependencyData") return doLog;
    if (envelope.baseType === "PageviewData") return doLog;
    if (envelope.baseType === "PageviewPerformanceData") return doLog;

    // If we're not one of the above types, tag in our diagnostics data
    if (envelope.baseType === "ExceptionData") {
        // custom data for the ExceptionData type lives in a different place
        envelope.baseData.properties = envelope.baseData.properties || {};
        $.extend(envelope.baseData.properties, Diagnostics.get());
        // Log an extra event with parsed stack frame
        if (envelope.baseData.exceptions.length) {
            StackTrace.fromError(envelope.baseData.exceptions[0]).then(function (stackframes) {
                appInsights.trackEvent({
                    name: "Exception Details", properties: {
                        stack: stackframes,
                        error: envelope.baseData.exceptions[0]
                    }
                });
            });
        }
    }
    else {
        $.extend(envelope.data, Diagnostics.get());
    }

    return doLog;
});

appInsights.loadAppInsights();
appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview

export const Diagnostics = (function () {
    "use strict";

    let appDiagnostics = null;
    let itemDiagnostics = null;
    let inGet = false;

    function ensureItemDiagnostics() {
        try {
            if (itemDiagnostics) return;
            itemDiagnostics = {};

            itemDiagnostics["API used"] = "Not set";
            if (window.Office) {
                if (window.Office.context) {
                    if (window.Office.context.mailbox) {
                        if (window.Office.context.mailbox.item) {
                            itemDiagnostics["itemId"] = !!window.Office.context.mailbox.item.itemId;
                            itemDiagnostics["itemType"] = window.Office.context.mailbox.item.itemType;
                            itemDiagnostics["itemClass"] = window.Office.context.mailbox.item.itemClass;
                        }
                        else {
                            itemDiagnostics["Office.context.mailbox.item"] = "missing";
                        }
                    }
                    else {
                        itemDiagnostics["Office.context.mailbox"] = "missing";
                    }
                }
                else {
                    itemDiagnostics["Office.context"] = "missing";
                }
            }
            else {
                itemDiagnostics["Office"] = "missing";
            }
        }
        catch (e) { appInsights.trackEvent({ name: "diagError", properties: { source: "Diagnostics.ensureItemDiagnostics", exception: e.toString(), message: e.message, stack: e.stack } }); }
    }

    function ensureOfficeDiagnostics() {
        try {
            if (ParentFrame) {
                const choice = ParentFrame.choice;
                if (choice) {
                    appDiagnostics.ui = choice.label;
                }
            }
            else {
                appDiagnostics.ui = "standalone";
            }

            appDiagnostics["Last Update"] = buildTime();
            appDiagnostics["mhaVersion"] = mhaVersion();

            if (window.Office) {
                delete appDiagnostics["Office"];
                if (window.Office.context) {
                    delete appDiagnostics["Office.context"];
                    appDiagnostics["contentLanguage"] = window.Office.context.contentLanguage;
                    appDiagnostics["displayLanguage"] = window.Office.context.displayLanguage;

                    if (window.Office.context.mailbox) {
                        delete appDiagnostics["Office.context.mailbox"];
                        if (window.Office.context.mailbox.diagnostics) {
                            delete appDiagnostics["Office.context.mailbox.diagnostics"];
                            appDiagnostics["hostname"] = window.Office.context.mailbox.diagnostics.hostName;
                            appDiagnostics["hostVersion"] = window.Office.context.mailbox.diagnostics.hostVersion;

                            if (window.Office.context.mailbox.diagnostics.OWAView) {
                                appDiagnostics["OWAView"] = window.Office.context.mailbox.diagnostics.OWAView;
                            }
                        }
                        else {
                            appDiagnostics["Office.context.mailbox.diagnostics"] = "missing";
                        }

                        // @ts-ignore early version of initialData
                        if (window.Office.context.mailbox._initialData$p$0) {
                            delete appDiagnostics["Office.context.mailbox.initialData"];
                        }
                        // @ts-ignore initialData is missing from the type file
                        else if (window.Office.context.mailbox.initialData) {
                            delete appDiagnostics["Office.context.mailbox.initialData"];
                        }
                        else {
                            appDiagnostics["Office.context.mailbox.initialData"] = "missing";
                        }
                    }
                    else {
                        appDiagnostics["Office.context.mailbox"] = "missing";
                    }
                }
                else {
                    appDiagnostics["Office.context"] = "missing";
                }
            }
            else {
                appDiagnostics["Office"] = "missing";
            }

            if (GetHeaders) {
                appDiagnostics.permissionLevel = GetHeaders.permissionLevel();
                appDiagnostics.canUseRest = GetHeaders.canUseRest();
                appDiagnostics.sufficientPermission = GetHeaders.sufficientPermission(true);
            }
        }
        catch (e) { appInsights.trackEvent({ name: "diagError", properties: { source: "Diagnostics.ensureOfficeDiagnostics", exception: e.toString(), message: e.message, stack: e.stack } }); }
    }

    function getRequirementSet() {
        // https://docs.microsoft.com/en-us/office/dev/add-ins/reference/requirement-sets/outlook-api-requirement-sets
        try {
            if (!("Office" in window)) return "none";
            if (!window.Office.context) return "no context";
            if (window.Office.context.requirements && window.Office.context.requirements.isSetSupported) {
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

            if (window.Office.context.mailbox && window.Office.context.mailbox.addHandlerAsync) return "1.5?";
            if (window.Office.context.ui && window.Office.context.ui.displayDialogAsync) return "1.4?";
            if (window.Office.context.mailbox && window.Office.context.mailbox.item.saveAsync) return "1.3?";
            if (window.Office.context.mailbox && window.Office.context.mailbox.item.setSelectedDataAsync) return "1.2?";
            if (window.Office.context.mailbox && window.Office.context.mailbox.item.removeAttachmentAsync) return "1.1?";
            return "1.0?";
        }
        catch (e) {
            appInsights.trackEvent({ name: "diagError", properties: { source: "Diagnostics.getRequirementSet", exception: e.toString(), message: e.message, stack: e.stack } });
            return "Could not detect requirements set";
        }
    }

    function ensureAppDiagnostics() {
        try {
            if (appDiagnostics) {
                // We may have initialized earlier before we had an Office object, so repopulate it
                ensureOfficeDiagnostics();
                return;
            }

            appDiagnostics = {};

            if (window.navigator) appDiagnostics["User Agent"] = window.navigator.userAgent;
            appDiagnostics["Requirement set"] = getRequirementSet();
            ensureOfficeDiagnostics();

            appDiagnostics["origin"] = window.location.origin;
            appDiagnostics["path"] = window.location.pathname;
        }
        catch (e) { appInsights.trackEvent({ name: "diagError", properties: { source: "Diagnostics.ensureAppDiagnostics", exception: e.toString(), message: e.message, stack: e.stack } }); }
    }

    // Combines appDiagnostics and itemDiagnostics and returns a single object
    function get() {
        if (!inGet) {
            inGet = true;
            try {
                ensureAppDiagnostics();
                ensureItemDiagnostics();
            }
            catch (e) { appInsights.trackEvent({ name: "diagError", properties: { source: "Diagnostics.get", exception: e.toString(), message: e.message, stack: e.stack } }); }
            inGet = false;
        }

        // Ideally we'd combine with Object.assign or the spread operator(...) but not all our browsers (IE) support that.
        // jQuery's extend should work everywhere.
        return $.extend({}, appDiagnostics, itemDiagnostics);
    }

    function set(field, value) {
        try {
            ensureItemDiagnostics();
            itemDiagnostics[field] = value;
        }
        catch (e) { appInsights.trackEvent({ name: "diagError", properties: { source: "Diagnostics.set", exception: e.toString(), message: e.message, stack: e.stack } }); }
    }

    function clear() { itemDiagnostics = null; }

    return {
        get: get,
        set: set,
        clear: clear
    };
})();