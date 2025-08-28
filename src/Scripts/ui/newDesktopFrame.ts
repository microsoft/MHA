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

// Template utility functions for cleaner HTML template usage
function cloneTemplate(templateId: string): DocumentFragment {
    const template = document.getElementById(templateId) as HTMLTemplateElement;
    if (!template) {
        throw new Error(`Template with id "${templateId}" not found`);
    }
    return template.content.cloneNode(true) as DocumentFragment;
}

function appendTemplate(templateId: string, parent: HTMLElement): DocumentFragment {
    const clone = cloneTemplate(templateId);
    parent.appendChild(clone);
    return clone;
}

function setTemplateText(clone: DocumentFragment, selector: string, text: string): void {
    const element = clone.querySelector(selector) as HTMLElement;
    if (element) {
        element.textContent = text;
    }
}

function setTemplateHTML(clone: DocumentFragment, selector: string, html: string): void {
    const element = clone.querySelector(selector) as HTMLElement;
    if (element) {
        element.innerHTML = html;
    }
}

function setTemplateAttribute(clone: DocumentFragment, selector: string, attribute: string, value: string): void {
    const element = clone.querySelector(selector) as HTMLElement;
    if (element) {
        element.setAttribute(attribute, value);
    }
}

// Overlay element for loading display
let overlayElement: HTMLElement | null = null;

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

function addCalloutEntry(name: string, value: string | number | null, parent: HTMLElement) {
    if (value) {
        const clone = cloneTemplate("callout-entry-template");
        setTemplateText(clone, ".ms-fontWeight-semibold", name + ": ");
        setTemplateText(clone, ".callout-value", String(value));
        parent.appendChild(clone);
    }
}

