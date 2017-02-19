// This function is run when the app is ready to start interacting with the host application.
// It ensures the DOM is ready before updating the span elements with values from the current message.
Office.initialize = function () {
    $(document).ready(function () {
        $(window).resize(onResize);
        initViewModels();
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

function getHeadersComplete(headers) {
    updateStatus(ImportedStrings.mha_foundHeaders);
    $("#originalHeaders").text(headers);
    parseHeadersToTables(headers);
}

function showError(error, details) {
    disableSpinner();
    updateStatus(error);
    viewModel.originalHeaders = details;
    rebuildSections();
}