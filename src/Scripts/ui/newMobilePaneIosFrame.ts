import "framework7/css";
import "framework7/css/bundle";
import "framework7-icons/css/framework7-icons.css";
import "../../Content/newMobilePaneIosFrame.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Framework7 from "framework7";
import Accordion from "framework7/components/accordion";
import Dialog from "framework7/components/dialog";
import Popover from "framework7/components/popover";
import Preloader from "framework7/components/preloader";
import Progressbar from "framework7/components/progressbar";
import Tabs from "framework7/components/tabs";

import { HeaderModel } from "../HeaderModel";
import { mhaStrings } from "../mhaStrings";
import { Poster } from "../Poster";
import { DomUtils } from "./domUtils";
import { OtherRow } from "../row/OtherRow";
import { ReceivedRow } from "../row/ReceivedRow";
import { Row } from "../row/Row";
import { SummaryRow } from "../row/SummaryRow";
import { RuleViolation } from "../rules/types/AnalysisTypes";
import { getViolationsForRow, highlightContent } from "../rules/ViolationUtils";

// This is the "new-mobile" UI rendered in newMobilePaneIosFrame.html

// Framework7 app object
let myApp: Framework7 | null = null;

dayjs.extend(utc);

function postError(error: unknown, message: string): void {
    Poster.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFramework7(): void {
    // Install Framework7 components
    Framework7.use([Preloader, Dialog, Accordion, Progressbar, Popover, Tabs]);

    myApp = new Framework7({
        // App name
        name: "MHA",
        // Set theme based on platform
        theme: "auto",
    });

    document.getElementById("summary-btn")!.focus();
}

function updateStatus(message: string): void {
    if (myApp && myApp.preloader) {
        myApp.preloader.hide();
        myApp.preloader.show(message);
    }
}

function handleTimelineKeyboardActivation(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const target = event.target as HTMLElement;

        // Check if there's already an open popover
        const openPopovers = document.querySelectorAll(".popover.modal-in");

        if (openPopovers.length > 0 && myApp) {
            // If a popover is open, close it
            openPopovers.forEach(popover => {
                const popoverInstance = myApp!.popover.get(popover as HTMLElement);
                if (popoverInstance) {
                    popoverInstance.close();
                }
            });
        } else {
            // If no popover is open, simulate a click to trigger Framework7's popover handling
            target.click();
        }
    }
}

function handlePopoverDismissalKeys(event: KeyboardEvent): void {
    // Check if any popovers are open
    const openPopovers = document.querySelectorAll(".popover.modal-in");

    if (event.key === "Escape") {
        // Escape always closes popovers if they're open
        if (openPopovers.length > 0 && myApp) {
            event.preventDefault();
            event.stopPropagation();

            openPopovers.forEach(popover => {
                const popoverInstance = myApp!.popover.get(popover as HTMLElement);
                if (popoverInstance) {
                    popoverInstance.close();
                }
            });
        }
    }
}

function addCalloutEntry(name: string, value: string | number | null, parent: HTMLElement): void {
    if (value) {
        const template = document.getElementById("popover-entry-template") as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as DocumentFragment;
        const p = clone.querySelector("p") as HTMLElement;
        p.innerHTML = "<strong>" + name + ": </strong>" + value;
        parent.appendChild(clone);
    }
}

function createViolationBadge(violation: RuleViolation): HTMLElement {
    const template = document.getElementById("violation-badge-template") as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as DocumentFragment;

    const badge = clone.querySelector(".severity-badge") as HTMLElement;
    badge.setAttribute("data-severity", violation.rule.severity);
    badge.textContent = violation.rule.severity.toUpperCase();

    const message = clone.querySelector(".violation-message") as HTMLElement;
    message.textContent = violation.rule.errorMessage;
    message.setAttribute("data-severity", violation.rule.severity);

    const container = clone.querySelector(".violation-inline") as HTMLElement;
    return container;
}

