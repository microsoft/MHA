import "../../Content/fluentCommon.css";
import "../../Content/newDesktopFrame.css";

import { HeaderModel } from "../HeaderModel";
import { mhaStrings } from "../mhaStrings";
import { Poster } from "../Poster";
import { OtherRow } from "../row/OtherRow";
import { ReceivedRow } from "../row/ReceivedRow";
import { Row } from "../row/Row";
import { SummaryRow } from "../row/SummaryRow";
import { TabNavigation } from "../TabNavigation";
import { DomUtils } from "./domUtils";

// This is the "new" UI rendered in newDesktopFrame.html

// Overlay element for loading display
let overlayElement: HTMLElement | null = null;

function postError(error: unknown, message: string): void {
    Poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFluentUI(): void {
    // Store references for overlay control
    overlayElement = DomUtils.getElement("#loading-overlay");

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
    const buttonElement = DomUtils.getElement("#orig-header-btn");
    if (buttonElement) {
        buttonElement.addEventListener("click", function (event: Event): void {
            if (event.currentTarget) {
                const currentTarget = event.currentTarget as HTMLElement;
                const btnIcon = currentTarget.querySelector(".fluent-icon--add, .fluent-icon--remove");
                const originalHeaders = DomUtils.getElement("#original-headers");
                const isExpanded = buttonElement.getAttribute("aria-expanded") === "true";

                if (!isExpanded) {
                    buttonElement.setAttribute("aria-expanded", "true");
                    if (originalHeaders) originalHeaders.style.display = "block";
                    if (btnIcon) {
                        btnIcon.classList.remove("fluent-icon--add");
                        btnIcon.classList.add("fluent-icon--remove");
                    }
                } else {
                    buttonElement.setAttribute("aria-expanded", "false");
                    if (originalHeaders) originalHeaders.style.display = "none";
                    if (btnIcon) {
                        btnIcon.classList.remove("fluent-icon--remove");
                        btnIcon.classList.add("fluent-icon--add");
                    }
                }
            }
        });
    }

    // Show summary by default
    DomUtils.showElement(".header-view[data-content='summary-view']");
    document.getElementById("summary-btn")!.focus();

    // Wire up click events for nav buttons
    DomUtils.getElements("#nav-bar .nav-button").forEach((button: Element) => {
        button.addEventListener("click", function (this: HTMLElement): void {
            // Fix for Bug 1691252 - To set aria-label dynamically on click based on button name
            const currentActive = DomUtils.getElement("#nav-bar .is-active");
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
            DomUtils.hideAllElements("#nav-bar .button-label");

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
            DomUtils.hideAllElements(".header-view");

            // Show the selected content view
            if (content) {
                DomUtils.showElement(`.header-view[data-content='${content}']`);
            }
        });
    });

    // Initialize label visibility - only show active button label
    DomUtils.hideAllElements("#nav-bar .button-label");
    const activeLabel = DomUtils.getElement("#nav-bar .is-active .button-label");
    if (activeLabel) activeLabel.style.display = "block";

    // Initialize iframe tab navigation handling
    TabNavigation.initializeIFrameTabHandling();
}

// Add document-level click handler to close callouts when clicking outside
document.addEventListener("click", function(event: Event) {
    const target = event.target as HTMLElement;

    // Don't close if clicking on a callout or inside a callout
    if (target.closest(".hop-details-overlay")) {
        return;
    }

    // Don't close if clicking on a list item (that will handle its own toggle)
    if (target.closest(".hop-list-item")) {
        return;
    }

    // Close all open callouts
    document.querySelectorAll(".hop-details-overlay.is-shown").forEach(callout => {
        callout.classList.remove("is-shown");
        callout.classList.add("is-hidden");
    });
});

// Add escape key handler to close callouts
document.addEventListener("keydown", function(event: KeyboardEvent) {
    if (event.key === "Escape") {
        document.querySelectorAll(".hop-details-overlay.is-shown").forEach(callout => {
            callout.classList.remove("is-shown");
            callout.classList.add("is-hidden");
        });
    }
});

function updateStatus(message: string) {
    DomUtils.setText("#status-message", message);
    if (overlayElement) {
        overlayElement.style.display = "block";
    }
}

function addCalloutEntry(name: string, value: string | number | null, parent: HTMLElement) {
    if (value) {
        const clone = DomUtils.cloneTemplate("hop-entry-template");
        DomUtils.setTemplateText(clone, ".hop-label", name + ": ");
        DomUtils.setTemplateText(clone, ".hop-value", String(value));
        parent.appendChild(clone);
    }
}

function buildViews(headers: string) {
    const viewModel: HeaderModel = new HeaderModel(headers);
    // Build summary view
    const summaryList = document.querySelector(".summary-list") as HTMLElement;
    viewModel.summary.rows.forEach((row: SummaryRow) => {
        if (row.value) {
            const clone = DomUtils.cloneTemplate("summary-row-template");
            DomUtils.setTemplateText(clone, ".section-header", row.label);
            DomUtils.setTemplateText(clone, "code", row.value);
            summaryList.appendChild(clone);
        }
    });

    // Save original headers and show ui
    DomUtils.setText("#original-headers code", viewModel.originalHeaders);
    if (viewModel.originalHeaders) {
        DomUtils.showElement(".orig-header-ui");
    }

    // Build received view
    const receivedList = document.querySelector(".received-list") as HTMLElement;

    if (viewModel.receivedHeaders.rows.length > 0) {
        // Use HTML template for list creation
        const listClone = DomUtils.cloneTemplate("received-list-template");
        receivedList.appendChild(listClone);
        const list = receivedList.querySelector("ul") as HTMLElement;

        let firstRow = true;
        viewModel.receivedHeaders.rows.forEach((row: ReceivedRow, index) => {
            // Fix for Bug 1846002 - Added attr ID to set focus for the first element in the list
            // Use HTML template for list item creation
            const itemClone = DomUtils.cloneTemplate("list-item-template");
            const listItem = itemClone.querySelector("li") as HTMLElement;
            listItem.id = "received" + index;
            list.appendChild(itemClone);

            if (firstRow) {
                // Use HTML template for first row content
                const listItemElement = listItem;
                if (listItemElement) {
                    const clone = DomUtils.cloneTemplate("first-row-template");
                    DomUtils.setTemplateText(clone, ".from-value", String(row.from));
                    DomUtils.setTemplateText(clone, ".to-value", String(row.by));
                    listItemElement.appendChild(clone);
                }
                firstRow = false;
            } else {
                // Use HTML template for progress icon
                const progressClone = DomUtils.cloneTemplate("progress-icon-template");

                // Set the progress value for fluent-progress
                const percent = Number(row.percent.value ?? 0);
                const progressElement = progressClone.querySelector(".hop-progress") as HTMLElement;
                if (progressElement) {
                    progressElement.setAttribute("value", String(percent));
                    progressElement.setAttribute("max", "100");
                }

                // Set the description text
                const delayText = row.delay.value !== null ? String(row.delay.value) : "";
                DomUtils.setTemplateText(progressClone, ".progress-description", delayText);

                listItem.appendChild(progressClone);

                // Use HTML template for secondary text
                const listItemElement = listItem;
                if (listItemElement) {
                    const clone = DomUtils.cloneTemplate("secondary-text-template");
                    DomUtils.setTemplateText(clone, ".to-value", String(row.by));
                    listItemElement.appendChild(clone);
                }
            }

            // Add selection target using HTML template
            const selectionClone = DomUtils.cloneTemplate("selection-target-template");
            listItem.appendChild(selectionClone);

            // Callout - Use HTML template for callout structure
            const calloutClone = DomUtils.cloneTemplate("hop-template");

            // Add callout header to the tooltip content
            const calloutContent = calloutClone.querySelector(".hop-details-content") as HTMLElement;
            if (calloutContent) {
                const headerClone = DomUtils.cloneTemplate("hop-header-template");
                calloutContent.appendChild(headerClone);
            }

            listItem.appendChild(calloutClone);

            // Add callout entries
            addCalloutEntry("From", row.from.value, calloutContent);
            addCalloutEntry("To", row.by.value, calloutContent);
            addCalloutEntry("Time", row.date.value, calloutContent);
            addCalloutEntry("Type", row.with.value, calloutContent);
            addCalloutEntry("ID", row.id.value, calloutContent);
            addCalloutEntry("For", row.for.value, calloutContent);
            addCalloutEntry("Via", row.via.value, calloutContent);

            // Add click handler to show/hide callout
            listItem.addEventListener("click", function(event: Event) {
                event.preventDefault();
                const calloutElement = this.querySelector(".hop-details-overlay") as HTMLElement;

                // Check if this callout is currently shown BEFORE hiding others
                const isCurrentlyShown = calloutElement && calloutElement.classList.contains("is-shown");

                // Hide all callouts first
                document.querySelectorAll(".hop-details-overlay").forEach(callout => {
                    callout.classList.remove("is-shown");
                    callout.classList.add("is-hidden");
                });

                // If this callout was NOT currently shown, show it
                // If it WAS currently shown, leave it hidden (toggle behavior)
                if (calloutElement && !isCurrentlyShown) {
                    calloutElement.classList.remove("is-hidden");
                    calloutElement.classList.add("is-shown");

                    // Position the callout relative to the clicked line
                    const listItemRect = this.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    // Center the callout horizontally relative to the viewport
                    const leftPosition = (viewportWidth - calloutElement.offsetWidth) / 2;

                    // Position below the clicked line so arrow points up to it
                    let topPosition = listItemRect.bottom + 15; // 15px gap for arrow

                    // Ensure callout stays within viewport
                    if (topPosition + calloutElement.offsetHeight > viewportHeight - 10) {
                        topPosition = viewportHeight - calloutElement.offsetHeight - 10;
                    }
                    if (topPosition < 10) {
                        topPosition = 10;
                    }

                    calloutElement.style.left = `${leftPosition}px`;
                    calloutElement.style.top = `${topPosition}px`;
                }
            });
        });

        // Build antispam view
        const antispamList = document.querySelector(".antispam-list") as HTMLElement;

        // Forefront
        if (viewModel.forefrontAntiSpamReport.rows.length > 0) {
            // Use HTML template for section header
            DomUtils.appendTemplate("forefront-header-template", antispamList);

            // Create table using HTML template
            DomUtils.appendTemplate("antispam-table-template", antispamList);

            const tbodyElement = antispamList.querySelector("table:last-child tbody");
            if (tbodyElement) {
                viewModel.forefrontAntiSpamReport.rows.forEach((antispamrow: Row) => {
                    // Use HTML template for table rows
                    const rowClone = DomUtils.cloneTemplate("table-row-template");

                    // Set first cell content and id
                    const cells = rowClone.querySelectorAll("td");
                    if (cells.length >= 2) {
                        const cell0 = cells[0] as HTMLElement;
                        cell0.id = antispamrow.id;
                        cell0.textContent = antispamrow.label;
                    }

                    // Use helper for setting aria-labelledby attribute
                    DomUtils.setTemplateAttribute(rowClone, "td:nth-child(2)", "aria-labelledby", antispamrow.id);
                    DomUtils.setTemplateHTML(rowClone, "td:nth-child(2)", antispamrow.valueUrl); // Note: valueUrl may contain HTML

                    tbodyElement.appendChild(rowClone);
                });
            }
        }

        // Microsoft
        if (viewModel.antiSpamReport.rows.length > 0) {
            // Use HTML template for section header
            DomUtils.appendTemplate("microsoft-header-template", antispamList);

            // Create table using HTML template
            DomUtils.appendTemplate("antispam-table-template", antispamList);

            const tbodyElement2 = antispamList.querySelector("table:last-child tbody");
            if (tbodyElement2) {
                viewModel.antiSpamReport.rows.forEach((antispamrow: Row) => {
                    // Use HTML template for table rows
                    const rowClone = DomUtils.cloneTemplate("table-row-template");

                    // Set first cell content and id
                    const cells = rowClone.querySelectorAll("td");
                    if (cells.length >= 2) {
                        const cell0 = cells[0] as HTMLElement;
                        cell0.id = antispamrow.id;
                        cell0.textContent = antispamrow.label;
                    }

                    // Use helper for setting aria-labelledby attribute
                    DomUtils.setTemplateAttribute(rowClone, "td:nth-child(2)", "aria-labelledby", antispamrow.id);
                    DomUtils.setTemplateHTML(rowClone, "td:nth-child(2)", antispamrow.valueUrl); // Note: valueUrl may contain HTML

                    tbodyElement2.appendChild(rowClone);
                });
            }
        }
    }

    // Build other view
    const otherList = document.querySelector(".other-list") as HTMLElement;

    viewModel.otherHeaders.rows.forEach((otherRow: OtherRow) => {
        if (otherRow.value) {
            // Use HTML template for other headers
            const clone = DomUtils.cloneTemplate("other-row-template");
            const headerContent = otherRow.url ? otherRow.url : otherRow.header;
            DomUtils.setTemplateHTML(clone, ".section-header", headerContent); // May contain HTML (url)
            DomUtils.setTemplateText(clone, "code", otherRow.value);
            otherList.appendChild(clone);
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
    DomUtils.clearElement(".summary-list");
    DomUtils.setText("#original-headers code", "");
    DomUtils.hideElement(".orig-header-ui");
    DomUtils.clearElement(".received-list");
    DomUtils.clearElement(".antispam-list");
    DomUtils.clearElement(".other-list");
    DomUtils.setText("#error-display .error-text", "");
    DomUtils.hideElement("#error-display");

    // Build views with the loaded data
    buildViews(headers);
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling PostError
function showError(error: unknown, message: string): void {
    console.error("Error:", error);
    DomUtils.setText("#error-display .error-text", message);
    DomUtils.showElement("#error-display");
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