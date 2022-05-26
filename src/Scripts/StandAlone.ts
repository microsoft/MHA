import "office-ui-fabric-js/dist/css/fabric.min.css"
import "office-ui-fabric-js/dist/css/fabric.components.min.css"
import "../Content/Office.css";
import "../Content/App.css";
import * as $ from "jquery";
import { appInsights } from "./diag"
import { mhaStrings } from "./Strings";
import { HeaderModel } from "./Headers"
import { Diagnostics } from "./diag"
import { Table } from "./Table"

(function () {
    "use strict";

    let viewModel = null;

    function enableSpinner() {
        $("#response").css("background-image", "url(../Resources/loader.gif)");
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
        if (appInsights) appInsights.trackEvent({ name: "analyzeHeaders" });
        // @ts-ignore TODO Fix this
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

    if ($) {
        $(document).ready(function () {
            Diagnostics.set("API used", "standalone");
            viewModel = HeaderModel();
            Table.initializeTableUI(viewModel);
            Table.makeResizablePane("inputHeaders", mhaStrings.mhaPrompt, null);

            // @ts-ignore TODO Fix this
            document.querySelector("#analyzeButton").onclick = analyze;
            // @ts-ignore TODO Fix this
            document.querySelector("#clearButton").onclick = clear;
            // @ts-ignore TODO Fix this
            document.querySelector("#copyButton").onclick = copy;
        });
    }

    return;
})();