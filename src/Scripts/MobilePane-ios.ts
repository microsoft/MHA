/* global $ */
/* global Framework7 */
/* global moment */
/* global mhaStrings */
/* global HeaderModel */
/* global message */

// This is the "new-mobile" UI rendered in newMobilePaneIosFrame.html

(function () {
    "use strict";

    // Framework7 app object
    let myApp = null;

    function postError(error, message) {
        message.postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
    }

    function initializeFramework7() {
        myApp = new Framework7();

        myApp.addView("#summary-view");
        myApp.addView("#received-view");
        myApp.addView("#antispam-view");
        myApp.addView("#other-view");
    }

    function updateStatus(message) {
        if (myApp) {
            myApp.hidePreloader();
            myApp.showPreloader(message);
        }
    }

    function addCalloutEntry(name, value, parent) {
        if (value) {
            $("<p/>")
                .addClass("wrap-line")
                .html("<strong>" + name + ": </strong>" + value)
                .appendTo(parent);
        }
    }

    function addSpamReportRow(spamRow, parent) {
        if (spamRow.value) {
            const item = $("<li/>")
                .addClass("accordion-item")
                .appendTo(parent);

            const link = $("<a/>")
                .addClass("item-content")
                .addClass("item-link")
                .attr("href", "#")
                .appendTo(item);

            const innerItem = $("<div/>")
                .addClass("item-inner")
                .appendTo(link);

            $("<div/>")
                .addClass("item-title")
                .text(spamRow.label)
                .appendTo(innerItem);

            const itemContent = $("<div/>")
                .addClass("accordion-item-content")
                .appendTo(item);

            const contentBlock = $("<div/>")
                .addClass("content-block")
                .appendTo(itemContent);

            const linkWrap = $("<p/>")
                .appendTo(contentBlock);

            $($.parseHTML(spamRow.valueUrl))
                .addClass("external")
                .appendTo(linkWrap);
        }
    }

    function buildViews(headers) {
        const viewModel = HeaderModel(headers);

        // Build summary view
        const summaryContent = $("#summary-content");
        let contentBlock;
        let headerVal;
        let pre;
        let i;

        for (i = 0; i < viewModel.summary.summaryRows.length; i++) {
            if (viewModel.summary.summaryRows[i].value) {
                $("<div/>")
                    .addClass("content-block-title")
                    .text(viewModel.summary.summaryRows[i].label)
                    .appendTo(summaryContent);

                contentBlock = $("<div/>")
                    .addClass("content-block")
                    .appendTo(summaryContent);

                headerVal = $("<div/>")
                    .addClass("code-box")
                    .appendTo(contentBlock);

                pre = $("<pre/>").appendTo(headerVal);

                $("<code/>")
                    .text(viewModel.summary.summaryRows[i].value)
                    .appendTo(pre);
            }
        }

        if (viewModel.originalHeaders) {
            $("#original-headers").text(viewModel.originalHeaders);
            $("#orig-headers-ui").show();
        }

        // Build received view
        const receivedContent = $("#received-content");

        if (viewModel.receivedHeaders.receivedRows.length > 0) {
            const timeline = $("<div/>")
                .addClass("timeline")
                .appendTo(receivedContent);

            let currentTime = null;
            let currentTimeEntry = null;
            let timelineItem;
            let timelineDate;
            let timelineInner;

            for (i = 0; i < viewModel.receivedHeaders.receivedRows.length; i++) {
                if (i === 0) {
                    currentTime = moment(viewModel.receivedHeaders.receivedRows[i].dateNum).local();

                    timelineItem = $("<div/>")
                        .addClass("timeline-item")
                        .appendTo(timeline);

                    timelineDate = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";

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

                    // Add initial otherRows
                    timelineInner = $("<div/>")
                        .addClass("timeline-item-inner")
                        .addClass("link")
                        .addClass("open-popover")
                        .attr("data-popover", ".popover-" + i)
                        .appendTo(currentTimeEntry);

                    $("<div/>")
                        .addClass("timeline-item-time")
                        .text(currentTime.format("h:mm:ss"))
                        .appendTo(timelineInner);

                    $("<div/>")
                        .addClass("timeline-item-subtitle")
                        .html("<strong>From: </strong>" + viewModel.receivedHeaders.receivedRows[i].from)
                        .appendTo(timelineInner);

                    $("<div/>")
                        .addClass("timeline-item-text")
                        .html("<strong>To: </strong>" + viewModel.receivedHeaders.receivedRows[i].by)
                        .appendTo(timelineInner);
                } else {
                    // Determine if new timeline item is needed
                    const entryTime = moment(viewModel.receivedHeaders.receivedRows[i].dateNum).local();

                    if (entryTime.minute() > currentTime.minute()) {
                        // Into a new minute, create a new timeline item
                        currentTime = entryTime;

                        timelineItem = $("<div/>")
                            .addClass("timeline-item")
                            .appendTo(timeline);

                        timelineDate = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
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
                    timelineInner = $("<div/>")
                        .addClass("timeline-item-inner")
                        .addClass("link")
                        .addClass("open-popover")
                        .attr("data-popover", ".popover-" + i)
                        .appendTo(currentTimeEntry);

                    $("<div/>")
                        .addClass("timeline-item-time")
                        .text(entryTime.format("h:mm:ss"))
                        .appendTo(timelineInner);

                    $("<div/>")
                        .addClass("timeline-item-subtitle")
                        .html("<strong>To: </strong>" + viewModel.receivedHeaders.receivedRows[i].by)
                        .appendTo(timelineInner);

                    const progress = $("<div/>")
                        .addClass("timeline-item-text")
                        .appendTo(timelineInner);

                    $("<p/>")
                        .text(viewModel.receivedHeaders.receivedRows[i].delay)
                        .appendTo(progress);

                    $("<p/>")
                        .addClass("progress-wrap-" + i)
                        .appendTo(progress);

                    try {
                        myApp.showProgressbar(".progress-wrap-" + i, viewModel.receivedHeaders.receivedRows[i].percent);
                    } catch (e) {
                        $("#original-headers").text(JSON.stringify(e));
                        return;
                    }
                }

                // popover
                const popover = $("<div/>")
                    .addClass("popover")
                    .addClass("popover-" + i)
                    .appendTo(receivedContent);

                $("<div/>")
                    .addClass("popover-angle")
                    .appendTo(popover);

                const popoverInner = $("<div/>")
                    .addClass("popover-inner")
                    .appendTo(popover);

                const popoverContent = $("<div/>")
                    .addClass("content-block")
                    .appendTo(popoverInner);

                addCalloutEntry("From", viewModel.receivedHeaders.receivedRows[i].from, popoverContent);
                addCalloutEntry("To", viewModel.receivedHeaders.receivedRows[i].by, popoverContent);
                addCalloutEntry("Time", viewModel.receivedHeaders.receivedRows[i].date, popoverContent);
                addCalloutEntry("Type", viewModel.receivedHeaders.receivedRows[i].with, popoverContent);
                addCalloutEntry("ID", viewModel.receivedHeaders.receivedRows[i].id, popoverContent);
                addCalloutEntry("For", viewModel.receivedHeaders.receivedRows[i].for, popoverContent);
                addCalloutEntry("Via", viewModel.receivedHeaders.receivedRows[i].via, popoverContent);
            }

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
        let list;
        let ul;

        // Forefront
        if (viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length > 0) {
            $("<div/>")
                .addClass("content-block-title")
                .text("Forefront Antispam Report")
                .appendTo(antispamContent);

            list = $("<div/>")
                .addClass("list-block")
                .addClass("accordion-list")
                .appendTo(antispamContent);

            ul = $("<ul/>")
                .appendTo(list);

            for (i = 0; i < viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length; i++) {
                addSpamReportRow(viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i], ul);
            }
        }

        // Microsoft
        if (viewModel.antiSpamReport.antiSpamRows.length > 0) {
            $("<div/>")
                .addClass("content-block-title")
                .text("Microsoft Antispam Report")
                .appendTo(antispamContent);

            list = $("<div/>")
                .addClass("list-block")
                .addClass("accordion-list")
                .appendTo(antispamContent);

            ul = $("<ul/>")
                .appendTo(list);

            for (i = 0; i < viewModel.antiSpamReport.antiSpamRows.length; i++) {
                addSpamReportRow(viewModel.antiSpamReport.antiSpamRows[i], ul);
            }
        }

        // Build other view
        const otherContent = $("#other-content");

        for (i = 0; i < viewModel.otherHeaders.otherRows.length; i++) {
            if (viewModel.otherHeaders.otherRows[i].value) {
                const headerName = $("<div/>")
                    .addClass("content-block-title")
                    .text(viewModel.otherHeaders.otherRows[i].header)
                    .appendTo(otherContent);

                if (viewModel.otherHeaders.otherRows[i].url) {
                    headerName.empty();

                    $($.parseHTML(viewModel.otherHeaders.otherRows[i].url))
                        .addClass("external")
                        .appendTo(headerName);
                }

                contentBlock = $("<div/>")
                    .addClass("content-block")
                    .appendTo(otherContent);

                headerVal = $("<div/>")
                    .addClass("code-box")
                    .appendTo(contentBlock);

                pre = $("<pre/>").appendTo(headerVal);

                $("<code/>")
                    .text(viewModel.otherHeaders.otherRows[i].value)
                    .appendTo(pre);
            }
        }
    }

    function renderItem(headers) {
        // Empty data
        $("#summary-content").empty();
        $("#received-content").empty();
        $("#antispam-content").empty();
        $("#other-content").empty();
        $("#original-headers").empty();

        updateStatus(mhaStrings.mha_loading);

        buildViews(headers);
        if (myApp) myApp.hidePreloader();
    }

    // Handles rendering of an error.
    // Does not log the error - caller is responsible for calling PostError
    function showError(error, message) {
        if (myApp) {
            myApp.hidePreloader();
            myApp.alert(message, "An Error Occurred");
        }
    }

    function eventListener(event) {
        if (!event || event.origin !== message.site()) return;

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

    $(document).ready(function () {
        try {
            initializeFramework7();
            updateStatus(mhaStrings.mha_loading);
            window.addEventListener("message", eventListener, false);
            message.postMessageToParent("frameActive");
        }
        catch (e) {
            postError(e, "Failed initializing frame");
            showError(e, "Failed initializing frame");
        }
    });
})();