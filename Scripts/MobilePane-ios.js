// Framework7 app object
var myApp = null;
var viewModel = null;
var Office = null;
var LogError = null;

// The Office initialize function must be run each time a new page is loaded
$(document).ready(function () {
    try {
        Office = window.parent.Office;
        LogError = window.parent.LogError;
        viewModel = new HeaderModel();
        initializeFramework7();
        updateStatus(ImportedStrings.mha_loading);
        sendHeadersRequest();
    }
    catch (e) {
        updateStatus(e);
    }
});

function initializeFramework7() {
    myApp = new Framework7();

    myApp.addView("#summary-view");
    myApp.addView("#received-view");
    myApp.addView("#antispam-view");
    myApp.addView("#other-view");
}

function getHeadersComplete(headers) {
    viewModel.parseHeaders(headers);
    buildViews();
}

function buildViews() {
    // Build summary view
    var summaryContent = $("#summary-content");
    var contentBlock;
    var headerVal;
    var pre;

    for (var i = 0; i < viewModel.summary.summaryRows.length; i++) {
        if (viewModel.summary.summaryRows[i].get()) {
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
                .text(viewModel.summary.summaryRows[i].get())
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

                var progressWrap = $("<p/>")
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
    if (spamRow.get()) {
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

        contentBlock = $("<div/>")
            .addClass("content-block")
            .appendTo(itemContent);

        var linkWrap = $("<p/>")
            .appendTo(contentBlock);

        var linkVal = mapHeaderToURL(spamRow.url, spamRow.get());

        $($.parseHTML(linkVal))
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
    myApp.hidePreloader();
    myApp.showPreloader(message);
}

function hideStatus() {
    myApp.hidePreloader();
}

function showError(error, message) {
    LogError(error, message);
    myApp.alert(message, "An Error Occurred");
}