function createViolationCard(violation: RuleViolation): HTMLElement {
    const template = document.getElementById("violation-card-template") as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as DocumentFragment;

    const badge = clone.querySelector(".severity-badge") as HTMLElement;
    badge.setAttribute("data-severity", violation.rule.severity);
    badge.textContent = violation.rule.severity.toUpperCase();

    const message = clone.querySelector(".violation-message") as HTMLElement;
    message.textContent = violation.rule.errorMessage;
    message.setAttribute("data-severity", violation.rule.severity);

    const rule = clone.querySelector(".violation-rule") as HTMLElement;
    const ruleInfo = `${violation.rule.checkSection || ""} / ${violation.rule.errorPattern || ""}`.trim();
    rule.textContent = ruleInfo;

    const parentMsg = clone.querySelector(".violation-parent-message") as HTMLElement;
    if (violation.parentMessage) {
        parentMsg.textContent = `Part of: ${violation.parentMessage}`;
    } else {
        parentMsg.style.display = "none";
    }

    const card = clone.querySelector(".violation-card") as HTMLElement;
    return card;
}

function buildDiagnosticsReport(viewModel: HeaderModel): void {
    if (!viewModel.violationGroups || viewModel.violationGroups.length === 0) return;

    const summaryContent = document.getElementById("summary-content")!;
    const template = document.getElementById("diagnostics-section-template") as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as DocumentFragment;
    const accordion = clone.querySelector(".diagnostics-accordion") as HTMLElement;

    viewModel.violationGroups.forEach((group) => {
        const itemTemplate = document.getElementById("diagnostic-accordion-item-template") as HTMLTemplateElement;
        const itemClone = itemTemplate.content.cloneNode(true) as DocumentFragment;

        const badge = itemClone.querySelector(".severity-badge") as HTMLElement;
        badge.setAttribute("data-severity", group.severity);
        badge.textContent = group.severity.toUpperCase();

        const message = itemClone.querySelector(".violation-message") as HTMLElement;
        message.setAttribute("data-severity", group.severity);
        message.textContent = group.displayName;

        const count = itemClone.querySelector(".violation-count") as HTMLElement;
        if (group.violations.length > 1) {
            count.textContent = ` (${group.violations.length})`;
        } else {
            count.style.display = "none";
        }

        const content = itemClone.querySelector(".diagnostic-content") as HTMLElement;
        group.violations.forEach((violation) => {
            content.appendChild(createViolationCard(violation));
        });

        accordion.appendChild(itemClone);
    });

    summaryContent.appendChild(clone);
}

function addSpamReportRow(spamRow: Row, parent: HTMLElement, viewModel: HeaderModel) {
    if (spamRow.value) {
        const template = document.getElementById("spam-report-accordion-item-template") as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as DocumentFragment;

        const itemTitle = clone.querySelector(".item-title") as HTMLElement;
        itemTitle.textContent = spamRow.label;
        itemTitle.setAttribute("id", spamRow.id);

        const rowViolations = getViolationsForRow(spamRow, viewModel.violationGroups);
        if (rowViolations.length > 0) {
            rowViolations.forEach((violation) => {
                itemTitle.appendChild(document.createTextNode(" "));
                itemTitle.appendChild(createViolationBadge(violation));
            });
        }

        const violationsContainer = clone.querySelector(".violations-container") as HTMLElement;
        if (rowViolations.length > 0) {
            rowViolations.forEach((violation) => {
                violationsContainer.appendChild(createViolationCard(violation));
            });
        }

        const linkWrap = clone.querySelector(".link-wrap") as HTMLElement;
        linkWrap.setAttribute("aria-labelledby", spamRow.id);

        const tempDiv = document.createElement("div");
        const highlightedContent = highlightContent(spamRow.valueUrl, viewModel.violationGroups);
        tempDiv.innerHTML = highlightedContent;
        while (tempDiv.firstChild) {
            const child = tempDiv.firstChild as HTMLElement;
            if (child.nodeType === Node.ELEMENT_NODE) {
                child.classList.add("external");
            }
            linkWrap.appendChild(child);
        }

        parent.appendChild(clone);
    }
}

async function buildViews(headers: string): Promise<void> {
    const viewModel = await HeaderModel.create(headers);

    buildSummaryTab(viewModel);
    buildReceivedTab(viewModel);
    buildAntispamTab(viewModel);
    buildOtherTab(viewModel);
}

