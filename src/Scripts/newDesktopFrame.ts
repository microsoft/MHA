import "office-ui-fabric-js/dist/css/fabric.min.css";
import "office-ui-fabric-js/dist/css/fabric.components.min.css";
import "../Content/fabric.css";
import "../Content/newDesktopFrame.css";
import $ from "jquery";
import { fabric } from "office-ui-fabric-js/dist/js/fabric";
import { mhaStrings } from "./mhaStrings";
import { HeaderModel } from "./Headers";
import { poster } from "./poster";
import { Row, SummaryRow } from "./Summary";
import { ReceivedRow } from "./Received";
import { OtherRow } from "./Other";
import { findTabStops } from "./findTabStops";

// This is the "new" UI rendered in newDesktopFrame.html

let overlay: fabric.Overlay;
let spinner: fabric.Spinner;

function postError(error: unknown, message: string): void {
    poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFabric(): void {
    const overlayComponent: HTMLElement | null = document.querySelector(".ms-Overlay");
    if (!overlayComponent) return;

    // Override click so user can't dismiss overlay
    overlayComponent.addEventListener("click", function (e: Event): void {
        e.preventDefault();
        e.stopImmediatePropagation();
    });
    overlay = new fabric["Overlay"](overlayComponent);

    const spinnerElement: HTMLElement | null = document.querySelector(".ms-Spinner");
    if (!spinnerElement) return;

    spinner = new fabric["Spinner"](spinnerElement);
    spinner.stop();

    const commandBarElements: NodeListOf<Element> = document.querySelectorAll(".ms-CommandBar");
    Array.prototype.forEach.call(commandBarElements, (commandBarElement: Element) => {
        new fabric["CommandBar"](commandBarElement);
    });

    const commandButtonElements: NodeListOf<HTMLElement> = document.querySelectorAll(".ms-CommandButton");
    Array.prototype.forEach.call(commandButtonElements, (commandButtonElement: HTMLElement) => {
        new fabric["CommandButton"](commandButtonElement);
    });

    const buttonElement: HTMLElement | null = document.querySelector("#orig-header-btn");
    if (!buttonElement) return;
    new fabric["Button"](buttonElement, function (event: Event): void {
        if (event.currentTarget) {
            const btnIcon: JQuery<HTMLElement> = $(event.currentTarget).find(".ms-Icon");
            if (btnIcon.hasClass("ms-Icon--Add")) {
                buttonElement.setAttribute("aria-expanded", "true");
                $("#original-headers").show();
                btnIcon.removeClass("ms-Icon--Add").addClass("ms-Icon--Remove");
            } else {
                buttonElement.setAttribute("aria-expanded", "false");
                $("#original-headers").hide();
                btnIcon.removeClass("ms-Icon--Remove").addClass("ms-Icon--Add");
            }
        }
    });

    // Show summary by default
    $(".header-view[data-content='summary-view']").show();
    document.getElementById("summary-btn")!.focus();

    // Wire up click events for nav buttons
    $("#nav-bar .ms-CommandButton").click(function (): void {
        // Fix for Bug 1691252 - To set aria-label dynamically on click based on button name
        if ($("#nav-bar .is-active .ms-CommandButton-button .ms-CommandButton-label")!.length !== 0) {
            $("#nav-bar .is-active .ms-CommandButton-button").attr("aria-label", $("#nav-bar .is-active .ms-CommandButton-button .ms-CommandButton-label").text());
        }

        // Remove active from current active
        $("#nav-bar .is-active").removeClass("is-active");
        // Add active class to clicked button
        $(this).addClass("is-active");

        // Get content marker
        const content: string | undefined = $(this).attr("data-content");
        // Hide sub-views

        // Fix for Bug 1691252 - To set aria-label as button after selection like "Summary Selected"
        const ariaLabel = $(this).find(".ms-CommandButton-label")!.text() + " Selected";
        $(this).find(".ms-CommandButton-label")!.attr("aria-label",ariaLabel);
        $(this).find("button.ms-CommandButton-button").attr("aria-label",ariaLabel);
        $(".header-view").hide();
        $(".header-view[data-content='" + content + "']").show();
    });

    // Insert the settings and copy buttons into the tab order for the ribbon
    // This handles tabbing into from these buttons.
    // Tabbing out from these buttons is over in parentframe.ts
    document.addEventListener("keydown", function (e) {
        if (e.key === "Tab") {
            const shiftPressed = e.shiftKey;
            const focused: HTMLElement = document.activeElement as HTMLElement;
            // console.log("Shift pressed = " + shiftPressed);
            // console.log("Focused element:" + focused + " class:" + focused.className + " id:" + focused.id + " title:" + focused.title);

            // Tab from Other goes to copy button
            if (!shiftPressed && focused.id === "other-btn") {
                window.parent.document.getElementById("copyButton")!.focus();
                e.preventDefault();
            }
            // Tab back from Summary goes to end of view
            else if (shiftPressed && focused.id === "summary-btn") {
                const view = document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
                const tabStops = findTabStops(view);
                // Set focus on last element in the list if we can
                if (tabStops.length > 0){
                    tabStops[tabStops.length - 1]?.focus();
                    e.preventDefault();
                }
            }
            // If we're tabbing off of the view, we want to tab to the appropriate ribbon button
            else
            {
                const view = document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
                const tabStops = findTabStops(view);

                if (shiftPressed){
                    // If our current focus is the first element in the list, we want to move focus to the copy button
                    if (tabStops.length > 0 && focused === tabStops[0]){
                        window.parent.document.getElementById("settingsButton")!.focus();
                        e.preventDefault();
                    }
                }
                else{
                    // If our current focus is the last element in the list, we want to move focus to the summary-btn
                    if (tabStops.length > 0 && focused === tabStops[tabStops.length - 1]){
                        document.getElementById("summary-btn")!.focus();
                        e.preventDefault();
                    }
                }
            }
        }
    });
}

function updateStatus(message: string) {
    $(".status-message").text(message);
    overlay.show();
    spinner.start();
}

function makeBold(text: string) {
    return "<span class=\"ms-fontWeight-semibold\">" + text + "</span>";
}

function addCalloutEntry(name: string, value: string | number | null, parent: JQuery<HTMLElement>) {
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
            const headerVal = $("<div/>")
                .addClass("code-box")
                .appendTo(summaryList);
            const pre = $("<pre/>").appendTo(headerVal);
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

        let firstRow = true;
        viewModel.receivedHeaders.rows.forEach((row: ReceivedRow, index) => {
            // Fix for Bug 1846002 - Added attr ID to set focus for the first element in the list
            const listItem = $("<li/>")
                .addClass("ms-ListItem")
                .attr("tabindex", 0)
                .attr("id", "received" + index)
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

                const width: number = 1.8 * (Number(row.percent.value) ?? 0);

                $("<div/>")
                    .addClass("ms-ProgressIndicator-progressBar")
                    .css("width", width)
                    .appendTo(bar);

                $("<div/>")
                    .addClass("ms-ProgressIndicator-itemDescription")
                    .text(row.delay.value !== null ? row.delay.value : "")
                    .appendTo(delay);

                $("<span/>")
                    .addClass("ms-ListItem-secondaryText")
                    .html(makeBold("To: ") + row.by)
                    .appendTo(listItem);
            }

            index=index+1;
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

            $("<div/>")
                .addClass("ms-Callout-close")
                .attr("style","display:none")
                .appendTo(calloutMain);

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
            const table = $("<table/>")
                .addClass("ms-Table")
                .addClass("ms-Table--fixed")
                .addClass("spam-report")
                .appendTo(antispamList);
            const tbody = $("<tbody/>")
                .appendTo(table);
            viewModel.forefrontAntiSpamReport.rows.forEach((antispamrow: Row) => {
                const row = $("<tr/>").appendTo(tbody);
                $("<td/>")
                    .text(antispamrow.label)
                    .attr("id", antispamrow.id)
                    .appendTo(row);
                $("<td/>")
                    .html(antispamrow.valueUrl)
                    .attr("aria-labelledby", antispamrow.id)
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
            const table = $("<table/>")
                .addClass("ms-Table")
                .addClass("ms-Table--fixed")
                .addClass("spam-report")
                .appendTo(antispamList);
            const tbody = $("<tbody/>")
                .appendTo(table);
            viewModel.antiSpamReport.rows.forEach((antispamrow: Row) => {
                const row = $("<tr/>").appendTo(tbody);
                $("<td/>")
                    .text(antispamrow.label)
                    .attr("id", antispamrow.id)
                    .appendTo(row);
                $("<td/>")
                    .html(antispamrow.valueUrl)
                    .attr("aria-labelledby", antispamrow.id)
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
            const headerVal = $("<div/>")
                .addClass("code-box")
                .appendTo(otherList);
            const pre = $("<pre/>").appendTo(headerVal);
            $("<code/>")
                .text(otherRow.value)
                .appendTo(pre);
        }
    });

    // Initialize any fabric lists added
    const listElements: NodeListOf<HTMLElement> = document.querySelectorAll(".ms-List");
    Array.prototype.forEach.call(listElements, (listElement: HTMLElement) => {
        new fabric["List"](listElement);
    });

    const listItemElements: NodeListOf<HTMLElement> = document.querySelectorAll(".ms-ListItem");
    Array.prototype.forEach.call(listItemElements, (listItem: HTMLElement) => {
        new fabric["ListItem"](listItem);

        // Init corresponding callout
        const calloutElement: HTMLElement | null = listItem.querySelector(".ms-Callout");
        if (!calloutElement) return;
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
function showError(_error: unknown, message: string): void {
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

$(function() {
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
