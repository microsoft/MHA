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
        const p = document.createElement("p");
        p.className = "wrap-line";
        p.innerHTML = "<strong>" + name + ": </strong>" + value;
        parent.appendChild(p);
    }
}

function addSpamReportRow(spamRow: Row, parent: HTMLElement) {
    if (spamRow.value) {
        const item = document.createElement("li");
        item.className = "accordion-item";
        parent.appendChild(item);

        const link = document.createElement("a");
        link.className = "item-content item-link";
        link.setAttribute("role", "button"); // Fix for the Bug 1691252- To announce link item as role button
        link.setAttribute("aria-expanded", "false"); // Fix for accessibility - initial state is collapsed
        link.setAttribute("href", "#");
        item.appendChild(link);

        const innerItem = document.createElement("div");
        innerItem.className = "item-inner";
        link.appendChild(innerItem);

        const itemTitle = document.createElement("div");
        itemTitle.className = "item-title";
        itemTitle.textContent = spamRow.label;
        itemTitle.setAttribute("id", spamRow.id);
        innerItem.appendChild(itemTitle);

        const itemContent = document.createElement("div");
        itemContent.className = "accordion-item-content";
        item.appendChild(itemContent);

        const contentBlock = document.createElement("div");
        contentBlock.className = "block";
        itemContent.appendChild(contentBlock);

        const linkWrap = document.createElement("p");
        linkWrap.setAttribute("aria-labelledby", spamRow.id);
        contentBlock.appendChild(linkWrap);

        // Parse HTML string and add to linkWrap
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = spamRow.valueUrl;
        while (tempDiv.firstChild) {
            const child = tempDiv.firstChild as HTMLElement;
            if (child.nodeType === Node.ELEMENT_NODE) {
                child.classList.add("external");
            }
            linkWrap.appendChild(child);
        }
    }
}

