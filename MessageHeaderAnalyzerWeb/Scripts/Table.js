var oldHeight = 0;
var oldWidth = 0;

if (window.jQuery) {
    $(window).resize(function () {
        var newHeight = $(window).height();
        var newWidth = $(window).width();
        var doResize = (newHeight !== oldHeight) || (newWidth !== oldWidth);
        oldHeight = newHeight;
        oldWidth = newWidth;
        recalculateLayout(doResize);
    });
}

// Adjusts locations and dimensions of our response and progress without rebuilding content
function recalculateLayout(doResize) {
    positionResponse();

    // Remove the old height
    $(".hotBarContainer").removeAttr("style");
    // Tag the new one
    $(".hotBarCell").each(function (i) {
        $(this).find(".hotBarContainer").height($(this).height());
    });
}

// Adjusts response under our lineBreak
function positionResponse() {
    var responseTop = $("#lineBreak")[0].offsetTop + $("#lineBreak").height();
    $("#response").css("top", responseTop + 15);
}

// Rebuilds content and recalculates what sections should be displayed
function rebuildSections() {
    populateTables();
    recalculateVisibility();
}

function recalculateVisibility() {
    for (var i = 0 ; i < visibilityBindings.length ; i++) {
        makeVisible(visibilityBindings[i][0], visibilityBindings[i][1]());
    }
}

