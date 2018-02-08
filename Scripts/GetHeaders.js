/**
 * GetHeaderRest.js
 *
 * Selector for switching between EWS and Rest logic
 */

function sendHeadersRequest() {
    try {
        if (Office.context.requirements.isSetSupported("Mailbox", 1.5)) {
            sendHeadersRequestRest();
        }
        else {
            sendHeadersRequestEWS();
        }
    } catch (e) {
        showError("Could not send header request");
    }
}

function getDiagnostics() {
    var diagnostics = "";
    try {
        diagnostics += "User Agent = " + window.navigator.userAgent + "\n";
        diagnostics += "Requirement set = " + getRequirementSet() + "\n";
        diagnostics += "hostname = " + Office.context.mailbox.diagnostics.hostName + "\n";
        diagnostics += "hostVersion = " + Office.context.mailbox.diagnostics.hostVersion + "\n";
        if (Office.context.mailbox.diagnostics.OWAView) {
            diagnostics += "OWAView = " + Office.context.mailbox.diagnostics.OWAView + "\n";
        }

        diagnostics += "itemType = " + Office.context.mailbox.item.itemType + "\n";
        diagnostics += "itemClass = " + Office.context.mailbox.item.itemClass + "\n";

        diagnostics += "contentLanguage = " + Office.context.contentLanguage + "\n";
        diagnostics += "displayLanguage = " + Office.context.displayLanguage + "\n";
        diagnostics += "touchEnabled = " + Office.context.touchEnabled + "\n";
    } catch (e) {
        diagnostics += "ERROR: Failed to get diagnostics\n";
    }

    for (var iError = 0; iError < viewModel.errors.length; iError++) {
        diagnostics += "ERROR: " + viewModel.errors[iError] + "\n";
    }

    return diagnostics;
}

function getRequirementSet() {
    try {
        if (Office.context.requirements && Office.context.requirements.isSetSupported) {
            if (Office.context.requirements.isSetSupported("Mailbox", 1.6)) return "1.6";
            if (Office.context.requirements.isSetSupported("Mailbox", 1.5)) return "1.5";
            if (Office.context.requirements.isSetSupported("Mailbox", 1.4)) return "1.4";
            if (Office.context.requirements.isSetSupported("Mailbox", 1.3)) return "1.3";
            if (Office.context.requirements.isSetSupported("Mailbox", 1.2)) return "1.2";
            if (Office.context.requirements.isSetSupported("Mailbox", 1.1)) return "1.1";
            if (Office.context.requirements.isSetSupported("Mailbox", 1.0)) return "1.0";
        }

        if (Office.context.mailbox.addHandlerAsync) return "1.5?";
        if (Office.context.ui.displayDialogAsync) return "1.4?";
        if (Office.context.mailbox.item.saveAsync) return "1.3?";
        if (Office.context.mailbox.item.setSelectedDataAsync) return "1.2?";
        if (Office.context.mailbox.item.removeAttachmentAsync) return "1.1?";
        return "1.0?";
    }
    catch (e) {
        return "Could not detect requirements set";
    }
}