import "../Content/Office.css";
import "../Content/App.css";
import * as $ from "jquery";
import { mhaStrings } from "./mhaStrings";
import { HeaderModel } from "./Headers"
import { Table } from "./Table";
import { poster } from "./poster";

// This is the "classic" UI rendered in classicDesktopFrame.html

(function () {
    let viewModel: HeaderModel = null;
    let table: Table = null; 

    function postError(error, message: string): void {
        poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
    }

    function enableSpinner(): void {
        $("#response").css("background-image", "url(../Resources/loader.gif)");
        $("#response").css("background-repeat", "no-repeat");
        $("#response").css("background-position", "center");
    }

    function disableSpinner(): void {
        $("#response").css("background", "none");
    }

    function updateStatus(statusText: string): void {
        enableSpinner();
        $("#status").text(statusText);
        if (viewModel !== null) {
            viewModel.status = statusText;
        }

        table.recalculateVisibility();
    }

    function renderItem(headers) {
        updateStatus(mhaStrings.mhaFoundHeaders);
        $("#originalHeaders").text(headers);
        viewModel = new HeaderModel(headers);
        table.rebuildTables(viewModel);
        updateStatus("");
        disableSpinner();
    }

    // Handles rendering of an error.
    // Does not log the error - caller is responsible for calling PostError
    function showError(error, message: string) {
        updateStatus(message);
        disableSpinner();
        table.rebuildSections(viewModel);
    }

    function eventListener(event): void {
        if (!event || event.origin !== poster.site()) return;

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

    // This function is run when the app is ready to start interacting with the host application.
    // It ensures the DOM is ready before updating the span elements with values from the current message.
    $(document).ready(function (): void {
        try {
            viewModel = new HeaderModel();
            table = new Table();
            table.initializeTableUI(viewModel);
            updateStatus(mhaStrings.mhaLoading);
            window.addEventListener("message", eventListener, false);
            poster.postMessageToParent("frameActive");
        }
        catch (e) {
            postError(e, "Failed initializing frame");
            showError(e, "Failed initializing frame");
        }
    });
})();