/* global $ */
/* global HeaderModel */
/* global ImportedStrings */
/* global mapHeaderToURL */

// This is the "new" UI rendered in newDesktopFrame.html

var overlay = null;
var spinner = null;
var viewModel = null;

$(document).ready(function () {
    try {
        viewModel = new HeaderModel();
        initializeFabric();
        updateStatus(ImportedStrings.mha_loading);
        window.addEventListener("message", eventListener, false);
        postMessageToParent("frameActive");
    }
    catch (e) {
        PostError(e, "Failed initializing frame");
        showError(e, "Failed initializing frame");
    }
});

function site() { return window.location.protocol + "//" + window.location.host; }

function postMessageToParent(eventName, data) {
    window.parent.postMessage({ eventName: eventName, data: data }, site());
}

function eventListener(event) {
    if (!event || event.origin !== site()) return;

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

function PostError(error, message) {
    postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFabric() {
    var overlayComponent = document.querySelector(".ms-Overlay");
    // Override click so user can't dismiss overlay
    overlayComponent.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    });
    overlay = new window.fabric["Overlay"](overlayComponent);

    var spinnerElement = document.querySelector(".ms-Spinner");
    spinner = new window.fabric["Spinner"](spinnerElement);
    spinner.stop();

    var commandBarElements = document.querySelectorAll(".ms-CommandBar");
    var i;
    for (i = 0; i < commandBarElements.length; i++) {
        new window.fabric["CommandBar"](commandBarElements[i]);
    }

    var commandButtonElements = document.querySelectorAll(".ms-CommandButton");
    for (i = 0; i < commandButtonElements.length; i++) {
        new window.fabric["CommandButton"](commandButtonElements[i]);
    }

    var buttonElement = document.querySelector("#orig-header-btn");
    new window.fabric["Button"](buttonElement, function () {
        var btnIcon = $(this).find(".ms-Icon");
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
        var content = $(this).attr("data-content");
        // Hide sub-views
        $(".header-view").hide();
        $(".header-view[data-content='" + content + "']").show();
    });
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
    updateStatus(ImportedStrings.mha_loading);
    viewModel = new HeaderModel(headers);
    buildViews();
    hideStatus();
}

function buildViews() {
    // Build summary view
    var summaryList = $(".summary-list");
    var headerVal;
    var pre;
    var i;
    for (i = 0; i < viewModel.summary.summaryRows.length; i++) {
        if (viewModel.summary.summaryRows[i].get()) {
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
                .text(viewModel.summary.summaryRows[i].get())
                .appendTo(pre);
        }
    }

    // Save original headers and show ui
    $("#original-headers code").text(viewModel.originalHeaders);
    if (viewModel.originalHeaders) {
        $(".orig-header-ui").show();
    }

    // Build received view
    var receivedList = $(".received-list");

    if (viewModel.receivedHeaders.receivedRows.length > 0) {
        var list = $("<ul/>")
            .addClass("ms-List")
            .appendTo(receivedList);

        for (i = 0; i < viewModel.receivedHeaders.receivedRows.length; i++) {

            var listItem = $("<li/>")
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
                var wrap = $("<div/>")
                    .addClass("progress-icon")
                    .appendTo(listItem);

                var iconbox = $("<div/>")
                    .addClass("ms-font-xxl")
                    .addClass("down-icon")
                    .appendTo(wrap);

                $("<i/>")
                    .addClass("ms-Icon")
                    .addClass("ms-Icon--Down")
                    .appendTo(iconbox);

                var delay = $("<div/>")
                    .addClass("ms-ProgressIndicator")
                    .appendTo(wrap);

                var bar = $("<div/>")
                    .addClass("ms-ProgressIndicator-itemProgress")
                    .appendTo(delay);

                $("<div/>")
                    .addClass("ms-ProgressIndicator-progressTrack")
                    .appendTo(bar);

                var width = 1.8 * viewModel.receivedHeaders.receivedRows[i].percent;

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
            var callout = $("<div/>")
                .addClass("ms-Callout is-hidden")
                .appendTo(listItem);

            var calloutMain = $("<div/>")
                .addClass("ms-Callout-main")
                .appendTo(callout);

            var calloutHeader = $("<div/>")
                .addClass("ms-Callout-header")
                .appendTo(calloutMain);

            $("<p/>")
                .addClass("ms-Callout-title")
                .text("Hop Details")
                .appendTo(calloutHeader);

            var calloutInner = $("<div/>")
                .addClass("ms-Callout-inner")
                .appendTo(calloutMain);

            var calloutContent = $("<div/>")
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
    var antispamList = $(".antispam-list");

    // Forefront
    var tbody;
    var table;
    var row;
    var linkVal;
    if (viewModel.forefrontAntiSpamReport.rows().length > 0) {
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
        for (i = 0; i < viewModel.forefrontAntiSpamReport.rows().length; i++) {
            if (viewModel.forefrontAntiSpamReport.rows()[i].get()) {
                row = $("<tr/>").appendTo(tbody);
                $("<td/>")
                    .text(viewModel.forefrontAntiSpamReport.rows()[i].label)
                    .appendTo(row);
                linkVal = mapHeaderToURL(viewModel.forefrontAntiSpamReport.rows()[i].url,
                    viewModel.forefrontAntiSpamReport.rows()[i].get());
                $("<td/>")
                    .html(linkVal)
                    .appendTo(row);
            }
        }
    }

    // Microsoft
    if (viewModel.antiSpamReport.rows().length > 0) {
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
        for (i = 0; i < viewModel.antiSpamReport.rows().length; i++) {
            if (viewModel.antiSpamReport.rows()[i].get()) {
                row = $("<tr/>").appendTo(tbody);
                $("<td/>")
                    .text(viewModel.antiSpamReport.rows()[i].label)
                    .appendTo(row);
                linkVal = mapHeaderToURL(viewModel.antiSpamReport.rows()[i].url,
                    viewModel.antiSpamReport.rows()[i].get());
                $("<td/>")
                    .html(linkVal)
                    .appendTo(row);
            }
        }
    }

    // Build other view
    var otherList = $(".other-list");

    for (i = 0; i < viewModel.otherHeaders.otherRows.length; i++) {
        if (viewModel.otherHeaders.otherRows[i].value) {
            var headerName = $("<div/>")
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
    var listElements = document.querySelectorAll(".ms-List");
    for (i = 0; i < listElements.length; i++) {
        new window.fabric["List"](listElements[i]);
    }

    var listItemElements = document.querySelectorAll(".ms-ListItem");
    for (i = 0; i < listItemElements.length; i++) {
        new window.fabric["ListItem"](listItemElements[i]);

        // Init corresponding callout
        var calloutElement = listItemElements[i].querySelector(".ms-Callout");
        new window.fabric["Callout"](calloutElement, listItemElements[i], "right");
    }
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

function updateStatus(message) {
    $(".status-message").text(message);
    overlay.show();
    spinner.start();
}

function hideStatus() {
    spinner.stop();
    overlay.hide();
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling PostError
function showError(error, message) {
    $("#error-display .ms-MessageBar-text").text(message);
    $("#error-display").show();
}