/* global $ */
/* global Framework7 */
/* global moment */
/* global mhaStrings */
/* global HeaderModel */

// This is the "new-mobile" UI rendered in newMobilePaneIosFrame.html

(function () {
    "use strict";

    // Framework7 app object
    var myApp = null;

    $(document).ready(function () {
        try {
            initializeFramework7();
            updateStatus(mhaStrings.mha_loading);
            window.addEventListener("message", eventListener, false);
            postMessageToParent("frameActive");
        }
        catch (e) {
            postError(e, "Failed initializing frame");
            showError(e, "Failed initializing frame");
        }
    });

    function site() { return window.location.protocol + "//" + window.location.host; }

    function postMessageToParent(eventName, data) {
        window.parent.postMessage({ eventName: eventName, data: data }, site());
    }

    function eventListener(event) {
        if (!event || event.origin !== site()) return;

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

    function postError(error, message) {
        postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
    }

    function initializeFramework7() {
        myApp = new Framework7();

        myApp.addView("#summary-view");
        myApp.addView("#received-view");
        myApp.addView("#antispam-view");
        myApp.addView("#other-view");
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

    function buildViews(headers) {
        var viewModel = HeaderModel(headers);

        // Build summary view
        var summaryContent = $("#summary-content");
        var contentBlock;
        var headerVal;
        var pre;

        for (var i = 0; i < viewModel.summary.summaryRows.length; i++) {
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
        var receivedContent = $("#received-content");

        if (viewModel.receivedHeaders.receivedRows.length > 0) {
            var timeline = $("<div/>")
                .addClass("timeline")
                .appendTo(receivedContent);

            var currentTime = null;
            var currentTimeEntry = null;
            var timelineItem;
            var timelineDate;
            var timelineInner;

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
                    var entryTime = moment(viewModel.receivedHeaders.receivedRows[i].dateNum).local();

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

                    var progress = $("<div/>")
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
                var popover = $("<div/>")
                    .addClass("popover")
                    .addClass("popover-" + i)
                    .appendTo(receivedContent);

                $("<div/>")
                    .addClass("popover-angle")
                    .appendTo(popover);

                var popoverInner = $("<div/>")
                    .addClass("popover-inner")
                    .appendTo(popover);

                var popoverContent = $("<div/>")
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
            var endTimelineItem = $("<div/>")
                .addClass("timeline-item")
                .appendTo(timeline);

            currentTime.add(1, "m");
            var endTimelineDate = currentTime.format("h:mm") + "<small>" + currentTime.format("A") + "</small>";
            $("<div/>")
                .addClass("timeline-item-date")
                .html(endTimelineDate)
                .appendTo(endTimelineItem);

            $("<div/>")
                .addClass("timeline-item-divider")
                .appendTo(endTimelineItem);
        }

        // Build antispam view
        var antispamContent = $("#antispam-content");
        var list;
        var ul;

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
        var otherContent = $("#other-content");

        for (i = 0; i < viewModel.otherHeaders.otherRows.length; i++) {
            if (viewModel.otherHeaders.otherRows[i].value) {
                var headerName = $("<div/>")
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

    function addSpamReportRow(spamRow, parent) {
        if (spamRow.value) {
            var item = $("<li/>")
                .addClass("accordion-item")
                .appendTo(parent);

            var link = $("<a/>")
                .addClass("item-content")
                .addClass("item-link")
                .attr("href", "#")
                .appendTo(item);

            var innerItem = $("<div/>")
                .addClass("item-inner")
                .appendTo(link);

            $("<div/>")
                .addClass("item-title")
                .text(spamRow.label)
                .appendTo(innerItem);

            var itemContent = $("<div/>")
                .addClass("accordion-item-content")
                .appendTo(item);

            var contentBlock = $("<div/>")
                .addClass("content-block")
                .appendTo(itemContent);

            var linkWrap = $("<p/>")
                .appendTo(contentBlock);

            $($.parseHTML(spamRow.valueUrl))
                .addClass("external")
                .appendTo(linkWrap);
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

    function updateStatus(message) {
        if (myApp) {
            myApp.hidePreloader();
            myApp.showPreloader(message);
        }
    }

    // Handles rendering of an error.
    // Does not log the error - caller is responsible for calling PostError
    function showError(error, message) {
        if (myApp) {
            myApp.hidePreloader();
            myApp.alert(message, "An Error Occurred");
        }
    }
})();