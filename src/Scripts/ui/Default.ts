// 🎯 PAGE IDENTIFICATION LOGGING
console.log("🎯 SCRIPT LOADED: Default.ts (Default.html, DefaultPhone.html, DefaultTablet.html)");
console.log("🎯 PAGE TYPE: Default/Classic UI Handler");
console.log("🎯 DESCRIPTION: Classic table-based email header analysis");

import $ from "jquery";

import { HeaderModel } from "../HeaderModel";
import { mhaStrings } from "../mhaStrings";
import { initializeTableUI, onResize, rebuildSections, rebuildTables, recalculateVisibility } from "../table/Table";

export let viewModel: HeaderModel | null = null;
let simpleRuleSet: unknown[] = [];
let andRuleSet: unknown[] = [];

// This function is run when the app is ready to start interacting with the host application.
// It ensures the DOM is ready before updating the span elements with values from the current message.
$(document).ready(function () {
    try {
        $(window).resize(onResize);
        viewModel = new HeaderModel();
        initializeTableUI();
        updateStatus(mhaStrings.mhaLoading);
        window.addEventListener("message", eventListener, false);
        postMessageToParent("frameActive", undefined);
    }
    catch (e) {
        logError(e, "Failed initializing frame");
        showError(e, "Failed initializing frame");
    }
});

function site() { return window.location.protocol + "//" + window.location.host; }

export function postMessageToParent(eventName: string, data?: unknown) {
    window.parent.postMessage({ eventName: eventName, data: data }, site());
}

function eventListener(event: MessageEvent) {
    if (!event || event.origin !== site()) return;

    if (event.data) {
        switch (event.data.eventName) {
            case "showError":
                showError(JSON.parse(event.data.data.error), event.data.data.message);
                break;
            case "updateStatus":
                updateStatus(event.data.data);
                break;
            case "renderItem":

                if (Array.isArray(event.data.data)) {
                    simpleRuleSet = event.data.data[1];
                    andRuleSet = event.data.data[2];
                    renderItem(event.data.data[0]);
                }
                else {
                    simpleRuleSet = [];
                    andRuleSet = [];
                    renderItem(event.data.data);
                }
                break;
        }
    }
}

function logError(error: unknown, message: string) {
    postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function enableSpinner() {
    $("#response").css("background-image", "url(/Resources/loader.gif)");
    $("#response").css("background-repeat", "no-repeat");
    $("#response").css("background-position", "center");
}

function disableSpinner() {
    $("#response").css("background", "none");
}

function hideStatus() {
    disableSpinner();
}

function updateStatus(statusText: string) {
    enableSpinner();
    $("#status").text(statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    recalculateVisibility();
}

function renderItem(headers: string) {
    updateStatus(mhaStrings.mhaFoundHeaders);
    $("#originalHeaders").text(headers);
    viewModel = new HeaderModel(headers);
    rebuildTables();
    hideStatus();
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling LogError
function showError(error: unknown, message: string) {
    updateStatus(message);
    disableSpinner();
    rebuildSections();
}