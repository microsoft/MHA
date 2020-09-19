/* global $ */
/* global mhaStrings  */
/* global HeaderModel */
/* global Table */
/* global message */

// This is the "classic" UI rendered in classicDesktopFrame.html

(function () {
    "use strict";

    var viewModel = null;
    // This function is run when the app is ready to start interacting with the host application.
    // It ensures the DOM is ready before updating the span elements with values from the current message.
    $(document).ready(function () {
        try {
            viewModel = HeaderModel();
            Table.initializeTableUI(viewModel);
            updateStatus(mhaStrings.mha_loading);
            window.addEventListener("message", eventListener, false);
            message.postMessageToParent("frameActive");
        }
        catch (e) {
            postError(e, "Failed initializing frame");
            showError(e, "Failed initializing frame");
        }
    });

    function eventListener(event) {
        if (!event || event.origin !== message.site()) return;

        if (event.data) {
            switch (event.data.eventName) {
                case "showError":
                    showError(JSON.parse(event.data.data.error), event.data.data.message);
                    break;
                case "updateStatus":
                    updateStatus(event.data.data);
                    break;
                case "renderItem":
                    renderItem(event.data.data);
                    break;
            }
        }
    }

    function postError(error, message) {
        message.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
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
        enableSpinner();
        $("#status").text(statusText);
        if (viewModel !== null) {
            viewModel.status = statusText;
        }

        Table.recalculateVisibility();
    }

    function renderItem(headers) {
        updateStatus(mhaStrings.mha_foundHeaders);
        $("#originalHeaders").text(headers);
        viewModel = HeaderModel(headers);
        Table.rebuildTables(viewModel);
        updateStatus("");
        disableSpinner();
    }

    // Handles rendering of an error.
    // Does not log the error - caller is responsible for calling PostError
    function showError(error, message) {
        updateStatus(message);
        disableSpinner();
        Table.rebuildSections(viewModel);
    }
})();