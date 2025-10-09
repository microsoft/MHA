import {
    fluentButton,
    provideFluentDesignSystem
} from "@fluentui/web-components";
import "../../Content/fluentCommon.css";
import "../../Content/Office.css";
import "../../Content/classicDesktopFrame.css";

import { diagnostics } from "../Diag";
import { HeaderModel } from "../HeaderModel";
import { mhaStrings } from "../mhaStrings";
import { Strings } from "../Strings";
import { DomUtils } from "./domUtils";
import { Table } from "./Table";

// Register Fluent UI Web Components
provideFluentDesignSystem().register(
    fluentButton()
);

let viewModel: HeaderModel;
let table: Table;

function enableSpinner() {
    const responseElement = document.getElementById("response");
    if (responseElement) {
        responseElement.style.backgroundImage = "url(../Resources/loader.gif)";
        responseElement.style.backgroundRepeat = "no-repeat";
        responseElement.style.backgroundPosition = "center";
    }
}

function disableSpinner() {
    const responseElement = document.getElementById("response");
    if (responseElement) {
        responseElement.style.background = "none";
    }
}

const statusMessageTimeouts: Map<string, NodeJS.Timeout> = new Map();

function updateStatus(statusText: string) {
    DomUtils.setText("#status", statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    table.recalculateVisibility();
}

function dismissAllStatusMessages() {
    // Clear all pending timeouts
    statusMessageTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
    });
    statusMessageTimeouts.clear();

    // Find all status overlay elements and hide them
    document.querySelectorAll(".status-overlay-inline.show").forEach(element => {
        element.classList.remove("show");
    });
}

function showStatusMessage(elementId: string, message: string, duration = 2000) {
    // Dismiss any currently showing status messages first
    dismissAllStatusMessages();

    const statusElement = document.getElementById(elementId);
    if (statusElement) {
        // Update the message text
        statusElement.textContent = message;
        statusElement.classList.add("show");

        // Hide after specified duration and track the timeout
        const timeoutId = setTimeout(() => {
            statusElement.classList.remove("show");
            statusMessageTimeouts.delete(elementId);
        }, duration);

        statusMessageTimeouts.set(elementId, timeoutId);
    }
}

// Do our best at recognizing RFC 2822 headers:
// http://tools.ietf.org/html/rfc2822
function analyze() {
    diagnostics.trackEvent({ name: "analyzeHeaders" });
    const headerText = DomUtils.getValue("#inputHeaders");

    if (!headerText.trim()) {
        showStatusMessage("analyzeStatusMessage", mhaStrings.mhaNoHeaders);
        return;
    }

    viewModel = new HeaderModel(headerText);
    table.resetArrows();

    enableSpinner();
    updateStatus(mhaStrings.mhaLoading);

    table.rebuildTables(viewModel);
    updateStatus("");

    disableSpinner();

    showStatusMessage("analyzeStatusMessage", mhaStrings.mhaAnalyzed);
}

function clear() {
    DomUtils.setValue("#inputHeaders", "");

    viewModel = new HeaderModel();
    table.resetArrows();
    table.rebuildSections(viewModel);
    document.getElementById("inputHeaders")?.focus();

    showStatusMessage("clearStatusMessage", mhaStrings.mhaCleared);
}

function copy() {
    if (!viewModel || !viewModel.hasData) {
        showStatusMessage("copyStatusMessage", mhaStrings.mhaNothingToCopy);
        return;
    }

    Strings.copyToClipboard(viewModel.toString());

    // Show accessible status message
    showStatusMessage("copyStatusMessage", mhaStrings.mhaCopied);

    document.getElementById("copyButton")?.focus();
}

document.addEventListener("DOMContentLoaded", function() {
    diagnostics.set("API used", "standalone");
    viewModel = new HeaderModel();
    table = new Table();
    table.initializeTableUI(viewModel);
    table.makeResizablePane("inputHeaders", "sectionHeader", mhaStrings.mhaPrompt, () => true);

    (document.querySelector("#analyzeButton") as HTMLButtonElement).onclick = analyze;
    (document.querySelector("#clearButton") as HTMLButtonElement).onclick = clear;
    (document.querySelector("#copyButton") as HTMLButtonElement).onclick = copy;
});
