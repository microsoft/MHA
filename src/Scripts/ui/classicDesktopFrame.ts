import "../../Content/Office.css";
import "../../Content/classicDesktopFrame.css";

import { HeaderModel } from "../HeaderModel";
import { mhaStrings } from "../mhaStrings";
import { Poster } from "../Poster";
import { DomUtils } from "./domUtils";
import { Table } from "./Table";

// This is the "classic" UI rendered in classicDesktopFrame.html

let viewModel: HeaderModel;
let table: Table;

function postError(error: unknown, message: string): void {
    Poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function enableSpinner(): void {
    const responseElement = document.getElementById("response");
    if (responseElement) {
        responseElement.style.backgroundImage = "url(../Resources/loader.gif)";
        responseElement.style.backgroundRepeat = "no-repeat";
        responseElement.style.backgroundPosition = "center";
    }
}

function disableSpinner(): void {
    const responseElement = document.getElementById("response");
    if (responseElement) {
        responseElement.style.background = "none";
    }
}

function updateStatus(statusText: string): void {
    enableSpinner();
    DomUtils.setText("#status", statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    table.recalculateVisibility();
}

function renderItem(headers: string) {
    updateStatus(mhaStrings.mhaFoundHeaders);
    DomUtils.setText("#originalHeaders", headers);
    viewModel = new HeaderModel(headers);
    table.rebuildTables(viewModel);
    updateStatus("");
    disableSpinner();
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling PostError
function showError(error: unknown, message: string) {
    console.error("Error:", error);
    updateStatus(message);
    disableSpinner();
    table.rebuildSections(viewModel);
}

function eventListener(event: MessageEvent): void {
    if (!event || event.origin !== Poster.site()) return;

    if (event.data) {
        switch (event.data.eventName) {
            case "showError":
                showError(JSON.parse(event.data.data.error), event.data.data.message);
                break;
            case "updateStatus":
                updateStatus(event.data.data);
                break;
            case "renderItem": {
                // data is always [headers, SimpleRuleSet, AndRuleSet]
                const headersString = event.data.data[0];
                renderItem(headersString);
                break;
            }
        }
    }
}

// This function is run when the app is ready to start interacting with the host application.
// It ensures the DOM is ready before updating the span elements with values from the current message.
document.addEventListener("DOMContentLoaded", function() {
    try {
        viewModel = new HeaderModel();
        table = new Table();
        table.initializeTableUI(viewModel);
        updateStatus(mhaStrings.mhaLoading);
        window.addEventListener("message", eventListener, false);
        Poster.postMessageToParent("frameActive");
    }
    catch (e) {
        postError(e, "Failed initializing frame");
        showError(e, "Failed initializing frame");
    }
});
