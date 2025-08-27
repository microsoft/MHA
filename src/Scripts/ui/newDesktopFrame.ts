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

// DOM utility functions to reduce duplication
function getElement(selector: string): HTMLElement | null {
    return document.querySelector(selector) as HTMLElement;
}

function getElements(selector: string): NodeListOf<HTMLElement> {
    return document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
}

function clearElement(selector: string): void {
    const element = getElement(selector);
    if (element) element.innerHTML = "";
}

function setText(selector: string, text: string): void {
    const element = getElement(selector);
    if (element) element.textContent = text;
}

function showElement(selector: string): void {
    const element = getElement(selector);
    if (element) element.style.display = "block";
}

function hideElement(selector: string): void {
    const element = getElement(selector);
    if (element) element.style.display = "none";
}

function hideAllElements(selector: string): void {
    const elements = getElements(selector);
    elements.forEach(element => element.style.display = "none");
}

// Overlay element for loading display
let overlayElement: HTMLElement | null = null;

// HTML escaping utility for safe template rendering
function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function postError(error: unknown, message: string): void {
    Poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFluentUI(): void {
    // Store references for overlay control
    overlayElement = getElement("#loading-overlay");

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
    const buttonElement = getElement("#orig-header-btn");
    if (buttonElement) {
        buttonElement.addEventListener("click", function (event: Event): void {
            if (event.currentTarget) {
                const currentTarget = event.currentTarget as HTMLElement;
                const btnIcon = currentTarget.querySelector(".ms-Icon--Add, .ms-Icon--Remove");
                const originalHeaders = getElement("#original-headers");
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
    showElement(".header-view[data-content='summary-view']");
    document.getElementById("summary-btn")!.focus();

    // Wire up click events for nav buttons
    getElements("#nav-bar .nav-button").forEach(button => {
        button.addEventListener("click", function (this: HTMLElement): void {
            // Fix for Bug 1691252 - To set aria-label dynamically on click based on button name
            const currentActive = getElement("#nav-bar .is-active");
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
            hideAllElements("#nav-bar .button-label");

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
            hideAllElements(".header-view");

            // Show the selected content view
            if (content) {
                showElement(`.header-view[data-content='${content}']`);
            }
        });
    });

    // Initialize label visibility - only show active button label
    hideAllElements("#nav-bar .button-label");
    const activeLabel = getElement("#nav-bar .is-active .button-label");
    if (activeLabel) activeLabel.style.display = "block";

    // Initialize iframe tab navigation handling
    TabNavigation.initializeIFrameTabHandling();
}

function updateStatus(message: string) {
    setText("#status-message", message);
    if (overlayElement) {
        overlayElement.style.display = "block";
    }
}

function makeBold(text: string) {
    return "<span class=\"ms-fontWeight-semibold\">" + text + "</span>";
}

function addCalloutEntry(name: string, value: string | number | null, parent: JQuery<HTMLElement>) {
    if (value) {
        const calloutEntryTemplate = `
            <p class="ms-Callout-subText">${makeBold(escapeHtml(name) + ": ")}${escapeHtml(String(value))}</p>
        `;
        const parentElement = parent[0]; // Get DOM element from jQuery object
        if (parentElement) {
            parentElement.insertAdjacentHTML("beforeend", calloutEntryTemplate);
        }
    }
}

function buildViews(headers: string) {
    const viewModel: HeaderModel = new HeaderModel(headers);
    // Build summary view
    const summaryList = document.querySelector(".summary-list") as HTMLElement;
    viewModel.summary.rows.forEach((row: SummaryRow) => {
        if (row.value) {
            const summaryRowTemplate = `
                <div class="ms-font-s ms-fontWeight-semibold">${escapeHtml(row.label)}</div>
                <div class="code-box">
                    <pre><code>${escapeHtml(row.value)}</code></pre>
                </div>
            `;
            summaryList.insertAdjacentHTML("beforeend", summaryRowTemplate);
        }
    });

    // Save original headers and show ui
    setText("#original-headers code", viewModel.originalHeaders);
    if (viewModel.originalHeaders) {
        showElement(".orig-header-ui");
    }

    // Build received view
    const receivedList = document.querySelector(".received-list") as HTMLElement;

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
            // Add selection target using template
            listItem[0]?.insertAdjacentHTML("beforeend", "<div class=\"ms-ListItem-selectionTarget\"></div>");

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

            // Add click handler to show/hide callout
            listItem.on("click", function(this: HTMLElement, event: Event) {
                event.preventDefault();
                const calloutElement = $(this).find(".ms-Callout");

                // Hide all other callouts first
                $(".ms-Callout").addClass("is-hidden");

                // Toggle this callout
                if (calloutElement.hasClass("is-hidden")) {
                    calloutElement.removeClass("is-hidden");
                } else {
                    calloutElement.addClass("is-hidden");
                }
            });
        });

        // Build antispam view
        const antispamList = document.querySelector(".antispam-list") as HTMLElement;

        // Forefront
        if (viewModel.forefrontAntiSpamReport.rows.length > 0) {
            // Use HTML template for section header
            const forefrontHeaderTemplate = `
                <div class="ms-font-m">Forefront Antispam Report</div>
                <hr/>
            `;
            antispamList.insertAdjacentHTML("beforeend", forefrontHeaderTemplate);

            const table = $("<table/>")
                .addClass("ms-Table")
                .addClass("ms-Table--fixed")
                .addClass("spam-report")
                .appendTo(antispamList);
            const tbody = $("<tbody/>")
                .appendTo(table);
            const tbodyElement = tbody[0]; // Get the DOM element from jQuery object
            if (tbodyElement) {
                viewModel.forefrontAntiSpamReport.rows.forEach((antispamrow: Row) => {
                    // Use HTML template for table rows
                    const tableRowTemplate = `
                        <tr>
                            <td id="${escapeHtml(antispamrow.id)}">${escapeHtml(antispamrow.label)}</td>
                            <td aria-labelledby="${escapeHtml(antispamrow.id)}">${antispamrow.valueUrl}</td>
                        </tr>
                    `;
                    tbodyElement.insertAdjacentHTML("beforeend", tableRowTemplate);
                });
            }
        }

        // Microsoft
        if (viewModel.antiSpamReport.rows.length > 0) {
            // Use HTML template for section header
            const microsoftHeaderTemplate = `
                <div class="ms-font-m">Microsoft Antispam Report</div>
                <hr/>
            `;
            antispamList.insertAdjacentHTML("beforeend", microsoftHeaderTemplate);

            const table = $("<table/>")
                .addClass("ms-Table")
                .addClass("ms-Table--fixed")
                .addClass("spam-report")
                .appendTo(antispamList);
            const tbody = $("<tbody/>")
                .appendTo(table);
            const tbodyElement = tbody[0]; // Get the DOM element from jQuery object
            if (tbodyElement) {
                viewModel.antiSpamReport.rows.forEach((antispamrow: Row) => {
                    // Use HTML template for table rows
                    const tableRowTemplate = `
                        <tr>
                            <td id="${escapeHtml(antispamrow.id)}">${escapeHtml(antispamrow.label)}</td>
                            <td aria-labelledby="${escapeHtml(antispamrow.id)}">${antispamrow.valueUrl}</td>
                        </tr>
                    `;
                    tbodyElement.insertAdjacentHTML("beforeend", tableRowTemplate);
                });
            }
        }
    }

    // Build other view
    const otherList = document.querySelector(".other-list") as HTMLElement;

    viewModel.otherHeaders.rows.forEach((otherRow: OtherRow) => {
        if (otherRow.value) {
            // Use HTML template for other headers
            const headerContent = otherRow.url ? otherRow.url : escapeHtml(otherRow.header);
            const otherRowTemplate = `
                <div class="ms-font-s ms-fontWeight-semibold">${headerContent}</div>
                <div class="code-box">
                    <pre><code>${escapeHtml(otherRow.value)}</code></pre>
                </div>
            `;
            otherList.insertAdjacentHTML("beforeend", otherRowTemplate);
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
    clearElement(".summary-list");
    setText("#original-headers code", "");
    hideElement(".orig-header-ui");
    clearElement(".received-list");
    clearElement(".antispam-list");
    clearElement(".other-list");
    setText("#error-display .error-text", "");
    hideElement("#error-display");

    // Build views with the loaded data
    buildViews(headers);
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling PostError
function showError(error: unknown, message: string): void {
    console.error("Error:", error);
    setText("#error-display .error-text", message);
    showElement("#error-display");
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

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
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
