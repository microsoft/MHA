if (window.jQuery) {
    $(document).ready(function () {
        $(window).resize(onResize);
        initViewModels();
        makeResizablePane("inputHeaders", ImportedStrings.mha_prompt, null, null);
    });
}

// Do our best at recognizing RFC 2822 headers:
// http://tools.ietf.org/html/rfc2822
function analyzeHeaders() {
    // Can't do anything without jquery
    if (!window.jQuery) { return; }
    viewModel.resetView();

    updateStatus(ImportedStrings.mha_loading);

    parseHeadersToTables($("#inputHeaders").val());
}

function clearHeaders() {
    $("#inputHeaders").val("");

    viewModel.resetView();
    rebuildSections();
    recalculateLayout(true);
}