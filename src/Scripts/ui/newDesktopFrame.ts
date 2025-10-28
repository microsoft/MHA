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
import { rulesService } from "../rules";
import { RuleViolation, ViolationGroup } from "../rules/types/AnalysisTypes";
import { ISimpleValidationRule } from "../rules/types/interfaces";
import { getSeverityDisplay, getViolationsForRow, highlightContent } from "../rules/ViolationUtils";

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

// Add document-level click handler to close callouts and popovers when clicking outside
document.addEventListener("click", function(event: Event) {
    const target = event.target as HTMLElement;

    // Don't close if clicking on a list item (that will handle its own toggle)
    if (target.closest(".hop-list-item")) {
        return;
    }

    // Don't close popovers if clicking inside them or their trigger buttons
    if (target.closest(".details-overlay-popup") || target.closest(".show-diagnostics-popover-btn")) {
        return;
    }

    closeAllPopups();
});

// Add escape key handler to close callouts and popovers
document.addEventListener("keydown", function(event: KeyboardEvent) {
    if (event.key === "Escape") {
        closeAllPopups();
    }
});

function closeAllPopups()
{
    document.querySelectorAll(".details-overlay-popup.is-shown").forEach(callout => {
        callout.classList.remove("is-shown");
        callout.classList.add("is-hidden");
    });
}

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

async function buildViews(headers: string) {
    let viewModel: HeaderModel = new HeaderModel(headers);
    const validationResult = await rulesService.analyzeHeaders(viewModel);
    const violationGroups = validationResult.violationGroups;
    viewModel = validationResult.enrichedHeaders;

    buildSummaryTab(viewModel, violationGroups);
    buildReceivedTab(viewModel);
    buildAntispamTab(viewModel, violationGroups);
    buildOtherTab(viewModel, violationGroups);
}

function buildSummaryTab(viewModel: HeaderModel, violationGroups: ViolationGroup[]) {
    const summaryList = document.querySelector(".summary-list") as HTMLElement;

    viewModel.summary.rows.forEach((row: SummaryRow) => {
        if (row.value) {
            const clone = DomUtils.cloneTemplate("summary-row-template");
            DomUtils.setTemplateText(clone, ".section-header", row.label);

            const highlightedContent = highlightContent(row.value, violationGroups);
            DomUtils.setTemplateHTML(clone, "code", highlightedContent);

            // Add rule violation display in summary section
            const sectionHeader = clone.querySelector(".section-header") as HTMLElement;
            const rowViolations = getViolationsForRow(row, violationGroups);

            if (sectionHeader && rowViolations.length > 0) {
                rowViolations.forEach((violation: RuleViolation) => {
                    const severityInfo = getSeverityDisplay(violation.rule.severity);
                    const warning = document.createElement("div");
                    warning.className = severityInfo.cssClass;
                    warning.textContent = `${severityInfo.label}: ${violation.rule.errorMessage}`;
                    sectionHeader.appendChild(warning);
                });
            }

            summaryList.appendChild(clone);
        }
    });

    // Save original headers and show ui
    DomUtils.setText("#original-headers textarea", viewModel.originalHeaders);
    if (viewModel.originalHeaders) {
        DomUtils.showElement(".orig-header-ui");
    }

    buildDiagnosticsReport(violationGroups);
}

function buildReceivedTab(viewModel: HeaderModel) {
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

            // Attach generic overlay popup logic
            const overlay = listItem.querySelector(".details-overlay-popup") as HTMLElement;
            if (overlay) {
                attachOverlayPopup(listItem, overlay);
            }
        });
    }
}

/**
 * Generic function to attach an overlay popup to a trigger element.
 * @param trigger - The element that triggers the popup (e.g., listItem).
 * @param overlay - The overlay element to show/hide.
 */
