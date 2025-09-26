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

function updateStatus(statusText: string) {
    DomUtils.setText("#status", statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    table.recalculateVisibility();
}

// Do our best at recognizing RFC 2822 headers:
// http://tools.ietf.org/html/rfc2822
function analyze() {
    diagnostics.trackEvent({ name: "analyzeHeaders" });
    viewModel = new HeaderModel(DomUtils.getValue("#inputHeaders"));
    table.resetArrows();

    enableSpinner();
    updateStatus(mhaStrings.mhaLoading);

    table.rebuildTables(viewModel);
    updateStatus("");

    disableSpinner();
}

function clear() {
    DomUtils.setValue("#inputHeaders", "");

    viewModel = new HeaderModel();
    table.resetArrows();
    table.rebuildSections(viewModel);
    document.getElementById("inputHeaders")?.focus();
}

function copy() {
    Strings.copyToClipboard(viewModel.toString());

    // Show status message overlay for accessibility (same as uitoggle)
    const statusMessage = document.getElementById("copyStatusMessage");
    if (statusMessage) {
        statusMessage.classList.add("show");

        // Hide after 2 seconds
        setTimeout(() => {
            statusMessage.classList.remove("show");
        }, 2000);
    }

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