function updateStatus(statusText) {
    $("#status").text(statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    positionResponse();
    recalculateVisibility();
}

function hideStatus() {
    updateStatus("");
}

// Restores table to empty state so we can repopulate it
function restoreTable(id) {
    $("#" + id + " tbody tr").remove(); // Remove the rows
    $("#" + id + " th").removeClass("emptyColumn"); // Restore header visibility
    $("#" + id + " th").removeClass("hiddenElement"); // Restore header visibility
}

function hideEmptyColumns(id) {
    $("#" + id + " th").each(function (i) {
        var keep = 0;

        // Find a child cell which has data
        var children = $(this).parents("table").find("tr td:nth-child(" + (i + 1).toString() + ")");
        children.each(function (j) {
            if (this.innerHTML !== "") {
                keep++;
            }
        });

        if (keep === 0) {
            $(this).addClass("emptyColumn");
            children.addClass("emptyColumn");
        }
    });
}

function hideExtraColumns() {
    $("#leftArrow").addClass("hiddenElement");
    $("#rightArrow").removeClass("hiddenElement");
}

function showExtraColumns() {
    $("#rightArrow").addClass("hiddenElement");
    $("#leftArrow").removeClass("hiddenElement");
}

function toggleExtraColumns() {
    viewModel.showExtra = !viewModel.showExtra;

    if (viewModel.showExtra) {
        showExtraColumns();
    } else {
        hideExtraColumns();
    }
    recalculateVisibility();
    recalculateLayout(true);
}

function toggleCollapse(object) {
    $(".collapsibleElement", $(object).parents(".collapsibleWrapper")).toggle();
    recalculateLayout(true);
}

// Wraps an element into a collapsible pane with a title
function makeResizablePane(id, title, visibility) {
    var pane = $("#" + id);
    if (pane.hasClass("collapsibleElement")) {
        return;
    }
    var hidden = pane.hasClass("hiddenElement");

    pane.addClass("collapsibleElement");
    var wrap = $(document.createElement("div"));
    wrap.addClass("collapsibleWrapper");
    if (visibility) {
        wrap.attr("id", id + "Wrapper");
        visibilityBindings.push(["#" + id + "Wrapper", visibility]);
    }
    var header = $(document.createElement("div"));
    header.addClass("sectionHeader");
    header.bind("click", function () { toggleCollapse(this); });
    header.text(title);

    var moreSpan = $(document.createElement("span"));
    moreSpan.addClass("collapsibleSwitch");
    moreSpan.addClass("collapsibleElement");
    moreSpan.html("+&nbsp;");

    var lessSpan = $(document.createElement("span"));
    lessSpan.addClass("collapsibleSwitch");
    lessSpan.addClass("collapsibleElement");
    lessSpan.html("&ndash;&nbsp;");

    // Now that everything is built, put it together
    pane.wrap(wrap);
    pane.before(header);
    header.append(moreSpan);
    header.append(lessSpan);
    if (hidden) {
        lessSpan.hide();
    } else {
        moreSpan.hide();
    }
}

// Wraps a table into a collapsible table with a title
function makeResizableTable(id, title, visibility) {
    var pane = $("#" + id);
    if (pane.hasClass("collapsibleElement")) { return; }

    pane.addClass("collapsibleElement");
    var wrap = $(document.createElement("div"));
    wrap.addClass("collapsibleWrapper");
    if (visibility) {
        wrap.attr("id", id + "Wrapper");
        visibilityBindings.push(["#" + id + "Wrapper", visibility]);
    }

    var header = $(document.createElement("div"));
    header.addClass("tableCaption");
    header.bind("click", function () { toggleCollapse(this); });
    header.text(title);

    var moreSpan = $(document.createElement("span"));
    moreSpan.addClass("collapsibleSwitch");
    moreSpan.html("+&nbsp;");
    header.append(moreSpan);
    header.addClass("collapsibleElement");

    var captionDiv = $(document.createElement("div"));
    captionDiv.addClass("tableCaption");
    captionDiv.bind("click", function () { toggleCollapse(this); });
    captionDiv.text(title);

    var lessSpan = $(document.createElement("span"));
    lessSpan.addClass("collapsibleSwitch");
    lessSpan.html("&ndash;&nbsp;");
    captionDiv.append(lessSpan);

    // Now that everything is built, put it together
    pane.wrap(wrap);
    pane.before(header);
    var caption = $(pane[0].createCaption());
    caption.prepend(captionDiv);
    header.hide();
}

function makeSortableColumn(table, id) {
    var header = $("#" + id);

    header.bind("click", function () { viewModel[table].doSort(id); });
    var downSpan = $(document.createElement("span"));
    downSpan.addClass("downArrow");
    downSpan.addClass("hiddenElement");
    downSpan.html("&darr;");
    var upSpan = $(document.createElement("span"));
    upSpan.addClass("upArrow");
    upSpan.addClass("hiddenElement");
    upSpan.html("&uarr;");

    // Now that everything is built, put it together
    header.append(downSpan);
    header.append(upSpan);
}

function makeSummaryTable(summaryName, rows) {
    var summaryList = $(summaryName);
    if (summaryList) {
        summaryList.addClass("summaryList");

        for (var i = 0 ; i < rows.length ; i++) {
            var id = rows[i].header;
            var row = document.createElement("tr");
            if (row !== null && id !== null) {
                row.id = id;
                summaryList.append(row); // Must happen before we append cells to appease IE7
                var headerCell = $(row.insertCell(-1));
                if (headerCell) {
                    headerCell.text(rows[i].label);
                    headerCell.addClass("summaryHeader");
                }

                var valCell = $(row.insertCell(-1));
                if (valCell) {
                    valCell.attr("id", id + "Val");
                }

                visibilityBindings.push(["#" + id, rows[i].get]);
            }
        }
    }
}

function makeVisible(id, visible) {
    if (visible) {
        $(id).removeClass("hiddenElement");
    } else {
        $(id).addClass("hiddenElement");
    }
}

function appendCell(row, text, html, _class) {
    var cell = $(row.insertCell(-1));
    if (text) { cell.text(text); }
    if (html) { cell.html(html); }
    if (_class) { cell.addClass(_class); }
}

function setArrows(table, colName, sortOrder) {
    $("#" + table + " .tableHeader .downArrow").addClass("hiddenElement");
    $("#" + table + " .tableHeader .upArrow").addClass("hiddenElement");

    if (sortOrder === 1) {
        $("#" + table + " .tableHeader #" + colName + " .downArrow").removeClass("hiddenElement");
    } else {
        $("#" + table + " .tableHeader #" + colName + " .upArrow").removeClass("hiddenElement");
    }
};

function populateTables() {
    // Summary
    viewModel.summary.populateTable();

    // AntiSpam Report
    viewModel.antiSpamReport.populateTable();

    // Original headers
    $("#originalHeaders").text(viewModel.originalHeaders);

    // Received
    viewModel.receivedHeaders.populateTable();

    // Other
    viewModel.otherHeaders.populateTable();
}

var visibilityBindings = [
["#lineBreak", function () { return viewModel.status || viewModel.summary.exists() || viewModel.receivedHeaders.exists() || viewModel.otherHeaders.length; }],
["#response", function () { return viewModel.status || viewModel.summary.exists() || viewModel.receivedHeaders.exists() || viewModel.otherHeaders.length; }],
["#status", function () { return viewModel.status; }],
[".extraCol", function () { return viewModel.showExtra; }],
["#clearButton", function () { return viewModel.hasData; }],
];