function buildSummaryTab(viewModel: HeaderModel): void {
    const summaryContent = document.getElementById("summary-content")!;

    viewModel.summary.rows.forEach((row: SummaryRow) => {
        if (row.value) {
            const template = document.getElementById("summary-header-block-template") as HTMLTemplateElement;
            const clone = template.content.cloneNode(true) as DocumentFragment;

            const blockTitle = clone.querySelector(".block-title") as HTMLElement;
            blockTitle.textContent = row.label;

            const rowViolations = getViolationsForRow(row, viewModel.violationGroups);
            if (rowViolations.length > 0) {
                rowViolations.forEach((violation) => {
                    blockTitle.appendChild(document.createTextNode(" "));
                    blockTitle.appendChild(createViolationBadge(violation));
                });
            }

            const code = clone.querySelector("code") as HTMLElement;
            const highlightedContent = highlightContent(row.value, viewModel.violationGroups);
            code.innerHTML = highlightedContent;

            summaryContent.appendChild(clone);
        }
    });

    if (viewModel.originalHeaders) {
        DomUtils.setText("#original-headers", viewModel.originalHeaders);
        DomUtils.showElement("#orig-headers-ui");
    }

    buildDiagnosticsReport(viewModel);
}

function buildReceivedTab(viewModel: HeaderModel): void {
    const receivedContent = document.getElementById("received-content")!;

    if (viewModel.receivedHeaders.rows.length > 0) {
        const timeline = document.createElement("div");
        timeline.className = "timeline";
        receivedContent.appendChild(timeline);

        let currentTime: dayjs.Dayjs = dayjs(viewModel.receivedHeaders.rows[0]?.dateNum.value).local();
        let currentTimeEntry: HTMLElement;

        viewModel.receivedHeaders.rows.forEach((row: ReceivedRow, i: number) => {
            if (i === 0) {
                // Create timeline item
                const timelineTemplate = document.getElementById("timeline-item-template") as HTMLTemplateElement;
                const timelineClone = timelineTemplate.content.cloneNode(true) as DocumentFragment;

                const timelineDate: string = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
                const timelineDateEl = timelineClone.querySelector(".timeline-item-date") as HTMLElement;
                timelineDateEl.innerHTML = timelineDate;

                currentTimeEntry = timelineClone.querySelector(".timeline-item-content") as HTMLElement;
                timeline.appendChild(timelineClone);

                // Add initial timeline inner
                const innerTemplate = document.getElementById("timeline-inner-first-template") as HTMLTemplateElement;
                const innerClone = innerTemplate.content.cloneNode(true) as DocumentFragment;

                const timelineInner = innerClone.querySelector(".timeline-item-inner") as HTMLElement;
                timelineInner.setAttribute("data-popover", ".popover-" + i);
                timelineInner.setAttribute("aria-label", `View details for message received at ${currentTime.format("h:mm:ss")} from ${row.from}`);
                timelineInner.addEventListener("keydown", handleTimelineKeyboardActivation);

                const timelineTime = innerClone.querySelector(".timeline-item-time") as HTMLElement;
                timelineTime.textContent = currentTime.format("h:mm:ss");

                const timelineSubtitle = innerClone.querySelector(".timeline-item-subtitle") as HTMLElement;
                timelineSubtitle.innerHTML = "<strong>From: </strong>" + row.from;

                const timelineText = innerClone.querySelector(".timeline-item-text") as HTMLElement;
                timelineText.innerHTML = "<strong>To: </strong>" + row.by;

                currentTimeEntry.appendChild(innerClone);
            } else {
                // Determine if new timeline item is needed
                const entryTime = dayjs(row.dateNum.value).local();

                if (entryTime.minute() > currentTime.minute()) {
                    // Into a new minute, create a new timeline item
                    currentTime = entryTime;

                    const timelineTemplate = document.getElementById("timeline-item-template") as HTMLTemplateElement;
                    const timelineClone = timelineTemplate.content.cloneNode(true) as DocumentFragment;

                    const timelineDate: string = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
                    const timelineDateEl = timelineClone.querySelector(".timeline-item-date") as HTMLElement;
                    timelineDateEl.innerHTML = timelineDate;

                    currentTimeEntry = timelineClone.querySelector(".timeline-item-content") as HTMLElement;
                    timeline.appendChild(timelineClone);
                }

                // Add additional rows
                const innerTemplate = document.getElementById("timeline-inner-subsequent-template") as HTMLTemplateElement;
                const innerClone = innerTemplate.content.cloneNode(true) as DocumentFragment;

                const timelineInner = innerClone.querySelector(".timeline-item-inner") as HTMLElement;
                timelineInner.setAttribute("data-popover", ".popover-" + i);
                timelineInner.setAttribute("aria-label", `View details for message received at ${entryTime.format("h:mm:ss")} to ${row.by}`);
                timelineInner.addEventListener("keydown", handleTimelineKeyboardActivation);

                const timelineTime = innerClone.querySelector(".timeline-item-time") as HTMLElement;
                timelineTime.textContent = entryTime.format("h:mm:ss");

                const timelineSubtitle = innerClone.querySelector(".timeline-item-subtitle") as HTMLElement;
                timelineSubtitle.innerHTML = "<strong>To: </strong>" + row.by;

                const delayText = innerClone.querySelector(".delay-text") as HTMLElement;
                delayText.textContent = row.delay.value !== null ? String(row.delay.value) : "";

                const progressWrap = innerClone.querySelector(".progress-wrap") as HTMLElement;
                progressWrap.className = "progress-wrap progress-wrap-" + i;

                try {
                    if (myApp && row.percent.value !== null) {
                        myApp.progressbar.show(".progress-wrap-" + i, Number(row.percent.value));
                    }
                } catch (e) {
                    DomUtils.setText("#original-headers", JSON.stringify(e));
                    return;
                }

                currentTimeEntry.appendChild(innerClone);
            }

            // Create popover
            const popoverTemplate = document.getElementById("popover-template") as HTMLTemplateElement;
            const popoverClone = popoverTemplate.content.cloneNode(true) as DocumentFragment;

            const popover = popoverClone.querySelector(".popover") as HTMLElement;
            popover.classList.add("popover-" + i);

            const popoverContent = popoverClone.querySelector(".popover-content") as HTMLElement;

            addCalloutEntry("From", row.from.value, popoverContent);
            addCalloutEntry("To", row.by.value, popoverContent);
            addCalloutEntry("Time", row.date.value, popoverContent);
            addCalloutEntry("Type", row.with.value, popoverContent);
            addCalloutEntry("ID", row.id.value, popoverContent);
            addCalloutEntry("For", row.for.value, popoverContent);
            addCalloutEntry("Via", row.via.value, popoverContent);

            receivedContent.appendChild(popoverClone);
        });

        // Add a final empty timeline item to extend timeline
        const endTimelineTemplate = document.getElementById("timeline-item-template") as HTMLTemplateElement;
        const endTimelineClone = endTimelineTemplate.content.cloneNode(true) as DocumentFragment;

        currentTime = currentTime.add(1, "m");
        const endTimelineDate = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
        const endTimelineDateEl = endTimelineClone.querySelector(".timeline-item-date") as HTMLElement;
        endTimelineDateEl.innerHTML = endTimelineDate;

        timeline.appendChild(endTimelineClone);
    }
}

