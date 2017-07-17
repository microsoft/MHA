// This function is run when the app is ready to start interacting with the host application.
// It ensures the DOM is ready before updating the span elements with values from the current message.
Office.initialize = function () {
    $(document).ready(function () {
        $(window).resize(onResize);
        initViewModels();
        showDiagnostics();
        updateStatus(ImportedStrings.mha_loading);
        sendHeadersRequest();
    });
};

function enableSpinner() {
    $("#response").css("background-image", "url(../Resources/loader.gif)");
    $("#response").css("background-repeat", "no-repeat");
    $("#response").css("background-position", "center");
}

function disableSpinner() {
    $("#response").css("background", "none");
}

function hideStatus() {
    disableSpinner();
}

function updateStatus(statusText) {
    enableSpinner();
    $("#status").text(statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    positionResponse();
    recalculateVisibility();
}

function getHeadersComplete(headers) {
    updateStatus(ImportedStrings.mha_foundHeaders);
    $("#originalHeaders").text(headers);
    parseHeadersToTables(headers);
}

function showError(message) {
    updateStatus(message);
    disableSpinner();
    rebuildSections();
}

function showDiagnostics() {
    viewModel.diagnostics = getDiagnostics();
    $("#diagnostics").text(viewModel.diagnostics);
}