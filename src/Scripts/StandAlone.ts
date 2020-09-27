import * as $ from "jquery";
/* global appInsights */
import { mhaStrings } from "./Strings";
import { HeaderModel } from "./Headers";
import { Diagnostics } from "./diag";
import { Table } from "./Table";

"use strict";
console.log("Loaded standalone.js")

let viewModel = null;

function enableSpinner() {
    $("#response").css("background-image", "url(/Resources/loader.gif)");
    $("#response").css("background-repeat", "no-repeat");
    $("#response").css("background-position", "center");
}

function disableSpinner() {
    $("#response").css("background", "none");
}

function updateStatus(statusText) {
    $("#status").text(statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    Table.recalculateVisibility();
}

// Do our best at recognizing RFC 2822 headers:
// http://tools.ietf.org/html/rfc2822
function analyze() {
    // Can't do anything without jQuery
    if (!$) return;
    if (appInsights) appInsights.trackEvent("analyzeHeaders");
    viewModel = HeaderModel($("#inputHeaders").val());
    Table.resetArrows();

    enableSpinner();
    updateStatus(mhaStrings.mhaLoading);

    Table.rebuildTables(viewModel);
    updateStatus("");

    disableSpinner();
}

function clear() {
    $("#inputHeaders").val("");

    viewModel = HeaderModel();
    Table.resetArrows();
    Table.rebuildSections(viewModel);
}

function copy() {
    mhaStrings.copyToClipboard(viewModel.toString());
}

console.log("Setting up UI")
if ($) {
    $(document).ready(function () {
        console.log("Inside ready")
        Diagnostics.set("API used", "standalone");
        viewModel = HeaderModel();
        Table.initializeTableUI(viewModel);
        Table.makeResizablePane("inputHeaders", mhaStrings.mhaPrompt, null);

        document.querySelector("#analyzeButton").onclick = analyze;
        document.querySelector("#clearButton").onclick = clear;
        document.querySelector("#copyButton").onclick = copy;
        console.log("Finished ready")
    });
}