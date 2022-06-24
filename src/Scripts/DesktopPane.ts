import "office-ui-fabric-js/dist/css/fabric.min.css"
import "office-ui-fabric-js/dist/css/fabric.components.min.css"
import "../Content/DesktopPane.css";
import * as $ from "jquery";
import { fabric } from "./fabric"
import { mhaStrings } from "./Strings";
import { HeaderModel } from "./Headers"
import { poster } from "./poster";

// This is the "new" UI rendered in newDesktopFrame.html

(function () {
    let overlay = null;
    let spinner = null;

    function postError(error, message) {
        poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
    }

    function initializeFabric() {
        const overlayComponent = document.querySelector(".ms-Overlay");
        // Override click so user can't dismiss overlay
        overlayComponent.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        });
        overlay = new fabric["Overlay"](overlayComponent);

        const spinnerElement = document.querySelector(".ms-Spinner");
        spinner = new fabric["Spinner"](spinnerElement);
        spinner.stop();

        const commandBarElements = document.querySelectorAll(".ms-CommandBar");
        let i;
        for (i = 0; i < commandBarElements.length; i++) {
            new fabric["CommandBar"](commandBarElements[i]);
        }

        const commandButtonElements = document.querySelectorAll(".ms-CommandButton");
        for (i = 0; i < commandButtonElements.length; i++) {
            new fabric["CommandButton"](commandButtonElements[i]);
        }

        const buttonElement = document.querySelector("#orig-header-btn");
        new fabric["Button"](buttonElement, function () {
            const btnIcon = $(this).find(".ms-Icon");
            if (btnIcon.hasClass("ms-Icon--Add")) {
                $("#original-headers").show();
                btnIcon.removeClass("ms-Icon--Add").addClass("ms-Icon--Remove");
            } else {
                $("#original-headers").hide();
                btnIcon.removeClass("ms-Icon--Remove").addClass("ms-Icon--Add");
            }
        });

        // Show summary by default
        $(".header-view[data-content='summary-view']").show();

        // Wire up click events for nav buttons
        $("#nav-bar .ms-CommandButton").click(function () {
            // Remove active from current active
            $("#nav-bar .is-active").removeClass("is-active");
            // Add active class to clicked button
            $(this).addClass("is-active");

            // Get content marker
            const content = $(this).attr("data-content");
            // Hide sub-views
            $(".header-view").hide();
            $(".header-view[data-content='" + content + "']").show();
        });
    }

    function updateStatus(message) {
        $(".status-message").text(message);
        overlay.show();
        spinner.start();
    }

    function makeBold(text) {
        return '<span class="ms-fontWeight-semibold">' + text + "</span>";
    }

    function addCalloutEntry(name, value, parent) {
        if (value) {
            $("<p/>")
                .addClass("ms-Callout-subText")
                .html(makeBold(name + ": ") + value)
                .appendTo(parent);
        }
    }

    function buildViews(headers) {
        const viewModel = new HeaderModel(headers);
        // Build summary view
        const summaryList = $(".summary-list");
        let headerVal;
        let pre;
        let i;
        for (i = 0; i < viewModel.summary.summaryRows.length; i++) {
            if (viewModel.summary.summaryRows[i].value) {
                $("<div/>")
                    .addClass("ms-font-s")
                    .addClass("ms-fontWeight-semibold")
                    .text(viewModel.summary.summaryRows[i].label)
                    .appendTo(summaryList);
                headerVal = $("<div/>")
                    .addClass("code-box")
                    .appendTo(summaryList);
                pre = $("<pre/>").appendTo(headerVal);
                $("<code/>")
                    .text(viewModel.summary.summaryRows[i].value)
                    .appendTo(pre);
            }
        }

        // Save original headers and show ui
        $("#original-headers code").text(viewModel.originalHeaders);
        if (viewModel.originalHeaders) {
            $(".orig-header-ui").show();
        }

        // Build received view
        const receivedList = $(".received-list");

        if (viewModel.receivedHeaders.receivedRows.length > 0) {
            const list = $("<ul/>")
                .addClass("ms-List")
                .appendTo(receivedList);

            for (i = 0; i < viewModel.receivedHeaders.receivedRows.length; i++) {

                const listItem = $("<li/>")
                    .addClass("ms-ListItem")
                    .addClass("ms-ListItem--document")
                    .appendTo(list);

                if (i === 0) {
                    $("<span/>")
                        .addClass("ms-ListItem-primaryText")
                        .html(makeBold("From: ") + viewModel.receivedHeaders.receivedRows[i].from)
                        .appendTo(listItem);

                    $("<span/>")
                        .addClass("ms-ListItem-secondaryText")
                        .html(makeBold("To: ") + viewModel.receivedHeaders.receivedRows[i].by)
                        .appendTo(listItem);
                } else {
                    const wrap = $("<div/>")
                        .addClass("progress-icon")
                        .appendTo(listItem);

                    const iconbox = $("<div/>")
                        .addClass("ms-font-xxl")
                        .addClass("down-icon")
                        .appendTo(wrap);

                    $("<i/>")
                        .addClass("ms-Icon")
                        .addClass("ms-Icon--Down")
                        .appendTo(iconbox);

                    const delay = $("<div/>")
                        .addClass("ms-ProgressIndicator")
                        .appendTo(wrap);

                    const bar = $("<div/>")
                        .addClass("ms-ProgressIndicator-itemProgress")
                        .appendTo(delay);

                    $("<div/>")
                        .addClass("ms-ProgressIndicator-progressTrack")
                        .appendTo(bar);

                    const width = 1.8 * viewModel.receivedHeaders.receivedRows[i].percent;

                    $("<div/>")
                        .addClass("ms-ProgressIndicator-progressBar")
                        .css("width", width)
                        .appendTo(bar);

                    $("<div/>")
                        .addClass("ms-ProgressIndicator-itemDescription")
                        .text(viewModel.receivedHeaders.receivedRows[i].delay)
                        .appendTo(delay);

                    $("<span/>")
                        .addClass("ms-ListItem-secondaryText")
                        .html(makeBold("To: ") + viewModel.receivedHeaders.receivedRows[i].by)
                        .appendTo(listItem);
                }

                $("<div/>")
                    .addClass("ms-ListItem-selectionTarget")
                    .appendTo(listItem);

                // Callout
                const callout = $("<div/>")
                    .addClass("ms-Callout is-hidden")
                    .appendTo(listItem);

                const calloutMain = $("<div/>")
                    .addClass("ms-Callout-main")
                    .appendTo(callout);

                const calloutHeader = $("<div/>")
                    .addClass("ms-Callout-header")
                    .appendTo(calloutMain);

                $("<p/>")
                    .addClass("ms-Callout-title")
                    .text("Hop Details")
                    .appendTo(calloutHeader);

                const calloutInner = $("<div/>")
                    .addClass("ms-Callout-inner")
                    .appendTo(calloutMain);

                const calloutContent = $("<div/>")
                    .addClass("ms-Callout-content")
                    .appendTo(calloutInner);

                addCalloutEntry("From", viewModel.receivedHeaders.receivedRows[i].from, calloutContent);
                addCalloutEntry("To", viewModel.receivedHeaders.receivedRows[i].by, calloutContent);
                addCalloutEntry("Time", viewModel.receivedHeaders.receivedRows[i].date, calloutContent);
                addCalloutEntry("Type", viewModel.receivedHeaders.receivedRows[i].with, calloutContent);
                addCalloutEntry("ID", viewModel.receivedHeaders.receivedRows[i].id, calloutContent);
                addCalloutEntry("For", viewModel.receivedHeaders.receivedRows[i].for, calloutContent);
                addCalloutEntry("Via", viewModel.receivedHeaders.receivedRows[i].via, calloutContent);
            }
        }

        // Build antispam view
        const antispamList = $(".antispam-list");

        // Forefront
        let tbody;
        let table;
        let row;
        if (viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length > 0) {
            $("<div/>")
                .addClass("ms-font-m")
                .text("Forefront Antispam Report")
                .appendTo(antispamList);

            $("<hr/>").appendTo(antispamList);
            table = $("<table/>")
                .addClass("ms-Table")
                .addClass("ms-Table--fixed")
                .addClass("spam-report")
                .appendTo(antispamList);
            tbody = $("<tbody/>")
                .appendTo(table);
            for (i = 0; i < viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length; i++) {
                if (viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i].value) {
                    row = $("<tr/>").appendTo(tbody);
                    $("<td/>")
                        .text(viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i].label)
                        .appendTo(row);
                    $("<td/>")
                        .html(viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i].valueUrl)
                        .appendTo(row);
                }
            }
        }

        // Microsoft
        if (viewModel.antiSpamReport.antiSpamRows.length > 0) {
            $("<div/>")
                .addClass("ms-font-m")
                .text("Microsoft Antispam Report")
                .appendTo(antispamList);

            $("<hr/>").appendTo(antispamList);
            table = $("<table/>")
                .addClass("ms-Table")
                .addClass("ms-Table--fixed")
                .addClass("spam-report")
                .appendTo(antispamList);
            tbody = $("<tbody/>")
                .appendTo(table);
            for (i = 0; i < viewModel.antiSpamReport.antiSpamRows.length; i++) {
                if (viewModel.antiSpamReport.antiSpamRows[i].value) {
                    row = $("<tr/>").appendTo(tbody);
                    $("<td/>")
                        .text(viewModel.antiSpamReport.antiSpamRows[i].label)
                        .appendTo(row);
                    $("<td/>")
                        .html(viewModel.antiSpamReport.antiSpamRows[i].valueUrl)
                        .appendTo(row);
                }
            }
        }

        // Build other view
        const otherList = $(".other-list");

        for (i = 0; i < viewModel.otherHeaders.otherRows.length; i++) {
            if (viewModel.otherHeaders.otherRows[i].value) {
                const headerName = $("<div/>")
                    .addClass("ms-font-s")
                    .addClass("ms-fontWeight-semibold")
                    .text(viewModel.otherHeaders.otherRows[i].header)
                    .appendTo(otherList);
                if (viewModel.otherHeaders.otherRows[i].url) {
                    headerName.html(viewModel.otherHeaders.otherRows[i].url);
                }
                headerVal = $("<div/>")
                    .addClass("code-box")
                    .appendTo(otherList);
                pre = $("<pre/>").appendTo(headerVal);
                $("<code/>")
                    .text(viewModel.otherHeaders.otherRows[i].value)
                    .appendTo(pre);
            }
        }

        // Initialize any fabric lists added
        const listElements = document.querySelectorAll(".ms-List");
        for (i = 0; i < listElements.length; i++) {
            new fabric["List"](listElements[i]);
        }

        const listItemElements = document.querySelectorAll(".ms-ListItem");
        for (i = 0; i < listItemElements.length; i++) {
            new fabric["ListItem"](listItemElements[i]);

            // Init corresponding callout
            const calloutElement = listItemElements[i].querySelector(".ms-Callout");
            new fabric["Callout"](calloutElement, listItemElements[i], "right");
        }
    }

    function hideStatus() {
        spinner.stop();
        overlay.hide();
    }

    function renderItem(headers) {
        // Empty data
        $(".summary-list").empty();
        $("#original-headers code").empty();
        $(".orig-header-ui").hide();
        $(".received-list").empty();
        $(".antispam-list").empty();
        $(".other-list").empty();
        $("#error-display .ms-MessageBar-text").empty();
        $("#error-display").hide();

        // Load new itemDescription
        updateStatus(mhaStrings.mhaLoading);
        buildViews(headers);
        hideStatus();
    }

    // Handles rendering of an error.
    // Does not log the error - caller is responsible for calling PostError
    function showError(error, message) {
        $("#error-display .ms-MessageBar-text").text(message);
        $("#error-display").show();
    }

    function eventListener(event) {
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

    $(document).ready(function () {
        try {
            initializeFabric();
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