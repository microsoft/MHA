/* global $ */
/* global mhaStrings */
/* exported Table */

var Table = (function () {
    var viewModel = null;
    var showExtra = false;
    var column = function (id, label, columnClass) { return { id: id, label: label, class: columnClass }; };

    var visibilityBindings = [
        ["#lineBreak", function () { return viewModel.status || viewModel.summary.exists() || viewModel.receivedHeaders.exists() || viewModel.otherHeaders.exists(); }],
        ["#response", function () { return viewModel.status || viewModel.summary.exists() || viewModel.receivedHeaders.exists() || viewModel.otherHeaders.exists(); }],
        ["#status", function () { return viewModel.status; }],
        [".extraCol", function () { return showExtra; }],
        ["#clearButton", function () { return viewModel.hasData; }]
    ];

    // Initializes the UI with a viewModel
    function initializeTableUI(_viewModel) {
        viewModel = _viewModel;

        // Headers
        makeResizablePane("originalHeaders", mhaStrings.mha_originalHeaders, function () { return viewModel.originalHeaders.length; });
        $(".collapsibleElement", $("#originalHeaders").parents(".collapsibleWrapper")).toggle();

        // Summary
        makeResizablePane("summary", mhaStrings.mha_summary, function () { return viewModel.summary.exists(); });
        makeSummaryTable("#summary", viewModel.summary.summaryRows, "SUM");

        // Received
        makeResizableTable("receivedHeaders", mhaStrings.mha_receivedHeaders, function () { return viewModel.receivedHeaders.exists(); });

        var receivedColumns = [
            column("hop", mhaStrings.mha_hop, null),
            column("from", mhaStrings.mha_submittingHost, null),
            column("by", mhaStrings.mha_receivingHost, null),
            column("date", mhaStrings.mha_time, null),
            column("delay", mhaStrings.mha_delay, null),
            column("with", mhaStrings.mha_type, null),
            column("id", mhaStrings.mha_id, "extraCol"),
            column("for", mhaStrings.mha_for, "extraCol"),
            column("via", mhaStrings.mha_via, "extraCol")
        ];

        addColumns("receivedHeaders", receivedColumns);

        var withColumn = $("#receivedHeaders #with");
        if (withColumn !== null) {
            var leftSpan = $(document.createElement("span"));
            leftSpan.attr("id", "leftArrow");
            leftSpan.addClass("collapsibleArrow");
            leftSpan.addClass("hiddenElement");
            leftSpan.html("&lArr;");

            var rightSpan = $(document.createElement("span"));
            rightSpan.attr("id", "rightArrow");
            rightSpan.addClass("collapsibleArrow");
            rightSpan.html("&rArr;");

            withColumn.append(leftSpan);
            withColumn.append(rightSpan);
        }

        $("#receivedHeaders .collapsibleArrow").bind("click", function (eventObject) {
            toggleExtraColumns();
            eventObject.stopPropagation();
        });

        // FFAS
        makeResizablePane("forefrontAntiSpamReport", mhaStrings.mha_forefrontAntiSpamReport, function () { return viewModel.forefrontAntiSpamReport.exists(); });
        makeSummaryTable("#forefrontAntiSpamReport", viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows, "FFAS");

        // AntiSpam
        makeResizablePane("antiSpamReport", mhaStrings.mha_antiSpamReport, function () { return viewModel.antiSpamReport.exists(); });
        makeSummaryTable("#antiSpamReport", viewModel.antiSpamReport.antiSpamRows, "AS");

        // Other
        makeResizableTable("otherHeaders", mhaStrings.mha_otherHeaders, function () { return viewModel.otherHeaders.otherRows.length; });

        var otherColumns = [
            column("number", mhaStrings.mha_number, null),
            column("header", mhaStrings.mha_header, null),
            column("value", mhaStrings.mha_value, null)
        ];

        addColumns("otherHeaders", otherColumns);

        resetArrows();
        rebuildSections(viewModel);
    }

    // Rebuilds the UI with a new viewModel
    function rebuildTables(_viewModel) {
        viewModel = _viewModel;
        rebuildSections(viewModel);
        hideExtraColumns();
    }

    // Rebuilds content and recalculates what sections should be displayed
    function rebuildSections(_viewModel) {
        viewModel = _viewModel;

        var i;
        var row;

        // Summary
        for (i = 0; i < viewModel.summary.summaryRows.length; i++) {
            setRowValue(viewModel.summary.summaryRows[i], "SUM");
        }

        // Received
        emptyTableUI("receivedHeaders");
        for (i = 0; i < viewModel.receivedHeaders.receivedRows.length; i++) {
            row = document.createElement("tr");
            $("#receivedHeaders").append(row); // Must happen before we append cells to appease IE7
            appendCell(row, viewModel.receivedHeaders.receivedRows[i].hop, null, null);
            appendCell(row, viewModel.receivedHeaders.receivedRows[i].from, null, null);
            appendCell(row, viewModel.receivedHeaders.receivedRows[i].by, null, null);
            appendCell(row, viewModel.receivedHeaders.receivedRows[i].date, null, null);
            var labelClass = "hotBarLabel";
            if (viewModel.receivedHeaders.receivedRows[i].delaySort < 0) {
                labelClass += " negativeCell";
            }

            var hotBar =
                "<div class='hotBarContainer'>" +
                "   <div class='" + labelClass + "'>" + viewModel.receivedHeaders.receivedRows[i].delay + "</div>" +
                "   <div class='hotBarBar' style='width:" + viewModel.receivedHeaders.receivedRows[i].percent + "%'></div>" +
                "</div>";
            appendCell(row, null, hotBar, "hotBarCell");
            appendCell(row, viewModel.receivedHeaders.receivedRows[i].with, null, null);
            appendCell(row, viewModel.receivedHeaders.receivedRows[i].id, null, "extraCol");
            appendCell(row, viewModel.receivedHeaders.receivedRows[i].for, null, "extraCol");
            appendCell(row, viewModel.receivedHeaders.receivedRows[i].via, null, "extraCol");
        }

        // Calculate heights for the hotbar cells (progress bars in Delay column)
        // Not clear why we need to do this
        $(".hotBarCell").each(function () {
            $(this).find(".hotBarContainer").height($(this).height());
        });

        $("#receivedHeaders tbody tr:odd").addClass("oddRow");
        hideEmptyColumns("receivedHeaders");

        // Forefront AntiSpam Report
        for (i = 0; i < viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length; i++) {
            setRowValue(viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i], "FFAS");
        }

        // AntiSpam Report
        for (i = 0; i < viewModel.antiSpamReport.antiSpamRows.length; i++) {
            setRowValue(viewModel.antiSpamReport.antiSpamRows[i], "AS");
        }

        // Other
        emptyTableUI("otherHeaders");
        for (i = 0; i < viewModel.otherHeaders.otherRows.length; i++) {
            row = document.createElement("tr");
            $("#otherHeaders").append(row); // Must happen before we append cells to appease IE7
            appendCell(row, viewModel.otherHeaders.otherRows[i].number, null, null);
            appendCell(row, viewModel.otherHeaders.otherRows[i].header, viewModel.otherHeaders.otherRows[i].url, null);
            appendCell(row, viewModel.otherHeaders.otherRows[i].value, null, "allowBreak");
        }

        $("#otherHeaders tbody tr:odd").addClass("oddRow");

        // Original headers
        $("#originalHeaders").text(viewModel.originalHeaders);

        recalculateVisibility();
    }

    // Adjusts response under our lineBreak
    function positionResponse() {
        var responseTop = $("#lineBreak")[0].offsetTop + $("#lineBreak").height();
        $("#response").css("top", responseTop + 15);
    }

    function recalculateVisibility() {
        for (var i = 0; i < visibilityBindings.length; i++) {
            makeVisible(visibilityBindings[i][0], visibilityBindings[i][1]());
        }

        positionResponse();
    }

    // Restores table to empty state so we can repopulate it
    function emptyTableUI(id) {
        $("#" + id + " tbody tr").remove(); // Remove the rows
        $("#" + id + " th").removeClass("emptyColumn"); // Restore header visibility
        $("#" + id + " th").removeClass("hiddenElement"); // Restore header visibility
    }

    function hideEmptyColumns(id) {
        $("#" + id + " th").each(function (i) {
            var keep = 0;

            // Find a child cell which has data
            var children = $(this).parents("table").find("tr td:nth-child(" + (i + 1).toString() + ")");
            children.each(function () {
                if (this.innerHTML !== "") {
                    keep++;
                }
            });

            if (keep === 0) {
                $(this).addClass("emptyColumn");
                children.addClass("emptyColumn");
            } else {
                $(this).removeClass("emptyColumn");
                children.removeClass("emptyColumn");
            }
        });
    }

    function hideExtraColumns() {
        showExtra = false;
        $("#leftArrow").addClass("hiddenElement");
        $("#rightArrow").removeClass("hiddenElement");
    }

    function showExtraColumns() {
        showExtra = true;
        $("#rightArrow").addClass("hiddenElement");
        $("#leftArrow").removeClass("hiddenElement");
    }

    function toggleExtraColumns() {
        if (showExtra) {
            hideExtraColumns();
        } else {
            showExtraColumns();
        }

        recalculateVisibility();
    }

    function toggleCollapse(object) {
        $(".collapsibleElement", $(object).parents(".collapsibleWrapper")).toggle();
        positionResponse();
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

        var tbody = $(document.createElement("tbody"));

        // Now that everything is built, put it together
        pane.wrap(wrap);
        pane.before(header);
        pane.append(tbody);
        var caption = $(pane[0].createCaption());
        caption.prepend(captionDiv);
        header.hide();
    }

    function addColumns(tableName, columns) {
        var tableHeader = $(document.createElement("thead"));
        if (tableHeader !== null) {
            $("#" + tableName).append(tableHeader);

            var headerRow = $(document.createElement("tr"));
            if (headerRow !== null) {
                headerRow.addClass("tableHeader");
                tableHeader.append(headerRow); // Must happen before we append cells to appease IE7

                for (var i = 0; i < columns.length; i++) {
                    var headerCell = $(document.createElement("th"));
                    if (headerCell !== null) {
                        headerCell.attr("id", columns[i].id);
                        headerCell.text(columns[i].label);
                        if (columns[i].class !== null) {
                            headerCell.addClass(columns[i].class);
                        }

                        headerRow.append(headerCell);
                    }

                    makeSortableColumn(tableName, columns[i].id);
                }
            }
        }
    }

    function makeSortableColumn(table, id) {
        var header = $("#" + id);

        header.bind("click", function () {
            viewModel[table].doSort(id);
            setArrows(viewModel[table].tableName, viewModel[table].sortColumn,
                viewModel[table].sortOrder);
            rebuildSections(viewModel);
        });

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

    function makeSummaryTable(summaryName, rows, tag) {
        var summaryList = $(summaryName);
        if (summaryList) {
            summaryList.addClass("summaryList");

            for (var i = 0; i < rows.length; i++) {
                var id = rows[i].header + tag;
                var row = document.createElement("tr");
                if (row !== null) {
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

                    makeVisible("#" + id, false);
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

    function appendCell(row, text, html, cellClass) {
        var cell = $(row.insertCell(-1));
        if (text) { cell.text(text); }
        if (html) { cell.html(html); }
        if (cellClass) { cell.addClass(cellClass); }
    }

    function resetArrows() {
        setArrows("receivedHeaders", "hop", 1);
        setArrows("otherHeaders", "number", 1);
    }

    function setArrows(table, colName, sortOrder) {
        $("#" + table + " .tableHeader .downArrow").addClass("hiddenElement");
        $("#" + table + " .tableHeader .upArrow").addClass("hiddenElement");

        if (sortOrder === 1) {
            $("#" + table + " .tableHeader #" + colName + " .downArrow").removeClass("hiddenElement");
        } else {
            $("#" + table + " .tableHeader #" + colName + " .upArrow").removeClass("hiddenElement");
        }
    }

    function setRowValue(row, type) {
        var headerVal = $("#" + row.header + type + "Val");
        if (headerVal) {
            if (row.value) {
                if (row.url) {
                    headerVal.html(mhaStrings.mapHeaderToURL(row.url, row.value));
                } else if (row.valueUrl) {
                    headerVal.html(row.valueUrl);
                }else {
                    headerVal.text(row.value);
                }

                makeVisible("#" + row.header + type, true);
            } else {
                headerVal.text(null);
                makeVisible("#" + row.header + type, false);
            }
        }
    }

    return {
        initializeTableUI: initializeTableUI, // Initialize UI with an empty viewModel
        makeResizablePane: makeResizablePane,
        rebuildSections: rebuildSections, // Repopulate the UI with the current viewModel
        rebuildTables: rebuildTables, // Used by Standalone.js and Default.js to rebuild with new viewModel
        recalculateVisibility: recalculateVisibility, // Recompute visibility with the current viewModel. Does not repopulate.
        resetArrows: resetArrows
    }
})();