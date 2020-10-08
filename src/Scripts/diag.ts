import * as $ from "jquery";
import appInsights from "./appInsights";
import { mhaVersion } from "./version";

// diagnostics module

const Diagnostics = (function () {
    "use strict";

    let appDiagnostics = null;
    let itemDiagnostics = null;
    let lastUpdate = "";
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
        catch (e) { appInsights.trackEvent("diagError", { source: "Diagnostics.ensureItemDiagnostics", exception: e.toString(), message: e.message, stack: e.stack }); }
    }

    function ensureOfficeDiagnostics() {
        try {
            if (window.ParentFrame) {
                const choice = window.ParentFrame.choice;
                if (choice) {
                    appDiagnostics.ui = choice.label;
                }
            }
            else {
                appDiagnostics.ui = "standalone";
            }

            ensureLastModified(function (_lastUpdate) { appDiagnostics["Last Update"] = _lastUpdate; });

            if (mhaVersion) {
                appDiagnostics["mhaVersion"] = mhaVersion;
            }

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

                        if (window.Office.context.mailbox._initialData$p$0) {
                            delete appDiagnostics["Office.context.mailbox.initialData"];
                        }
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

            if (window.GetHeaders) {
                appDiagnostics.permissionLevel = window.GetHeaders.permissionLevel();
                appDiagnostics.canUseRest = window.GetHeaders.canUseRest();
                appDiagnostics.sufficientPermission = window.GetHeaders.sufficientPermission(true);
            }
        }
        catch (e) { appInsights.trackEvent("diagError", { source: "Diagnostics.ensureOfficeDiagnostics", exception: e.toString(), message: e.message, stack: e.stack }); }
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
            appInsights.trackEvent("diagError", { source: "Diagnostics.getRequirementSet", exception: e.toString(), message: e.message, stack: e.stack });
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
        catch (e) { appInsights.trackEvent("diagError", { source: "Diagnostics.ensureAppDiagnostics", exception: e.toString(), message: e.message, stack: e.stack }); }
    }

    // Combines appDiagnostics and itemDiagnostics and returns a single object
    function get() {
        if (!inGet) {
            inGet = true;
            try {
                ensureAppDiagnostics();
                ensureItemDiagnostics();
            }
            catch (e) { appInsights.trackEvent("diagError", { source: "Diagnostics.get", exception: e.toString(), message: e.message, stack: e.stack }); }
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
        catch (e) { appInsights.trackEvent("diagError", { source: "Diagnostics.set", exception: e.toString(), message: e.message, stack: e.stack }); }
    }

    function clear() { itemDiagnostics = null; }

    // Find the path of the current script so we can inject a script we know lives alongside it
    const mhaVersionScriptPath = (function () {
        const scripts = document.getElementsByTagName('script');
        for (const script of scripts) {
            const path = script.getAttribute('src', 2);
            if (path && path.includes("diag")) {
                return path.split('diag')[0] + 'version.js'; // current script is diag*, so splitting here will put our path in [0]
            }
        }
    }());

    function ensureLastModified(callback) {
        if (lastUpdate) {
            if (callback) callback(lastUpdate);
            return;
        }

        try {
            const client = new XMLHttpRequest();
            // version.js is generated on build and is the true signal of the last modified time
            client.open("HEAD", mhaVersionScriptPath, true);
            client.onreadystatechange = function () {
                if (this.readyState === 2) {
                    lastUpdate = client.getResponseHeader("Last-Modified");
                    if (callback) callback(lastUpdate);
                }
            }

            client.send();
        }
        catch (e) { appInsights.trackEvent("diagError", { source: "Diagnostics.ensureLastModified", exception: e.toString(), message: e.message, stack: e.stack }); }
    }

    ensureLastModified();

    return {
        get: get,
        set: set,
        clear: clear,
        ensureLastModified: ensureLastModified
    };
})();

export default Diagnostics;