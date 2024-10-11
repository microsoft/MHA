import "office-ui-fabric-js/dist/css/fabric.min.css";
import "office-ui-fabric-js/dist/css/fabric.components.min.css";
import "../Content/fabric.css";
import "../Content/Office.css";
import "../Content/classicDesktopFrame.css";
import $ from "jquery";

import { diagnostics } from "./Diag";
import { HeaderModel } from "./HeaderModel";
import { mhaStrings } from "./mhaStrings";
import { Strings } from "./Strings";
import { Table } from "./table/Table";

let viewModel: HeaderModel;
let table: Table;

function enableSpinner() {
    $("#response").css("background-image", "url(../Resources/loader.gif)");
    $("#response").css("background-repeat", "no-repeat");
    $("#response").css("background-position", "center");
}

function disableSpinner() {
    $("#response").css("background", "none");
}

function updateStatus(statusText: string) {
    $("#status").text(statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    table.recalculateVisibility();
}

// Do our best at recognizing RFC 2822 headers:
// http://tools.ietf.org/html/rfc2822
function analyze() {
    // Can't do anything without jQuery
    if (!$) return;
    diagnostics.trackEvent({ name: "analyzeHeaders" });
    viewModel = new HeaderModel($("#inputHeaders").val() as string);
    table.resetArrows();

    enableSpinner();
    updateStatus(mhaStrings.mhaLoading);

    table.rebuildTables(viewModel);
    updateStatus("");

    disableSpinner();
}

function clear() {
    $("#inputHeaders").val("");

    viewModel = new HeaderModel();
    table.resetArrows();
    table.rebuildSections(viewModel);
    document.getElementById("inputHeaders")?.focus();
}

function copy() {
    Strings.copyToClipboard(viewModel.toString());
    document.getElementById("copyButton")?.focus();
}

if ($) {
    $(function() {
        diagnostics.set("API used", "standalone");
        viewModel = new HeaderModel();
        table = new Table();
        table.initializeTableUI(viewModel);
        table.makeResizablePane("inputHeaders", "sectionHeader", mhaStrings.mhaPrompt, () => true);

        (document.querySelector("#analyzeButton") as HTMLButtonElement).onclick = analyze;
        (document.querySelector("#clearButton") as HTMLButtonElement).onclick = clear;
        (document.querySelector("#copyButton") as HTMLButtonElement).onclick = copy;
    });
}