function attachOverlayPopup(trigger: HTMLElement, overlay: HTMLElement): void {
    function showOverlay(): void {
        closeAllPopups();
        // Show this overlay
        overlay.classList.remove("is-hidden");
        overlay.classList.add("is-shown");

        // Position the overlay relative to the trigger
        const triggerRect: DOMRect = trigger.getBoundingClientRect();
        const viewportWidth: number = window.innerWidth;
        const viewportHeight: number = window.innerHeight;
        const leftPosition: number = (viewportWidth - overlay.offsetWidth) / 2;
        let topPosition: number = triggerRect.bottom + 15; // 15px gap for arrow
        if (topPosition + overlay.offsetHeight > viewportHeight - 10) {
            topPosition = viewportHeight - overlay.offsetHeight - 10;
        }
        if (topPosition < 10) {
            topPosition = 10;
        }
        overlay.style.left = `${leftPosition}px`;
        overlay.style.top = `${topPosition}px`;
    }

    function hideOverlay(): void {
        overlay.classList.remove("is-shown");
        overlay.classList.add("is-hidden");
    }

    // Click handler
    trigger.addEventListener("click", function(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (target.closest(".details-overlay-popup")) return;
        event.preventDefault();
        if (overlay.classList.contains("is-shown")) {
            hideOverlay();
        } else {
            showOverlay();
        }
    });

    // Keyboard handler
    trigger.addEventListener("keydown", function(event: KeyboardEvent): void {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (overlay.classList.contains("is-shown")) {
                hideOverlay();
            } else {
                showOverlay();
            }
        }
    });

    // Make trigger focusable
    trigger.setAttribute("tabindex", "0");
}

function buildAntispamTab(viewModel: HeaderModel, violationGroups: ViolationGroup[]) {
    const antispamList = document.querySelector(".antispam-list") as HTMLElement;

    // Forefront
    if (viewModel.forefrontAntiSpamReport.rows.length > 0) {
        // Use HTML template for section header
        DomUtils.appendTemplate("forefront-header-template", antispamList);

        // Create table for antispam data
        const antispamTable = document.createElement("table");
        antispamTable.className = "fluent-table";
        const antispamTbody = document.createElement("tbody");
        antispamTable.appendChild(antispamTbody);
        antispamList.appendChild(antispamTable);

        viewModel.forefrontAntiSpamReport.rows.forEach((antispamrow: Row) => {
            antispamTbody.appendChild(createRow("table-row-template",antispamrow, violationGroups));
        });
    }

    // Microsoft
    if (viewModel.antiSpamReport.rows.length > 0) {
        // Use HTML template for section header
        DomUtils.appendTemplate("microsoft-header-template", antispamList);

        // Create table for antispam data
        const antispamTable = document.createElement("table");
        antispamTable.className = "fluent-table";
        const antispamTbody = document.createElement("tbody");
        antispamTable.appendChild(antispamTbody);
        antispamList.appendChild(antispamTable);

        viewModel.antiSpamReport.rows.forEach((antispamrow: Row) => {
            antispamTbody.appendChild(createRow("table-row-template", antispamrow, violationGroups));
        });
    }
}

function buildOtherTab(viewModel: HeaderModel, violationGroups: ViolationGroup[]) {
    const otherList = document.querySelector(".other-list") as HTMLElement;

    viewModel.otherHeaders.rows.forEach((otherRow: OtherRow) => {
        if (otherRow.value) {
            // Use HTML template for other headers with popover support
            otherList.appendChild(createRow("other-row-template", otherRow, violationGroups));
        }
    });
}

function hideStatus(): void {
    if (overlayElement) {
        overlayElement.style.display = "none";
    }
}