function buildAntispamTab(viewModel: HeaderModel): void {
    const antispamContent = document.getElementById("antispam-content")!;

    // Forefront
    if (viewModel.forefrontAntiSpamReport.rows.length > 0) {
        const template = document.getElementById("antispam-section-template") as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as DocumentFragment;

        const blockTitle = clone.querySelector(".block-title") as HTMLElement;
        blockTitle.textContent = "Forefront Antispam Report";

        const ul = clone.querySelector("ul") as HTMLElement;
        viewModel.forefrontAntiSpamReport.rows.forEach((row: Row) => {
            addSpamReportRow(row, ul, viewModel);
        });

        antispamContent.appendChild(clone);
    }

    // Microsoft
    if (viewModel.antiSpamReport.rows.length > 0) {
        const template = document.getElementById("antispam-section-template") as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as DocumentFragment;

        const blockTitle = clone.querySelector(".block-title") as HTMLElement;
        blockTitle.textContent = "Microsoft Antispam Report";

        const ul = clone.querySelector("ul") as HTMLElement;
        viewModel.antiSpamReport.rows.forEach((row: Row) => {
            addSpamReportRow(row, ul, viewModel);
        });

        antispamContent.appendChild(clone);
    }
}

function buildOtherTab(viewModel: HeaderModel): void {
    const otherContent = document.getElementById("other-content")!;

    viewModel.otherHeaders.rows.forEach((row: OtherRow) => {
        if (row.value) {
            const template = document.getElementById("other-header-block-template") as HTMLTemplateElement;
            const clone = template.content.cloneNode(true) as DocumentFragment;

            const headerName = clone.querySelector(".block-title") as HTMLElement;
            const rowViolations = getViolationsForRow(row, viewModel.violationGroups);

            if (row.url) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = row.url;
                while (tempDiv.firstChild) {
                    const child = tempDiv.firstChild as HTMLElement;
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        child.classList.add("external");
                    }
                    headerName.appendChild(child);
                }
            } else {
                headerName.textContent = row.header;
                headerName.setAttribute("tabindex", "0");
            }

            const code = clone.querySelector("code") as HTMLElement;
            const highlightedContent = highlightContent(row.value, viewModel.violationGroups);
            code.innerHTML = highlightedContent;

            const violationsContainer = clone.querySelector(".violations-container") as HTMLElement;
            if (rowViolations.length > 0) {
                rowViolations.forEach((violation) => {
                    violationsContainer.appendChild(createViolationCard(violation));
                });
            }

            otherContent.appendChild(clone);
        }
    });
}

