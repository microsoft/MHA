/* global $ */
/* exported telemetryInitializer */
/* exported getDiagnosticsMap */
/* exported setItemDiagnostics */
/* exported clearItemDiagnostics */
/* exported getDiagnostics */

// diagnostic functions

function telemetryInitializer(envelope) {
    envelope.data.ti = "ti functioning";
    envelope.data.baseType = envelope.baseType;
    envelope.data.baseData = envelope.baseData;
    // This will get called for any appInsights tracking - we can augment or suppress logging from here
    // No appInsights logging for localhost/dev
    //if (document.domain == "localhost") return false;
    if (envelope.baseType == "RemoteDependencyData") return true;
    if (envelope.baseType == "PageviewData") return true;
    if (envelope.baseType == "PageviewPerformanceData") return true;

    // If we're not one of the above types, tag in our diagnostics data
    $.extend(envelope.data, getDiagnosticsMap());

    return true;
}

// Combines window.appDiagnostics and window.itemDiagnostics and returns a single object
function getDiagnosticsMap() {
    ensureAppDiagnostics();
    ensureItemDiagnostics();

    // Ideally we'd combine with Object.assign or the spread operator(...) but not all our browsers (IE) support that.
    // jQuery's extend should work everywhere.
    return $.extend({}, window.appDiagnostics, window.itemDiagnostics);
}

function ensureAppDiagnostics() {
    if (window.appDiagnostics) {
        // We may have initialized earlier before we had an Office object, so repopulate it
        ensureOfficeDiagnostics();
        return;
    }

    window.appDiagnostics = {};

    if (window.navigator) window.appDiagnostics["User Agent"] = window.navigator.userAgent;
    window.appDiagnostics["Requirement set"] = getRequirementSet();
    ensureOfficeDiagnostics();

    window.appDiagnostics["origin"] = window.location.origin;
    window.appDiagnostics["path"] = window.location.pathname;

    var client = new XMLHttpRequest();
    client.open("HEAD", window.location.origin + "/Scripts/uiToggle.min.js", true);
    client.onreadystatechange = function () {
        if (this.readyState == 2) {
            window.appDiagnostics["Last Update"] = client.getResponseHeader("Last-Modified");
        }
    }

    client.send();
}

function ensureOfficeDiagnostics() {
    if (window.Office) {
        delete window.appDiagnostics["Office"];
        if (window.Office.context) {
            delete window.appDiagnostics["Office.context"];
            window.appDiagnostics["contentLanguage"] = window.Office.context.contentLanguage;
            window.appDiagnostics["displayLanguage"] = window.Office.context.displayLanguage;

            if (window.Office.context.mailbox) {
                delete window.appDiagnostics["Office.context.mailbox"];
                if (window.Office.context.mailbox.diagnostics) {
                    delete window.appDiagnostics["Office.context.mailbox.diagnostics"];
                    window.appDiagnostics["hostname"] = window.Office.context.mailbox.diagnostics.hostName;
                    window.appDiagnostics["hostVersion"] = window.Office.context.mailbox.diagnostics.hostVersion;

                    if (window.Office.context.mailbox.diagnostics.OWAView) {
                        window.appDiagnostics["OWAView"] = window.Office.context.mailbox.diagnostics.OWAView;
                    }
                }
                else {
                    window.appDiagnostics["Office.context.mailbox.diagnostics"] = "missing";
                }

                if (window.Office.context.mailbox._initialData$p$0) {
                    delete window.appDiagnostics["Office.context.mailbox._initialData$p$0"];
                    window.appDiagnostics["permissions"] = window.Office.context.mailbox._initialData$p$0._permissionLevel$p$0;
                }
                else {
                    window.appDiagnostics["Office.context.mailbox._initialData$p$0"] = "missing";
                }
            }
            else {
                window.appDiagnostics["Office.context.mailbox"] = "missing";
            }
        }
        else {
            window.appDiagnostics["Office.context"] = "missing";
        }
    }
    else {
        window.appDiagnostics["Office"] = "missing";
    }
}

function setItemDiagnostics(field, value) {
    ensureItemDiagnostics();
    window.itemDiagnostics[field] = value;
}

function clearItemDiagnostics() {
    if (window.itemDiagnostics) delete window.itemDiagnostics;
}

function ensureItemDiagnostics() {
    if (window.itemDiagnostics) return;
    window.itemDiagnostics = {};

    window.itemDiagnostics["API used"] = "Not set";
    if (window.Office) {
        if (window.Office.context) {
            if (window.Office.context.mailbox) {
                if (window.Office.context.mailbox.item) {
                    window.itemDiagnostics["itemId"] = !!window.Office.context.mailbox.item.itemId;
                    window.itemDiagnostics["itemType"] = window.Office.context.mailbox.item.itemType;
                    window.itemDiagnostics["itemClass"] = window.Office.context.mailbox.item.itemClass;
                }
                else {
                    window.itemDiagnostics["Office.context.mailbox.item"] = "missing";
                }
            }
            else {
                window.itemDiagnostics["Office.context.mailbox"] = "missing";
            }
        }
        else {
            window.itemDiagnostics["Office.context"] = "missing";
        }
    }
    else {
        window.itemDiagnostics["Office"] = "missing";
    }
}

function getDiagnostics() {
    var diagnostics = "";
    try {
        var diagnosticMap = getDiagnosticsMap();
        for (var diag in diagnosticMap) {
            if (diagnosticMap.hasOwnProperty(diag)) {
                diagnostics += diag + " = " + diagnosticMap[diag] + "\n";
            }
        }
    } catch (e) {
        diagnostics += "ERROR: Failed to get diagnostics\n";
    }

    for (var iError = 0; iError < window.viewModel.errors.length; iError++) {
        if (window.viewModel.errors[iError]) {
            diagnostics += "ERROR: " + window.viewModel.errors[iError] + "\n";
        }
    }

    return diagnostics;
}

function getRequirementSet() {
    // https://docs.microsoft.com/en-us/office/dev/add-ins/reference/requirement-sets/outlook-api-requirement-sets
    try {
        if (window.Office.context.requirements && window.Office.context.requirements.isSetSupported) {
            if (window.Office.context.requirements.isSetSupported("Mailbox", 1.7)) return "1.7";
            if (window.Office.context.requirements.isSetSupported("Mailbox", 1.6)) return "1.6";
            if (window.Office.context.requirements.isSetSupported("Mailbox", 1.5)) return "1.5";
            if (window.Office.context.requirements.isSetSupported("Mailbox", 1.4)) return "1.4";
            if (window.Office.context.requirements.isSetSupported("Mailbox", 1.3)) return "1.3";
            if (window.Office.context.requirements.isSetSupported("Mailbox", 1.2)) return "1.2";
            if (window.Office.context.requirements.isSetSupported("Mailbox", 1.1)) return "1.1";
            if (window.Office.context.requirements.isSetSupported("Mailbox", 1.0)) return "1.0";
        }

        if (window.Office.context.mailbox.addHandlerAsync) return "1.5?";
        if (window.Office.context.ui.displayDialogAsync) return "1.4?";
        if (window.Office.context.mailbox.item.saveAsync) return "1.3?";
        if (window.Office.context.mailbox.item.setSelectedDataAsync) return "1.2?";
        if (window.Office.context.mailbox.item.removeAttachmentAsync) return "1.1?";
        return "1.0?";
    }
    catch (e) {
        return "Could not detect requirements set";
    }
}
