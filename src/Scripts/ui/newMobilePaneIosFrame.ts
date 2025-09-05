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
import $ from "jquery";

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

function addCalloutEntry(name: string, value: string | number | null, parent: HTMLElement): void {
    if (value) {
        const p = document.createElement("p");
        p.className = "wrap-line";
        p.innerHTML = "<strong>" + name + ": </strong>" + value;
        parent.appendChild(p);
    }
}

function addSpamReportRow(spamRow: Row, parent: JQuery<HTMLElement>) {
    if (spamRow.value) {
        const item = $("<li/>")
            .addClass("accordion-item")
            .appendTo(parent);

        const link = $("<a/>")
            .addClass("item-content")
            .addClass("item-link")
            .attr("role", "button") // Fix for the Bug 1691252- To announce link item as role button
            .attr("href", "#")
            .appendTo(item);

        const innerItem = $("<div/>")
            .addClass("item-inner")
            .appendTo(link);

        $("<div/>")
            .addClass("item-title")
            .text(spamRow.label)
            .attr("id", spamRow.id)
            .appendTo(innerItem);

        const itemContent = $("<div/>")
            .addClass("accordion-item-content")
            .appendTo(item);

        const contentBlock = $("<div/>")
            .addClass("block")
            .appendTo(itemContent);

        const linkWrap = $("<p/>")
            .attr("aria-labelledby", spamRow.id)
            .appendTo(contentBlock);

        $($.parseHTML(spamRow.valueUrl))
            .addClass("external")
            .appendTo(linkWrap);
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
    const receivedContent = $("#received-content");

    if (viewModel.receivedHeaders.rows.length > 0) {
        const timeline = $("<div/>")
            .addClass("timeline")
            .appendTo(receivedContent);

        let currentTime: dayjs.Dayjs = dayjs(viewModel.receivedHeaders.rows[0]?.dateNum.value).local();
        let currentTimeEntry: JQuery<HTMLElement>;

        viewModel.receivedHeaders.rows.forEach((row: ReceivedRow, i: number) => {
            if (i === 0) {
                const timelineItem: JQuery<HTMLElement> = $("<div/>")
                    .addClass("timeline-item")
                    .appendTo(timeline);

                const timelineDate: string = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";

                $("<div/>")
                    .addClass("timeline-item-date")
                    .html(timelineDate)
                    .appendTo(timelineItem);

                $("<div/>")
                    .addClass("timeline-item-divider")
                    .appendTo(timelineItem);

                currentTimeEntry = $("<div/>")
                    .addClass("timeline-item-content")
                    .appendTo(timelineItem);

                // Add initial other rows
                const timelineInner: JQuery<HTMLElement> = $("<div/>")
                    .addClass("timeline-item-inner")
                    .addClass("link")
                    .addClass("popover-open")
                    .attr("data-popover", ".popover-" + i)
                    .appendTo(currentTimeEntry);

                $("<div/>")
                    .addClass("timeline-item-time")
                    .text(currentTime.format("h:mm:ss"))
                    .appendTo(timelineInner);

                $("<div/>")
                    .addClass("timeline-item-subtitle")
                    .html("<strong>From: </strong>" + row.from)
                    .appendTo(timelineInner);

                $("<div/>")
                    .addClass("timeline-item-text")
                    .html("<strong>To: </strong>" + row.by)
                    .appendTo(timelineInner);
            } else {
                // Determine if new timeline item is needed
                const entryTime = dayjs(row.dateNum.value).local();

                if (entryTime.minute() > currentTime.minute()) {
                    // Into a new minute, create a new timeline item
                    currentTime = entryTime;

                    const timelineItem: JQuery<HTMLElement> = $("<div/>")
                        .addClass("timeline-item")
                        .appendTo(timeline);

                    const timelineDate: string = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
                    $("<div/>")
                        .addClass("timeline-item-date")
                        .html(timelineDate)
                        .appendTo(timelineItem);

                    $("<div/>")
                        .addClass("timeline-item-divider")
                        .appendTo(timelineItem);

                    currentTimeEntry = $("<div/>")
                        .addClass("timeline-item-content")
                        .appendTo(timelineItem);

                }

                // Add additional rows
                const timelineInner: JQuery<HTMLElement> = $("<div/>")
                    .addClass("timeline-item-inner")
                    .addClass("link")
                    .addClass("popover-open")
                    .attr("data-popover", ".popover-" + i)
                    .appendTo(currentTimeEntry);

                $("<div/>")
                    .addClass("timeline-item-time")
                    .text(entryTime.format("h:mm:ss"))
                    .appendTo(timelineInner);

                $("<div/>")
                    .addClass("timeline-item-subtitle")
                    .html("<strong>To: </strong>" + row.by)
                    .appendTo(timelineInner);

                const progress = $("<div/>")
                    .addClass("timeline-item-text")
                    .appendTo(timelineInner);

                $("<p/>")
                    .text(row.delay.value !== null ? row.delay.value : "")
                    .appendTo(progress);

                $("<p/>")
                    .addClass("progress-wrap-" + i)
                    .appendTo(progress);

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
        const endTimelineItem = $("<div/>")
            .addClass("timeline-item")
            .appendTo(timeline);

        currentTime.add(1, "m");
        const endTimelineDate = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
        $("<div/>")
            .addClass("timeline-item-date")
            .html(endTimelineDate)
            .appendTo(endTimelineItem);

        $("<div/>")
            .addClass("timeline-item-divider")
            .appendTo(endTimelineItem);
    }

    // Build antispam view
    const antispamContent = $("#antispam-content");

    // Forefront
    if (viewModel.forefrontAntiSpamReport.rows.length > 0) {
        $("<div/>")
            .addClass("block-title")
            .text("Forefront Antispam Report")
            .appendTo(antispamContent);

        const list: JQuery<HTMLElement> = $("<div/>")
            .addClass("list")
            .addClass("accordion-list")
            .appendTo(antispamContent);

        const ul: JQuery<HTMLElement> = $("<ul/>")
            .appendTo(list);

        viewModel.forefrontAntiSpamReport.rows.forEach((row: Row) => {
            addSpamReportRow(row, ul);
        });
    }

    // Microsoft
    if (viewModel.antiSpamReport.rows.length > 0) {
        $("<div/>")
            .addClass("block-title")
            .text("Microsoft Antispam Report")
            .appendTo(antispamContent);

        const list: JQuery<HTMLElement> = $("<div/>")
            .addClass("list")
            .addClass("accordion-list")
            .appendTo(antispamContent);

        const ul: JQuery<HTMLElement> = $("<ul/>")
            .appendTo(list);

        viewModel.antiSpamReport.rows.forEach((row: Row) => {
            addSpamReportRow(row, ul);
        });
    }

    // Build other view
    const otherContent = $("#other-content");

    viewModel.otherHeaders.rows.forEach((row: OtherRow) => {
        if (row.value) {
            const headerName = $("<div/>")
                .addClass("block-title")
                .text(row.header)
                .appendTo(otherContent);

            if (row.url) {
                headerName.empty();

                $($.parseHTML(row.url))
                    .addClass("external")
                    .appendTo(headerName);
            }
            else headerName.attr("tabindex", 0);

            const contentBlock = $("<div/>")
                .addClass("block")
                .appendTo(otherContent);

            const headerVal = $("<div/>")
                .addClass("code-box")
                .appendTo(contentBlock);

            const pre = $("<pre/>").appendTo(headerVal);

            $("<code/>")
                .text(row.value)
                .appendTo(pre);
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

    document.addEventListener("accordion:opened", (event) => {
        const target = event.target as HTMLElement;
        const content = target.querySelector(".accordion-item-content");
        if (content) {
            const contentElement = content as HTMLElement;
            contentElement.setAttribute("aria-hidden", "false");
            contentElement.style.visibility = "visible";
            DomUtils.restoreFocusableElements(".accordion-item-content");
        }
    });

    document.addEventListener("accordion:closed", (event) => {
        const target = event.target as HTMLElement;
        const content = target.querySelector(".accordion-item-content");
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
        Poster.postMessageToParent("frameActive");
    }
    catch (e) {
        postError(e, "Failed initializing frame");
        showError(e, "Failed initializing frame");
    }
});
