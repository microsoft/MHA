/* global $ */
/* global appInsights */
/* global mhaStrings */
/* global HeaderModel */
/* global Diagnostics */
/* global Table */
/* exported StandAlone */

var StandAlone = (function () {
    var viewModel = null;

    if (window.jQuery) {
        $(document).ready(function () {
            Diagnostics.set("API used", "standalone");
            viewModel = HeaderModel();
            Table.initializeTableUI(viewModel);
            Table.makeResizablePane("inputHeaders", mhaStrings.mha_prompt, null);
        });
    }

    // Do our best at recognizing RFC 2822 headers:
    // http://tools.ietf.org/html/rfc2822
    function analyze() {
        // Can't do anything without jQuery
        if (!window.jQuery) return;
        if (appInsights) appInsights.trackEvent("analyzeHeaders");
        viewModel = HeaderModel($("#inputHeaders").val());
        Table.resetArrows();

        enableSpinner();
        updateStatus(mhaStrings.mha_loading);

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

    return {
        analyze: analyze,
        clear: clear
    }
})();