function buildViews(headers: string) {
    const viewModel: HeaderModel = new HeaderModel(headers);
    // Build summary view
    const summaryList = document.querySelector(".summary-list") as HTMLElement;
    viewModel.summary.rows.forEach((row: SummaryRow) => {
        if (row.value) {
            const clone = cloneTemplate("summary-row-template");
            setTemplateText(clone, ".ms-font-s", row.label);
            setTemplateText(clone, "code", row.value);
            summaryList.appendChild(clone);
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
        // Use HTML template for list creation
        const listClone = cloneTemplate("received-list-template");
        receivedList.appendChild(listClone);
        const list = receivedList.querySelector("ul") as HTMLElement;

        let firstRow = true;
        viewModel.receivedHeaders.rows.forEach((row: ReceivedRow, index) => {
            // Fix for Bug 1846002 - Added attr ID to set focus for the first element in the list
            // Use HTML template for list item creation
            const itemClone = cloneTemplate("list-item-template");
            const listItem = itemClone.querySelector("li") as HTMLElement;
            listItem.id = "received" + index;
            list.appendChild(itemClone);

            if (firstRow) {
                // Use HTML template for first row content
                const listItemElement = listItem;
                if (listItemElement) {
                    const clone = cloneTemplate("first-row-template");
                    setTemplateText(clone, ".from-value", String(row.from));
                    setTemplateText(clone, ".to-value", String(row.by));
                    listItemElement.appendChild(clone);
                }
                firstRow = false;
            } else {
                // Use HTML template for progress icon
                const progressClone = cloneTemplate("progress-icon-template");

                // Set the progress bar width
                const width: number = 1.8 * (Number(row.percent.value ?? 0));
                const progressBar = progressClone.querySelector(".ms-ProgressIndicator-progressBar") as HTMLElement;
                if (progressBar) {
                    progressBar.style.width = width + "px";
                }

                // Set the description text
                const delayText = row.delay.value !== null ? String(row.delay.value) : "";
                setTemplateText(progressClone, ".ms-ProgressIndicator-itemDescription", delayText);

                listItem.appendChild(progressClone);

                // Use HTML template for secondary text
                const listItemElement = listItem;
                if (listItemElement) {
                    const clone = cloneTemplate("secondary-text-template");
                    setTemplateText(clone, ".to-value", String(row.by));
                    listItemElement.appendChild(clone);
                }
            }

            // Add selection target using HTML template
            const selectionClone = cloneTemplate("selection-target-template");
            listItem.appendChild(selectionClone);

            // Callout - Use HTML template for callout structure
            const calloutClone = cloneTemplate("callout-template");

            // Add callout header to the callout main element
            const calloutMainElement = calloutClone.querySelector(".ms-Callout-main") as HTMLElement;
            if (calloutMainElement) {
                const headerClone = cloneTemplate("callout-header-template");
                calloutMainElement.insertBefore(headerClone, calloutMainElement.firstChild);
            }

            // Get the callout content container
            const calloutContent = calloutClone.querySelector(".ms-Callout-content") as HTMLElement;

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
                const calloutElement = this.querySelector(".ms-Callout") as HTMLElement;

                // Hide all other callouts first
                document.querySelectorAll(".ms-Callout").forEach(callout => {
                    callout.classList.add("is-hidden");
                });

                // Toggle this callout
                if (calloutElement && calloutElement.classList.contains("is-hidden")) {
                    calloutElement.classList.remove("is-hidden");
                } else if (calloutElement) {
                    calloutElement.classList.add("is-hidden");
                }
            });
        });

        // Build antispam view
        const antispamList = document.querySelector(".antispam-list") as HTMLElement;

        // Forefront
        if (viewModel.forefrontAntiSpamReport.rows.length > 0) {
            // Use HTML template for section header
            appendTemplate("forefront-header-template", antispamList);

            // Create table using HTML template
            appendTemplate("antispam-table-template", antispamList);

            const tbodyElement = antispamList.querySelector("table:last-child tbody");
            if (tbodyElement) {
                viewModel.forefrontAntiSpamReport.rows.forEach((antispamrow: Row) => {
                    // Use HTML template for table rows
                    const rowClone = cloneTemplate("table-row-template");

                    // Set first cell content and id
                    const cells = rowClone.querySelectorAll("td");
                    if (cells.length >= 2) {
                        const cell0 = cells[0] as HTMLElement;
                        cell0.id = antispamrow.id;
                        cell0.textContent = antispamrow.label;
                    }

                    // Use helper for setting aria-labelledby attribute
                    setTemplateAttribute(rowClone, "td:nth-child(2)", "aria-labelledby", antispamrow.id);
                    setTemplateHTML(rowClone, "td:nth-child(2)", antispamrow.valueUrl); // Note: valueUrl may contain HTML

                    tbodyElement.appendChild(rowClone);
                });
            }
        }

        // Microsoft
        if (viewModel.antiSpamReport.rows.length > 0) {
            // Use HTML template for section header
            appendTemplate("microsoft-header-template", antispamList);

            // Create table using HTML template
            appendTemplate("antispam-table-template", antispamList);

            const tbodyElement2 = antispamList.querySelector("table:last-child tbody");
            if (tbodyElement2) {
                viewModel.antiSpamReport.rows.forEach((antispamrow: Row) => {
                    // Use HTML template for table rows
                    const rowClone = cloneTemplate("table-row-template");

                    // Set first cell content and id
                    const cells = rowClone.querySelectorAll("td");
                    if (cells.length >= 2) {
                        const cell0 = cells[0] as HTMLElement;
                        cell0.id = antispamrow.id;
                        cell0.textContent = antispamrow.label;
                    }

                    // Use helper for setting aria-labelledby attribute
                    setTemplateAttribute(rowClone, "td:nth-child(2)", "aria-labelledby", antispamrow.id);
                    setTemplateHTML(rowClone, "td:nth-child(2)", antispamrow.valueUrl); // Note: valueUrl may contain HTML

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
            const clone = cloneTemplate("other-row-template");
            const headerContent = otherRow.url ? otherRow.url : otherRow.header;
            setTemplateHTML(clone, ".ms-font-s", headerContent); // May contain HTML (url)
            setTemplateText(clone, "code", otherRow.value);
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