function buildViews(headers: string): void {
    const viewModel = new HeaderModel(headers);

    // Build summary view
    const summaryContent = document.getElementById("summary-content")!;

    viewModel.summary.rows.forEach((row: SummaryRow) => {
        if (row.value) {
            const blockTitle = document.createElement("div");
            blockTitle.className = "block-title";
            blockTitle.textContent = row.label;
            summaryContent.appendChild(blockTitle);

            const contentBlock = document.createElement("div");
            contentBlock.className = "block";
            summaryContent.appendChild(contentBlock);

            const headerVal = document.createElement("div");
            headerVal.className = "code-box";
            contentBlock.appendChild(headerVal);

            const pre = document.createElement("pre");
            headerVal.appendChild(pre);

            const code = document.createElement("code");
            code.textContent = row.value;
            pre.appendChild(code);
        }
    });

    if (viewModel.originalHeaders) {
        DomUtils.setText("#original-headers", viewModel.originalHeaders);
        DomUtils.showElement("#orig-headers-ui");
    }

    // Build received view
    const receivedContent = document.getElementById("received-content")!;

    if (viewModel.receivedHeaders.rows.length > 0) {
        const timeline = document.createElement("div");
        timeline.className = "timeline";
        receivedContent.appendChild(timeline);

        let currentTime: dayjs.Dayjs = dayjs(viewModel.receivedHeaders.rows[0]?.dateNum.value).local();
        let currentTimeEntry: HTMLElement;

        viewModel.receivedHeaders.rows.forEach((row: ReceivedRow, i: number) => {
            if (i === 0) {
                const timelineItem = document.createElement("div");
                timelineItem.className = "timeline-item";
                timeline.appendChild(timelineItem);

                const timelineDate: string = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";

                const timelineDateEl = document.createElement("div");
                timelineDateEl.className = "timeline-item-date";
                timelineDateEl.innerHTML = timelineDate;
                timelineItem.appendChild(timelineDateEl);

                const timelineDivider = document.createElement("div");
                timelineDivider.className = "timeline-item-divider";
                timelineItem.appendChild(timelineDivider);

                currentTimeEntry = document.createElement("div");
                currentTimeEntry.className = "timeline-item-content";
                timelineItem.appendChild(currentTimeEntry);

                // Add initial other rows
                const timelineInner = document.createElement("div");
                timelineInner.className = "timeline-item-inner link popover-open";
                timelineInner.setAttribute("data-popover", ".popover-" + i);
                timelineInner.setAttribute("tabindex", "0");
                timelineInner.setAttribute("role", "button");
                timelineInner.setAttribute("aria-label", `View details for message received at ${currentTime.format("h:mm:ss")} from ${row.from}`);
                timelineInner.addEventListener("keydown", handleTimelineKeyboardActivation);
                currentTimeEntry.appendChild(timelineInner);

                const timelineTime = document.createElement("div");
                timelineTime.className = "timeline-item-time";
                timelineTime.textContent = currentTime.format("h:mm:ss");
                timelineInner.appendChild(timelineTime);

                const timelineSubtitle = document.createElement("div");
                timelineSubtitle.className = "timeline-item-subtitle";
                timelineSubtitle.innerHTML = "<strong>From: </strong>" + row.from;
                timelineInner.appendChild(timelineSubtitle);

                const timelineText = document.createElement("div");
                timelineText.className = "timeline-item-text";
                timelineText.innerHTML = "<strong>To: </strong>" + row.by;
                timelineInner.appendChild(timelineText);
            } else {
                // Determine if new timeline item is needed
                const entryTime = dayjs(row.dateNum.value).local();

                if (entryTime.minute() > currentTime.minute()) {
                    // Into a new minute, create a new timeline item
                    currentTime = entryTime;

                    const timelineItem = document.createElement("div");
                    timelineItem.className = "timeline-item";
                    timeline.appendChild(timelineItem);

                    const timelineDate: string = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
                    const timelineDateEl = document.createElement("div");
                    timelineDateEl.className = "timeline-item-date";
                    timelineDateEl.innerHTML = timelineDate;
                    timelineItem.appendChild(timelineDateEl);

                    const timelineDivider = document.createElement("div");
                    timelineDivider.className = "timeline-item-divider";
                    timelineItem.appendChild(timelineDivider);

                    currentTimeEntry = document.createElement("div");
                    currentTimeEntry.className = "timeline-item-content";
                    timelineItem.appendChild(currentTimeEntry);

                }

                // Add additional rows
                const timelineInner = document.createElement("div");
                timelineInner.className = "timeline-item-inner link popover-open";
                timelineInner.setAttribute("data-popover", ".popover-" + i);
                timelineInner.setAttribute("tabindex", "0");
                timelineInner.setAttribute("role", "button");
                timelineInner.setAttribute("aria-label", `View details for message received at ${entryTime.format("h:mm:ss")} to ${row.by}`);
                timelineInner.addEventListener("keydown", handleTimelineKeyboardActivation);
                currentTimeEntry.appendChild(timelineInner);

                const timelineTime = document.createElement("div");
                timelineTime.className = "timeline-item-time";
                timelineTime.textContent = entryTime.format("h:mm:ss");
                timelineInner.appendChild(timelineTime);

                const timelineSubtitle = document.createElement("div");
                timelineSubtitle.className = "timeline-item-subtitle";
                timelineSubtitle.innerHTML = "<strong>To: </strong>" + row.by;
                timelineInner.appendChild(timelineSubtitle);

                const progress = document.createElement("div");
                progress.className = "timeline-item-text";
                timelineInner.appendChild(progress);

                const delayText = document.createElement("p");
                delayText.textContent = row.delay.value !== null ? String(row.delay.value) : "";
                progress.appendChild(delayText);

                const progressWrap = document.createElement("p");
                progressWrap.className = "progress-wrap-" + i;
                progress.appendChild(progressWrap);

                try {
                    if (myApp && row.percent.value !== null) {
                        myApp.progressbar.show(".progress-wrap-" + i, Number(row.percent.value));
                    }
                } catch (e) {
                    DomUtils.setText("#original-headers", JSON.stringify(e));
                    return;
                }
            }

            // popover
            const receivedContentEl = document.getElementById("received-content")!;
            const popover = document.createElement("div");
            popover.className = "popover popover-" + i;
            receivedContentEl.appendChild(popover);

            const popoverAngle = document.createElement("div");
            popoverAngle.className = "popover-angle";
            popover.appendChild(popoverAngle);

            const popoverInner = document.createElement("div");
            popoverInner.className = "popover-inner";
            popover.appendChild(popoverInner);

            const popoverContent = document.createElement("div");
            popoverContent.className = "block";
            popoverInner.appendChild(popoverContent);

            addCalloutEntry("From", row.from.value, popoverContent);
            addCalloutEntry("To", row.by.value, popoverContent);
            addCalloutEntry("Time", row.date.value, popoverContent);
            addCalloutEntry("Type", row.with.value, popoverContent);
            addCalloutEntry("ID", row.id.value, popoverContent);
            addCalloutEntry("For", row.for.value, popoverContent);
            addCalloutEntry("Via", row.via.value, popoverContent);

        });

        // Add a final empty timeline item to extend
        // timeline
        const endTimelineItem = document.createElement("div");
        endTimelineItem.className = "timeline-item";
        timeline.appendChild(endTimelineItem);

        currentTime.add(1, "m");
        const endTimelineDate = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
        const endTimelineDateEl = document.createElement("div");
        endTimelineDateEl.className = "timeline-item-date";
        endTimelineDateEl.innerHTML = endTimelineDate;
        endTimelineItem.appendChild(endTimelineDateEl);

        const endTimelineDivider = document.createElement("div");
        endTimelineDivider.className = "timeline-item-divider";
        endTimelineItem.appendChild(endTimelineDivider);
    }

    // Build antispam view
    const antispamContent = document.getElementById("antispam-content")!;

    // Forefront
    if (viewModel.forefrontAntiSpamReport.rows.length > 0) {
        const blockTitle = document.createElement("div");
        blockTitle.className = "block-title";
        blockTitle.textContent = "Forefront Antispam Report";
        antispamContent.appendChild(blockTitle);

        const list = document.createElement("div");
        list.className = "list accordion-list";
        antispamContent.appendChild(list);

        const ul = document.createElement("ul");
        list.appendChild(ul);

        viewModel.forefrontAntiSpamReport.rows.forEach((row: Row) => {
            addSpamReportRow(row, ul);
        });
    }

    // Microsoft
    if (viewModel.antiSpamReport.rows.length > 0) {
        const blockTitle = document.createElement("div");
        blockTitle.className = "block-title";
        blockTitle.textContent = "Microsoft Antispam Report";
        antispamContent.appendChild(blockTitle);

        const list = document.createElement("div");
        list.className = "list accordion-list";
        antispamContent.appendChild(list);

        const ul = document.createElement("ul");
        list.appendChild(ul);

        viewModel.antiSpamReport.rows.forEach((row: Row) => {
            addSpamReportRow(row, ul);
        });
    }

    // Build other view
    const otherContent = document.getElementById("other-content")!;

    viewModel.otherHeaders.rows.forEach((row: OtherRow) => {
        if (row.value) {
            const headerName = document.createElement("div");
            headerName.className = "block-title";
            headerName.textContent = row.header;
            otherContent.appendChild(headerName);

            if (row.url) {
                headerName.innerHTML = "";

                // Parse HTML string and add to headerName
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = row.url;
                while (tempDiv.firstChild) {
                    const child = tempDiv.firstChild as HTMLElement;
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        child.classList.add("external");
                    }
                    headerName.appendChild(child);
                }
            }
            else {
                headerName.setAttribute("tabindex", "0");
            }

            const contentBlock = document.createElement("div");
            contentBlock.className = "block";
            otherContent.appendChild(contentBlock);

            const headerVal = document.createElement("div");
            headerVal.className = "code-box";
            contentBlock.appendChild(headerVal);

            const pre = document.createElement("pre");
            headerVal.appendChild(pre);

            const code = document.createElement("code");
            code.textContent = row.value;
            pre.appendChild(code);
        }
    });
}

function renderItem(headers: string): void {
    // Empty data
    DomUtils.clearElement("#summary-content");
    DomUtils.clearElement("#received-content");
    DomUtils.clearElement("#antispam-content");
    DomUtils.clearElement("#other-content");
    DomUtils.clearElement("#original-headers");

    updateStatus(mhaStrings.mhaLoading);

    buildViews(headers);

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
