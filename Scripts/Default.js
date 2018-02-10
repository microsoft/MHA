﻿var viewModel = null;
var Office = null;

// This function is run when the app is ready to start interacting with the host application.
// It ensures the DOM is ready before updating the span elements with values from the current message.
$(document).ready(function () {
    Office = window.parent.getOffice();
    $(window).resize(onResize);
    viewModel = new HeaderModel();
    registerItemChangeEvent();
    initializeTableUI();
    showDiagnostics();
    updateStatus(ImportedStrings.mha_loading);
    sendHeadersRequest();
});

function registerItemChangeEvent() {
    try {
        if (Office.context.mailbox.addHandlerAsync !== undefined) {
            Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, loadNewItem);
        }
    } catch (e) {
        showError("Could not register item change event");
    }
}

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

function showError(message) {
    viewModel.errors.push(message);
    updateStatus(message);
    disableSpinner();
    rebuildSections();
}

function showDiagnostics() {
    viewModel.diagnostics = getDiagnostics();
    $("#diagnostics").text(viewModel.diagnostics);
}