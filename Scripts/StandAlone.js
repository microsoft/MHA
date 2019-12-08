/* global $ */
/* global mhaStrings */
/* global HeaderModel */
/* global initializeTableUI */
/* global makeResizablePane */
/* global rebuildTables */
/* global rebuildSections */
/* global recalculateVisibility */
/* global setArrows */
/* global Diagnostics */
/* global appInsights */
/* exported analyzeHeaders */
/* exported clearHeaders */

var viewModel = null;

if (window.jQuery) {
    $(document).ready(function () {
        Diagnostics.set("API used", "standalone");
        viewModel = HeaderModel();
        initializeTableUI();
        makeResizablePane("inputHeaders", mhaStrings.mha_prompt, null);
    });
}

// Do our best at recognizing RFC 2822 headers:
// http://tools.ietf.org/html/rfc2822
function analyzeHeaders() {
    // Can't do anything without jquery
    if (!window.jQuery) { return; }
    if (appInsights) appInsights.trackEvent("analyzeHeaders");
    viewModel = HeaderModel($("#inputHeaders").val());
    setArrows(viewModel.receivedHeaders.tableName, "hop", 1);
    setArrows(viewModel.otherHeaders.tableName, "number", 1);

    enableSpinner();
    updateStatus(mhaStrings.mha_loading);

    rebuildTables();

    disableSpinner();
}

function clearHeaders() {
    $("#inputHeaders").val("");

    viewModel = HeaderModel();
    setArrows(viewModel.receivedHeaders.tableName, "hop", 1);
    setArrows(viewModel.otherHeaders.tableName, "number", 1);
    rebuildSections();
}

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

    recalculateVisibility();
}
