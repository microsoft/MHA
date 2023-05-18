import "office-ui-fabric-js/dist/css/fabric.min.css"
import "office-ui-fabric-js/dist/css/fabric.components.min.css"
import "../Content/Office.css";
import "../Content/App.css";
import * as $ from "jquery";
import { mhaStrings } from "./mhaStrings";
import { strings } from "./Strings";
import { HeaderModel } from "./Headers"
import { Diagnostics } from "./diag";
import { Table } from "./Table"

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
    Diagnostics.trackEvent({ name: "analyzeHeaders" });
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
}

function copy() {
    strings.copyToClipboard(viewModel.toString());
}

if ($) {
    $(function() {
        Diagnostics.set("API used", "standalone");
        viewModel = new HeaderModel();
        table = new Table();
        table.initializeTableUI(viewModel);
        table.makeResizablePane("inputHeaders", mhaStrings.mhaPrompt, () => true);

        (document.querySelector("#analyzeButton") as HTMLButtonElement).onclick = analyze;
        (document.querySelector("#clearButton") as HTMLButtonElement).onclick = clear;
        (document.querySelector("#copyButton") as HTMLButtonElement).onclick = copy;
    });
}