var oldHeight = 0;
var oldWidth = 0;

if (window.jQuery) {
    $(window).resize(function () {
        var newHeight = $(window).height();
        var newWidth = $(window).width();
        var doResize = (newHeight !== oldHeight) || (newWidth !== oldWidth);
        oldHeight = newHeight;
        oldWidth = newWidth;
        recalcLayout(doResize);
    });
}

// Adjusts locations and dimensions of our divs without rebuilding content
function recalcLayout(doResize) {
    positionResponse();
    fixProgressHeight();
}

// Adjusts response under our linebreak
function positionResponse() {
    var top = $("#lineBreak")[0].offsetTop + $("#lineBreak").height();
    $("#response").css("top", top + 15);
}

function fixProgressHeight() {
    // Remove the old height
    $(".hotBarContainer").removeAttr("style");
    // Tag the new one
    $(".hotBarCell").each(function (i) {
        $(this).find(".hotBarContainer").height($(this).height());
    });
}

// Rebuilds content and recalculates what sections and divs should be displayed
function rebuildSections() {
    populateTables();
    recalcVisibility();
}

function recalcVisibility() {
    for (var i = 0 ; i < visibilityBindings.length ; i++) {
        makeVisible(visibilityBindings[i][0], visibilityBindings[i][1]());
    }
}

function updateStatus(status) {
    $("#status").text(status);
    if (viewModel !== null) {
        viewModel._status = status;
    }

    positionResponse();
    recalcVisibility();
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

        var tds = $(this).parents("table").find("tr td:nth-child(" + (i + 1) + ")");
        tds.each(function (j) {
            if (this.innerHTML !== "") {
                keep++;
            }
        });

        if (keep === 0) {
            $(this).addClass("emptyColumn");
            tds.addClass("emptyColumn");
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
    recalcVisibility();
    recalcLayout(true);
}

function toggleCollapse(obj) {
    $(".collapsibleElement", $(obj).parents(".collapsibleWrapper")).toggle();
    recalcLayout(true);
}

// Wraps a div(textarea, etc) into a collapsible pane with a title
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

    header.bind("click", function () { viewModel.doSort(table, id); });
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

function makeSummaryTable(name, rows) {
    var antiSpamDiv = $(name);
    if (antiSpamDiv) {
        antiSpamDiv.addClass("summaryList");

        for (var i = 0 ; i < rows.length ; i++) {
            var id = rows[i].header;
            var row = document.createElement("tr");
            if (row !== null && id !== null) {
                row.id = id;
                antiSpamDiv.append(row); // Must happen before we append cells to appease IE7
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
    $("#" + table).attr("data-colName", colName);
    $("#" + table).attr("data-sortOrder", sortOrder);

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

    var i;
    var row;
    restoreTable("otherHeaders");
    for (i = 0 ; i < viewModel.otherHeaders.length ; i++) {
        row = document.createElement("tr");
        $("#otherHeaders").append(row); // Must happen before we append cells to appease IE7
        appendCell(row, viewModel.otherHeaders[i].number, null, null);
        appendCell(row, viewModel.otherHeaders[i].header, viewModel.otherHeaders[i].url, null);
        appendCell(row, viewModel.otherHeaders[i].value, null, "allowBreak");
    }

    $("#otherHeaders tbody tr:odd").addClass("oddRow");

    restoreTable("receivedHeaders");
    for (i = 0 ; i < viewModel.receivedHeaders.length ; i++) {
        row = document.createElement("tr");
        $("#receivedHeaders").append(row); // Must happen before we append cells to appease IE7
        appendCell(row, viewModel.receivedHeaders[i].hop, null, null);
        appendCell(row, viewModel.receivedHeaders[i].from, null, null);
        appendCell(row, viewModel.receivedHeaders[i].by, null, null);
        appendCell(row, viewModel.receivedHeaders[i].date, null, null);
        var labelClass = "hotBarLabel";
        if (viewModel.receivedHeaders[i].delaySort < 0) {
            labelClass += " negativeCell";
        }

        var hotBar =
        "<div class='hotBarContainer'>" +
        "   <div class='" + labelClass + "'>" + viewModel.receivedHeaders[i].delay + "</div>" +
        "   <div class='hotBarBar' style='width:" + viewModel.receivedHeaders[i].percent + "%'></div>" +
        "</div>";
        appendCell(row, null, hotBar, "hotBarCell");
        appendCell(row, viewModel.receivedHeaders[i]._with, null, null);
        appendCell(row, viewModel.receivedHeaders[i].id, null, "extraCol");
        appendCell(row, viewModel.receivedHeaders[i]._for, null, "extraCol");
        appendCell(row, viewModel.receivedHeaders[i].via, null, "extraCol");
    }

    $("#receivedHeaders tbody tr:odd").addClass("oddRow");
    hideEmptyColumns("receivedHeaders");
}

var visibilityBindings = [
["#lineBreak", function () { return viewModel._status || viewModel.summary.exists() || viewModel.receivedHeaders.length || viewModel.otherHeaders.length; }],
["#response", function () { return viewModel._status || viewModel.summary.exists() || viewModel.receivedHeaders.length || viewModel.otherHeaders.length; }],
["#status", function () { return viewModel._status; }],
[".extraCol", function () { return viewModel.showExtra; }],
["#clearButton", function () { return viewModel.hasData; }],
];