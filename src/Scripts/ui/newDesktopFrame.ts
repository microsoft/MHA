import "../../Content/fluentCommon.css";
import "../../Content/newDesktopFrame.css";
import $ from "jquery";

import { HeaderModel } from "../HeaderModel";
import { mhaStrings } from "../mhaStrings";
import { Poster } from "../Poster";
import { OtherRow } from "../row/OtherRow";
import { ReceivedRow } from "../row/ReceivedRow";
import { Row } from "../row/Row";
import { SummaryRow } from "../row/SummaryRow";
import { TabNavigation } from "../TabNavigation";

// This is the "new" UI rendered in newDesktopFrame.html

// Overlay element for loading display
let overlayElement: HTMLElement | null = null;

function postError(error: unknown, message: string): void {
    Poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFluentUI(): void {
    // Store references for overlay control
    overlayElement = document.querySelector("#loading-overlay");

    // Override click so user can't dismiss overlay
    if (overlayElement) {
        overlayElement.addEventListener("click", function (e: Event): void {
            e.preventDefault();
            e.stopImmediatePropagation();
        });
    }

    // Fluent UI Web Components don't need JavaScript initialization for most components
    // Navigation and button behavior is handled with standard DOM events

    // Set up original headers toggle button
    const buttonElement: HTMLElement | null = document.querySelector("#orig-header-btn");
    if (buttonElement) {
        buttonElement.addEventListener("click", function (event: Event): void {
            if (event.currentTarget) {
                const currentTarget = event.currentTarget as HTMLElement;
                const btnIcon = currentTarget.querySelector(".ms-Icon--Add, .ms-Icon--Remove");
                const originalHeaders = document.querySelector("#original-headers") as HTMLElement;
                const isExpanded = buttonElement.getAttribute("aria-expanded") === "true";

                if (!isExpanded) {
                    buttonElement.setAttribute("aria-expanded", "true");
                    if (originalHeaders) originalHeaders.style.display = "block";
                    if (btnIcon) {
                        btnIcon.classList.remove("ms-Icon--Add");
                        btnIcon.classList.add("ms-Icon--Remove");
                    }
                } else {
                    buttonElement.setAttribute("aria-expanded", "false");
                    if (originalHeaders) originalHeaders.style.display = "none";
                    if (btnIcon) {
                        btnIcon.classList.remove("ms-Icon--Remove");
                        btnIcon.classList.add("ms-Icon--Add");
                    }
                }
            }
        });
    }

    // Show summary by default
    const summaryView = document.querySelector(".header-view[data-content='summary-view']") as HTMLElement;
    if (summaryView) summaryView.style.display = "block";
    document.getElementById("summary-btn")!.focus();

    // Wire up click events for nav buttons
    const navButtons = document.querySelectorAll("#nav-bar .nav-button");
    navButtons.forEach(button => {
        button.addEventListener("click", function (this: HTMLElement): void {
            // Fix for Bug 1691252 - To set aria-label dynamically on click based on button name
            const currentActive = document.querySelector("#nav-bar .is-active");
            if (currentActive) {
                const activeButtonLabel = currentActive.querySelector(".button-label") as HTMLElement;
                if (activeButtonLabel) {
                    const activeButtonText = activeButtonLabel.textContent?.trim() || "";
                    currentActive.setAttribute("aria-label", activeButtonText);
                }
            }

            // Remove active from current active and hide its label
            if (currentActive) {
                currentActive.classList.remove("is-active");
            }
            const allLabels = document.querySelectorAll("#nav-bar .button-label");
            allLabels.forEach(label => (label as HTMLElement).style.display = "none");

            // Add active class to clicked button and show its label
            this.classList.add("is-active");
            const thisLabel = this.querySelector(".button-label") as HTMLElement;
            if (thisLabel) thisLabel.style.display = "block";

            // Get content marker
            const content = this.getAttribute("data-content");

            // Fix for Bug 1691252 - To set aria-label as button after selection like "Summary Selected"
            const buttonText = thisLabel?.textContent?.trim() || "";
            const ariaLabel = buttonText + " Selected";
            this.setAttribute("aria-label", ariaLabel);

            // Hide all header views
            const allHeaderViews = document.querySelectorAll(".header-view");
            allHeaderViews.forEach(view => (view as HTMLElement).style.display = "none");

            // Show the selected content view
            if (content) {
                const targetView = document.querySelector(`.header-view[data-content='${content}']`) as HTMLElement;
                if (targetView) targetView.style.display = "block";
            }
        });
    });

    // Initialize label visibility - only show active button label
    const allLabels = document.querySelectorAll("#nav-bar .button-label");
    allLabels.forEach(label => (label as HTMLElement).style.display = "none");
    const activeLabel = document.querySelector("#nav-bar .is-active .button-label") as HTMLElement;
    if (activeLabel) activeLabel.style.display = "block";

    // Initialize iframe tab navigation handling
    TabNavigation.initializeIFrameTabHandling();
}

function updateStatus(message: string) {
    const statusElements = document.querySelectorAll(".status-message");
    statusElements.forEach(element => {
        element.textContent = message;
    });
    if (overlayElement) {
        overlayElement.style.display = "block";
    }
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
    const originalHeadersCode = document.querySelector("#original-headers code");
    if (originalHeadersCode) originalHeadersCode.textContent = viewModel.originalHeaders;
    if (viewModel.originalHeaders) {
        const origHeaderUI = document.querySelector(".orig-header-ui") as HTMLElement;
        if (origHeaderUI) origHeaderUI.style.display = "block";
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

                const width: number = 1.8 * (Number(row.percent.value ?? 0));

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

    // Fluent UI Web Components handle their own initialization
    // Lists and callouts work with standard DOM interactions
}

function hideStatus(): void {
    if (overlayElement) {
        overlayElement.style.display = "none";
    }
}

function renderItem(headers: string): void {
    // Hide loading status as soon as we start rendering
    hideStatus();

    // Empty data
    const summaryList = document.querySelector(".summary-list");
    if (summaryList) summaryList.innerHTML = "";

    const originalHeadersCode = document.querySelector("#original-headers code");
    if (originalHeadersCode) originalHeadersCode.textContent = "";

    const origHeaderUI = document.querySelector(".orig-header-ui") as HTMLElement;
    if (origHeaderUI) origHeaderUI.style.display = "none";

    const receivedList = document.querySelector(".received-list");
    if (receivedList) receivedList.innerHTML = "";

    const antispamList = document.querySelector(".antispam-list");
    if (antispamList) antispamList.innerHTML = "";
    $(".other-list").empty();
    $("#error-display .error-text").empty();
    $("#error-display").hide();

    // Build views with the loaded data
    buildViews(headers);
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling PostError
function showError(error: unknown, message: string): void {
    console.error("Error:", error);
    $("#error-display .error-text").text(message);
    $("#error-display").show();
}

function eventListener(event: MessageEvent): void {
    if (!event || event.origin !== Poster.site()) return;

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
        initializeFluentUI();
        updateStatus(mhaStrings.mhaLoading);
        window.addEventListener("message", eventListener, false);
        Poster.postMessageToParent("frameActive");
    }
    catch (e) {
        postError(e, "Failed initializing frame");
        showError(e, "Failed initializing frame");
    }
});