async function renderItem(headers: string): Promise<void> {
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
            case "renderItem": {
                // data is always [headers, SimpleRuleSet, AndRuleSet]
                const headersString = event.data.data[0];
                renderItem(headersString);
                break;
            }
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

/**
 * Apply content highlighting to show rule violation patterns
 * @param content - The text content to highlight
 * @param violationGroups - Array of violation groups with highlight patterns
 * @returns The content with HTML highlighting spans applied
 */

/**
 * Create a grouped rule accordion item
 */
function createGroupedRuleAccordionItem(ruleGroup: ViolationGroup): DocumentFragment {
    const clone = DomUtils.cloneTemplate("diagnostic-accordion-item-template");

    const severityInfo = getSeverityDisplay(ruleGroup.severity);
    DomUtils.setTemplateText(clone, ".diagnostic-title", `${severityInfo.label}: ${ruleGroup.displayName}`);

    const content = clone.querySelector(".diagnostic-content") as HTMLElement;
    if (content) {
        const violationCount = ruleGroup.violations.length;

        if (violationCount > 1 || ruleGroup.isAndRule) {
            // Multiple violations or AND rule - show count and list
            const countDiv = document.createElement("div");
            countDiv.className = "rule-violation-count";
            countDiv.innerHTML = `<strong>${violationCount} violation${violationCount !== 1 ? "s" : ""} found in headers</strong>`;
            content.appendChild(countDiv);

            // Add spacing
            const spacer = document.createElement("div");
            spacer.style.marginBottom = "12px";
            content.appendChild(spacer);

            // List each violation with bullet points
            ruleGroup.violations.forEach((violation: RuleViolation) => {
                const violationDiv = document.createElement("div");
                violationDiv.className = "rule-violation-item";

                // Get the violation message from the rule's error message
                const violationMessage = violation.rule.errorMessage;

                violationDiv.innerHTML = `
                    <div class="violation-message">• ${violationMessage}</div>
                `;

                // Add technical details
                const detailsDiv = document.createElement("div");
                detailsDiv.className = "violation-details";

                // Handle section content
                const sectionContent = violation.section.header;

                detailsDiv.innerHTML = `
                    <div style="margin-left: 16px; font-size: 0.9em; color: #666;">
                        ℹ️ Section: ${sectionContent}
                        ${violation.highlightPattern ? `<br>ℹ️ Highlight Pattern: ${violation.highlightPattern}` : ""}
                    </div>
                `;

                violationDiv.appendChild(detailsDiv);
                content.appendChild(violationDiv);

                // Add spacing between violations
                const itemSpacer = document.createElement("div");
                itemSpacer.style.marginBottom = "8px";
                content.appendChild(itemSpacer);
            });
        } else {
            // Single violation or standalone rule
            const violation = ruleGroup.violations[0];
            if (!violation) return clone; // Safety check

            // Get the violation message from the rule's error message
            const violationMessage = violation.rule.errorMessage;

            const messageDiv = document.createElement("div");
            messageDiv.className = "single-violation-message";
            messageDiv.textContent = violationMessage;
            content.appendChild(messageDiv);

            // Add technical details
            const detailsList = document.createElement("div");
            detailsList.className = "diagnostic-technical-details";
            detailsList.style.marginTop = "12px";

            // Handle section content - section is a HeaderSection object in the new type
            const sectionContent = violation.section.header;
            const sectionDetail = document.createElement("div");
            sectionDetail.innerHTML = `<strong>Section:</strong> ${sectionContent}`;
            detailsList.appendChild(sectionDetail);

            if (violation.highlightPattern) {
                const highlightDetail = document.createElement("div");
                highlightDetail.innerHTML = `<strong>Highlight Pattern:</strong> ${violation.highlightPattern}`;
                detailsList.appendChild(highlightDetail);
            }

            // Add rule details if available
            // Check if this is a simple validation rule with errorPattern
            const simpleRule = violation.rule as ISimpleValidationRule;
            if (simpleRule.errorPattern) {
                const patternDetail = document.createElement("div");
                patternDetail.innerHTML = `<strong>Error Pattern:</strong> ${simpleRule.errorPattern}`;
                detailsList.appendChild(patternDetail);
            }

            content.appendChild(detailsList);
        }
    }

    return clone;
}

/**
 * Build diagnostics report showing rule violations grouped by parent rule
 */
function buildDiagnosticsReport(violationGroups: ViolationGroup[]): void {
    if (!violationGroups || violationGroups.length === 0) return;
    const diagnosticsSection = document.querySelector(".ui-diagnostics-report-section");
    const section = diagnosticsSection as HTMLElement;
    const accordion = document.createElement("fluent-accordion");
    accordion.className = "diagnostics-accordion";
    violationGroups.forEach((ruleGroup) => {
        const accordionItem = createGroupedRuleAccordionItem(ruleGroup);
        accordion.appendChild(accordionItem);
    });

    section.appendChild(accordion);
}

/**
 * Create diagnostic violation item element for inline display
 */
function createDiagnosticViolationItem(violation: RuleViolation): DocumentFragment {
    const clone = DomUtils.cloneTemplate("diagnostic-violation-item-template");
    DomUtils.addClass(".diagnostic-violation-item", `severity-${violation.rule.severity}`);
    DomUtils.setTemplateAttribute(clone, ".diagnostic-violation-item", "data-severity", violation.rule.severity);
    DomUtils.setTemplateText(clone, ".severity-badge", getSeverityDisplay(violation.rule.severity).label);
    DomUtils.setTemplateAttribute(clone, ".severity-badge", "appearance", violation.rule.severity === "error" ? "important" : "accent");
    DomUtils.setTemplateText(clone, ".violation-message", violation.rule.errorMessage);
    if (violation.parentMessage){
        DomUtils.setTemplateText(clone, ".violation-parent-message", `Part of: ${violation.parentMessage}`);
        DomUtils.showElement(".violation-parent-message");
    }

    return clone;
}

/**
 * Set up table row with optional popover buttons
 */
function createRow(
    template: string,
    row: Row,
    violationGroups: ViolationGroup[]) {
    const clone = DomUtils.cloneTemplate(template);
    DomUtils.setTemplateHTML(clone, ".row-header", row.url || row.label || row.header);
    DomUtils.setTemplateAttribute(clone, ".row-header", "id", row.id);

    const highlightedContent = highlightContent(row.value, violationGroups);
    if (highlightedContent !== row.value) {
        DomUtils.setTemplateHTML(clone, ".cell-main-content", highlightedContent);
    } else {
        DomUtils.setTemplateHTML(clone, ".cell-main-content", row.value);
    }
    DomUtils.setTemplateAttribute(clone, ".cell-main-content", "aria-labelledby", row.id);

    const effectiveViolations = getViolationsForRow(row, violationGroups);
    const popoverBtn = clone.querySelector(".show-diagnostics-popover-btn") as HTMLElement;
    const popover = clone.querySelector(".details-overlay-popup") as HTMLElement;
    const diagnosticsList = clone.querySelector(".diagnostics-list") as HTMLElement;

    if (effectiveViolations.length > 0) {
        popoverBtn.style.display = "flex";
        const severities = effectiveViolations.map(v => v.rule.severity);
        const highestSeverity = severities.includes("error") ? "error" : severities.includes("warning") ? "warning" : "info";
        popoverBtn.setAttribute("data-severity", highestSeverity);
        const buttonId = `popover-btn-${row.id}`;
        const popoverId = `popover-${row.id}`;
        popoverBtn.id = buttonId;
        popover.id = popoverId;
        popoverBtn.setAttribute("aria-describedby", popoverId);
        effectiveViolations.forEach(v => diagnosticsList.appendChild(createDiagnosticViolationItem(v)));
        popoverBtn.setAttribute("aria-label", `Show rule violations for ${row.label || row.header}`);
        if (popoverBtn && popover) {
            attachOverlayPopup(popoverBtn, popover as HTMLElement);
        }
    } else {
        popoverBtn.style.display = "none";
    }

    return clone;
}