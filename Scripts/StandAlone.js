/* global $ */
/* global HeaderModel */
/* global ImportedStrings */
/* global initializeTableUI */
/* global makeResizablePane */
/* global rebuildTables */
/* global rebuildSections */
/* global recalculateVisibility */
/* global setArrows */
/* exported analyzeHeaders */
/* exported clearHeaders */
/* global appInsights */

var viewModel = null;

if (window.jQuery) {
    $(document).ready(function () {
        viewModel = new HeaderModel();
        initializeTableUI();
        makeResizablePane("inputHeaders", ImportedStrings.mha_prompt, null);
    });
}

// Do our best at recognizing RFC 2822 headers:
// http://tools.ietf.org/html/rfc2822
function analyzeHeaders() {
    // Can't do anything without jquery
    if (!window.jQuery) { return; }
    if (appInsights) appInsights.trackEvent("analyzeHeaders");
    viewModel = new HeaderModel($("#inputHeaders").val());
    setArrows(viewModel.receivedHeaders.tableName, "hop", 1);
    setArrows(viewModel.otherHeaders.tableName, "number", 1);

    enableSpinner();
    updateStatus(ImportedStrings.mha_loading);

    rebuildTables();

    disableSpinner();
}

function clearHeaders() {
    $("#inputHeaders").val("");

    viewModel = new HeaderModel();
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