async function renderItem(headers: string): Promise<void> {
    // Empty data
    DomUtils.clearElement("#summary-content");
    DomUtils.clearElement("#received-content");
    DomUtils.clearElement("#antispam-content");
    DomUtils.clearElement("#other-content");
    DomUtils.clearElement("#original-headers");

    updateStatus(mhaStrings.mhaLoading);

    await buildViews(headers);

    setupAccordionAccessibility();

    if (myApp) myApp.preloader.hide();
}

function setupAccordionAccessibility(): void {
    if (!myApp) return;

    // Set initial state - make all collapsed accordion content non-tabbable
    const collapsedContentSelector = ".accordion-item:not(.accordion-item-expanded) .accordion-item-content";
    DomUtils.setAccessibilityState(collapsedContentSelector, true, false);
    DomUtils.makeFocusableElementsNonTabbable(collapsedContentSelector);

    // Set initial aria-expanded state for all accordion buttons
    const accordionButtons = document.querySelectorAll(".accordion-item .item-link[role='button']");
    accordionButtons.forEach((button) => {
        (button as HTMLElement).setAttribute("aria-expanded", "false");
    });

    document.addEventListener("accordion:opened", (event) => {
        const target = event.target as HTMLElement;
        const content = target.querySelector(".accordion-item-content");
        const button = target.querySelector(".item-link[role='button']");

        if (content) {
            const contentElement = content as HTMLElement;
            contentElement.setAttribute("aria-hidden", "false");
            contentElement.style.visibility = "visible";
            DomUtils.restoreFocusableElements(".accordion-item-content");
        }

        // Update aria-expanded to true when accordion opens
        if (button) {
            (button as HTMLElement).setAttribute("aria-expanded", "true");
        }
    });

    document.addEventListener("accordion:closed", (event) => {
        const target = event.target as HTMLElement;
        const content = target.querySelector(".accordion-item-content");
        const button = target.querySelector(".item-link[role='button']");

        if (content) {
            const contentElement = content as HTMLElement;
            contentElement.setAttribute("aria-hidden", "true");
            contentElement.style.visibility = "hidden";

            // Make focusable elements within this specific content non-tabbable
            const focusableElements = contentElement.querySelectorAll(DomUtils.focusableElements);
            focusableElements.forEach((el) => {
                (el as HTMLElement).setAttribute("tabindex", "-1");
            });
        }

        // Update aria-expanded to false when accordion closes
        if (button) {
            (button as HTMLElement).setAttribute("aria-expanded", "false");
        }
    });
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling PostError
function showError(error: unknown, message: string): void {
    console.error("Error:", error);
    if (myApp && myApp.preloader) {
        myApp.preloader.hide();
    }
    if (myApp && myApp.dialog) {
        myApp.dialog.alert(message, "An Error Occurred");
    } else {
        // Fallback to browser alert if Framework7 dialog is not available
        alert(`An Error Occurred: ${message}`);
    }
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

document.addEventListener("DOMContentLoaded", function() {
    try {
        initializeFramework7();
        updateStatus(mhaStrings.mhaLoading);
        window.addEventListener("message", eventListener, false);
        document.addEventListener("keydown", handlePopoverDismissalKeys);
        Poster.postMessageToParent("frameActive");
    }
    catch (e) {
        postError(e, "Failed initializing frame");
        showError(e, "Failed initializing frame");
    }
});
