import "office-ui-fabric-js/dist/css/fabric.min.css"
import "office-ui-fabric-js/dist/css/fabric.components.min.css"
import "../Content/DesktopPane.css";
import * as $ from "jquery";
import { fabric } from "./fabric"
import { mhaStrings } from "./mhaStrings";
import { HeaderModel } from "./Headers"
import { poster } from "./poster";
import { Row, SummaryRow } from "./Summary";
import { ReceivedRow } from "./Received";
import { OtherRow } from "./Other";

// This is the "new" UI rendered in newDesktopFrame.html

let overlay: typeof fabric.Overlay = null;
let spinner: typeof fabric.Spinner = null;

function postError(error: any, message: string): void {
    poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFabric(): void {
    const overlayComponent: Element | null = document.querySelector(".ms-Overlay");
    if (overlayComponent) {
        // Override click so user can't dismiss overlay
        overlayComponent.addEventListener("click", function (e: Event): void {
            e.preventDefault();
            e.stopImmediatePropagation();
        });
        overlay = new fabric["Overlay"](overlayComponent);
    }

    const spinnerElement: Element | null = document.querySelector(".ms-Spinner");
    spinner = new fabric["Spinner"](spinnerElement);
    spinner.stop();

    const commandBarElements: NodeListOf<Element> = document.querySelectorAll(".ms-CommandBar");
    for (let i: number = 0; i < commandBarElements.length; i++) {
        new fabric["CommandBar"](commandBarElements[i]);
    }

    const commandButtonElements: NodeListOf<Element> = document.querySelectorAll(".ms-CommandButton");
    for (let i: number = 0; i < commandButtonElements.length; i++) {
        new fabric["CommandButton"](commandButtonElements[i]);
    }

    const buttonElement: Element | null = document.querySelector("#orig-header-btn");
    new fabric["Button"](buttonElement, function (event: PointerEvent): void {
        if (event.currentTarget) {
            const btnIcon: JQuery<HTMLElement> = $(event.currentTarget).find(".ms-Icon");
            if (btnIcon.hasClass("ms-Icon--Add")) {
                $("#original-headers").show();
                btnIcon.removeClass("ms-Icon--Add").addClass("ms-Icon--Remove");
            } else {
                $("#original-headers").hide();
                btnIcon.removeClass("ms-Icon--Remove").addClass("ms-Icon--Add");
            }
        }
    });

    // Show summary by default
    $(".header-view[data-content='summary-view']").show();

    // Wire up click events for nav buttons
    $("#nav-bar .ms-CommandButton").click(function (): void {
        // Remove active from current active
        $("#nav-bar .is-active").removeClass("is-active");
        // Add active class to clicked button
        $(this).addClass("is-active");

        // Get content marker
        const content: string | undefined = $(this).attr("data-content");
        // Hide sub-views
        $(".header-view").hide();
        $(".header-view[data-content='" + content + "']").show();
    });
}

function updateStatus(message: string) {
    $(".status-message").text(message);
    overlay.show();
    spinner.start();
}

function makeBold(text: string) {
    return '<span class="ms-fontWeight-semibold">' + text + "</span>";
}

function addCalloutEntry(name: string, value: string, parent: JQuery<HTMLElement>) {
    if (value) {
        $("<p/>")
            .addClass("ms-Callout-subText")
            .html(makeBold(name + ": ") + value)
            .appendTo(parent);
    }
}

function buildViews(headers: string) {
    const viewModel: HeaderModel = new HeaderModel(headers);
    // Build summary view
    const summaryList = $(".summary-list");
    viewModel.summary.rows.forEach((row: SummaryRow) => {
        if (row.value) {
            $("<div/>")
                .addClass("ms-font-s")
                .addClass("ms-fontWeight-semibold")
                .text(row.label)
                .appendTo(summaryList);
            let headerVal = $("<div/>")
                .addClass("code-box")
                .appendTo(summaryList);
            let pre = $("<pre/>").appendTo(headerVal);
            $("<code/>")
                .text(row.value)
                .appendTo(pre);
        }
    });

    // Save original headers and show ui
    $("#original-headers code").text(viewModel.originalHeaders);
    if (viewModel.originalHeaders) {
        $(".orig-header-ui").show();
    }

    // Build received view
    const receivedList = $(".received-list");

    if (viewModel.receivedHeaders.rows.length > 0) {
        const list = $("<ul/>")
            .addClass("ms-List")
            .appendTo(receivedList);

        let firstRow: boolean = true;
        viewModel.receivedHeaders.rows.forEach((row: ReceivedRow) => {
            const listItem = $("<li/>")
                .addClass("ms-ListItem")
                .addClass("ms-ListItem--document")
                .appendTo(list);

            if (firstRow) {
                $("<span/>")
                    .addClass("ms-ListItem-primaryText")
                    .html(makeBold("From: ") + row.from)
                    .appendTo(listItem);

                $("<span/>")
                    .addClass("ms-ListItem-secondaryText")
                    .html(makeBold("To: ") + row.by)
                    .appendTo(listItem);
                firstRow = false;
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

                const width: number = 1.8 * row.percent.value;

                $("<div/>")
                    .addClass("ms-ProgressIndicator-progressBar")
                    .css("width", width)
                    .appendTo(bar);

                $("<div/>")
                    .addClass("ms-ProgressIndicator-itemDescription")
                    .text(row.delay.value)
                    .appendTo(delay);

                $("<span/>")
                    .addClass("ms-ListItem-secondaryText")
                    .html(makeBold("To: ") + row.by)
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

            const calloutContent: JQuery<HTMLElement> = $("<div/>")
                .addClass("ms-Callout-content")
                .appendTo(calloutInner);

            addCalloutEntry("From", row.from.value, calloutContent);
            addCalloutEntry("To", row.by.value, calloutContent);
            addCalloutEntry("Time", row.date.value, calloutContent);
            addCalloutEntry("Type", row.with.value, calloutContent);
            addCalloutEntry("ID", row.id.value, calloutContent);
            addCalloutEntry("For", row.for.value, calloutContent);
            addCalloutEntry("Via", row.via.value, calloutContent);
        });

        // Build antispam view
        const antispamList = $(".antispam-list");

        // Forefront
        if (viewModel.forefrontAntiSpamReport.rows.length > 0) {
            $("<div/>")
                .addClass("ms-font-m")
                .text("Forefront Antispam Report")
                .appendTo(antispamList);

            $("<hr/>").appendTo(antispamList);
            let table = $("<table/>")
                .addClass("ms-Table")
                .addClass("ms-Table--fixed")
                .addClass("spam-report")
                .appendTo(antispamList);
            let tbody = $("<tbody/>")
                .appendTo(table);
            viewModel.forefrontAntiSpamReport.rows.forEach((antispamrow: Row) => {
                let row = $("<tr/>").appendTo(tbody);
                $("<td/>")
                    .text(antispamrow.label)
                    .appendTo(row);
                $("<td/>")
                    .html(antispamrow.valueUrl)
                    .appendTo(row);
            });
        }

        // Microsoft
        if (viewModel.antiSpamReport.rows.length > 0) {
            $("<div/>")
                .addClass("ms-font-m")
                .text("Microsoft Antispam Report")
                .appendTo(antispamList);

            $("<hr/>").appendTo(antispamList);
            let table = $("<table/>")
                .addClass("ms-Table")
                .addClass("ms-Table--fixed")
                .addClass("spam-report")
                .appendTo(antispamList);
            let tbody = $("<tbody/>")
                .appendTo(table);
            viewModel.antiSpamReport.rows.forEach((antispamrow: Row) => {
                let row = $("<tr/>").appendTo(tbody);
                $("<td/>")
                    .text(antispamrow.label)
                    .appendTo(row);
                $("<td/>")
                    .html(antispamrow.valueUrl)
                    .appendTo(row);
            });
        }
    }

    // Build other view
    const otherList = $(".other-list");

    viewModel.otherHeaders.rows.forEach((otherRow: OtherRow) => {
        if (otherRow.value) {
            const headerName = $("<div/>")
                .addClass("ms-font-s")
                .addClass("ms-fontWeight-semibold")
                .text(otherRow.header)
                .appendTo(otherList);
            if (otherRow.url) {
                headerName.html(otherRow.url);
            }
            let headerVal = $("<div/>")
                .addClass("code-box")
                .appendTo(otherList);
            let pre = $("<pre/>").appendTo(headerVal);
            $("<code/>")
                .text(otherRow.value)
                .appendTo(pre);
        }
    });

    // Initialize any fabric lists added
    const listElements = document.querySelectorAll(".ms-List");
    for (let i: number = 0; i < listElements.length; i++) {
        new fabric["List"](listElements[i]);
    }

    const listItemElements = document.querySelectorAll(".ms-ListItem");
    listItemElements.forEach((listItem: Element) => {
        new fabric["ListItem"](listItem);

        // Init corresponding callout
        const calloutElement: Element | null = listItem.querySelector(".ms-Callout");
        new fabric["Callout"](calloutElement, listItem, "right");
    });
}

function hideStatus(): void {
    spinner.stop();
    overlay.hide();
}

function renderItem(headers: string): void {
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
function showError(_error: any, message: string): void {
    // TODO: Do something with the error
    $("#error-display .ms-MessageBar-text").text(message);
    $("#error-display").show();
}

function eventListener(event: MessageEvent): void {
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

$(document).ready(function (): void {
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