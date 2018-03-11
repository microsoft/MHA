var viewModel = null;
var Office = null;
var LogError = null;

// This function is run when the app is ready to start interacting with the host application.
// It ensures the DOM is ready before updating the span elements with values from the current message.
$(document).ready(function () {
    Office = window.parent.Office;
    LogError = window.parent.LogError;
    window.parent.SetLoadItemEvent(loadNewItem);
    $(window).resize(onResize);
    viewModel = new HeaderModel();
    initializeTableUI();
    updateStatus(ImportedStrings.mha_loading);
    sendHeadersRequest();
});

function loadNewItem() {
    viewModel = new HeaderModel();

    updateStatus(ImportedStrings.mha_loading);
    sendHeadersRequest();
}

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

    recalculateVisibility();
}

function getHeadersComplete(headers) {
    updateStatus(ImportedStrings.mha_foundHeaders);
    $("#originalHeaders").text(headers);
    parseHeadersToTables(headers);
}

function showError(error, message) {
    LogError(error, message);
    updateStatus(message);
    disableSpinner();
    rebuildSections();
}