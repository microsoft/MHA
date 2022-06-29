import * as $ from "jquery";
import { HeaderModel } from "./Headers";
import { mhaStrings } from "./mhaStrings";
import { row } from "./Summary";
import { iTable } from "./itable";
import { ReceivedRow } from "./Received";
import { OtherRow } from "./Other";

class column {
    constructor(id: string, label: string, columnClass: string) {
        this.id = id;
        this.label = label;
        this.class = columnClass;
    }
    id: string;
    label: string;
    class: string;
}

type Binding = {
    name: string;
    visible: (table: Table) => boolean;
}

export class Table {
    private viewModel: HeaderModel;
    private showExtra: boolean = false;

    private visibilityBindings: Binding[] = [
        { name: "#lineBreak", visible: function (table: Table) { return table.viewModel.hasData; } },
        { name: "#response", visible: function (table: Table) { return table.viewModel.hasData; } },
        { name: "#status", visible: function (table: Table) { return !!table.viewModel.status; } },
        { name: ".extraCol", visible: function (table: Table) { return table.showExtra; } },
        { name: "#clearButton", visible: function (table: Table) { return table.viewModel.hasData; } },
        { name: "#copyButton", visible: function (table: Table) { return table.viewModel.hasData; } }
    ];

    // Adjusts response under our lineBreak
    private positionResponse(): void {
        const responseTop = $("#lineBreak")[0].offsetTop + $("#lineBreak").height();
        $("#response").css("top", responseTop + 15);
    }

    private toggleCollapse(object: HTMLElement): void {
        $(".collapsibleElement", $(object).parents(".collapsibleWrapper")).toggle();
        this.positionResponse();
    }

    // Wraps an element into a collapsible pane with a title
    public makeResizablePane(id: string, title: string, visibility: (table: Table) => boolean): void {
        const pane = $("#" + id);
        if (pane.hasClass("collapsibleElement")) {
            return;
        }
        const hidden = pane.hasClass("hiddenElement");

        pane.addClass("collapsibleElement");
        const wrap = $(document.createElement("div"));
        wrap.addClass("collapsibleWrapper");
        if (visibility) {
            wrap.attr("id", id + "Wrapper");
            this.visibilityBindings.push({ name: "#" + id + "Wrapper", visible: visibility });
        }
        const header = $(document.createElement("div"));
        header.addClass("sectionHeader");
        header.bind("click", this, function (eventObject) {
            var table: Table = eventObject.data as Table;
            if (table) {
                table.toggleCollapse(eventObject.currentTarget);
            }
        });
        header.text(title);

        const moreSpan = $(document.createElement("span"));
        moreSpan.addClass("collapsibleSwitch");
        moreSpan.addClass("collapsibleElement");
        moreSpan.html("+&nbsp;");

        const lessSpan = $(document.createElement("span"));
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

    private makeVisible(id: string, visible: boolean): void {
        if (visible) {
            $(id).removeClass("hiddenElement");
        } else {
            $(id).addClass("hiddenElement");
        }
    }

    private makeSummaryTable(summaryName: string, rows: row[], tag: string): void {
        const summaryList = $(summaryName);
        if (summaryList) {
            summaryList.addClass("summaryList");

            rows.forEach((summaryRow: row) => {
                const id = summaryRow.header + tag;
                const row = document.createElement("tr");
                if (row !== null) {
                    row.id = id;
                    summaryList.append(row); // Must happen before we append cells to appease IE7
                    const headerCell = $(row.insertCell(-1));
                    if (headerCell) {
                        if (summaryRow.url) {
                            headerCell.html(summaryRow.url);
                        } else {
                            headerCell.text(summaryRow.label);
                        }
                        headerCell.addClass("summaryHeader");
                    }

                    const valCell = $(row.insertCell(-1));
                    if (valCell) {
                        valCell.attr("id", id + "Val");
                    }

                    this.makeVisible("#" + id, false);
                }
            });
        }
    }

    private setArrows(table: string, colName: string, sortOrder: number): void {
        $("#" + table + " .tableHeader .downArrow").addClass("hiddenElement");
        $("#" + table + " .tableHeader .upArrow").addClass("hiddenElement");

        if (sortOrder === 1) {
            $("#" + table + " .tableHeader #" + colName + " .downArrow").removeClass("hiddenElement");
        } else {
            $("#" + table + " .tableHeader #" + colName + " .upArrow").removeClass("hiddenElement");
        }
    }

    private setRowValue(row: row, type: string): void {
        const headerVal = $("#" + row.header + type + "Val");
        if (headerVal) {
            if (row.value) {
                if (row.valueUrl) {
                    headerVal.html(row.valueUrl);
                } else {
                    headerVal.text(row.value);
                }

                this.makeVisible("#" + row.header + type, true);
            } else {
                headerVal.text("");
                this.makeVisible("#" + row.header + type, false);
            }
        }
    }

    private appendCell(row: HTMLTableRowElement, text: string, html: string, cellClass: string): void {
        const cell = $(row.insertCell(-1));
        if (text) { cell.text(text); }
        if (html) { cell.html(html); }
        if (cellClass) { cell.addClass(cellClass); }
    }

    // Restores table to empty state so we can repopulate it
    private emptyTableUI(id: string): void {
        $("#" + id + " tbody tr").remove(); // Remove the rows
        $("#" + id + " th").removeClass("emptyColumn"); // Restore header visibility
        $("#" + id + " th").removeClass("hiddenElement"); // Restore header visibility
    }

    // Recompute visibility with the current viewModel. Does not repopulate.
    public recalculateVisibility(): void {
        this.visibilityBindings.forEach((binding: Binding) => {
            this.makeVisible(binding.name, binding.visible(this));
        });

        this.positionResponse();
    }

    private hideEmptyColumns(id: string): void {
        $("#" + id + " th").each(function (i) {
            let keep = 0;

            // Find a child cell which has data
            const children = $(this).parents("table").find("tr td:nth-child(" + (i + 1).toString() + ")");
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

    // Rebuilds content and recalculates what sections should be displayed
    // Repopulate the UI with the current viewModel
    public rebuildSections(_viewModel: HeaderModel): void {
        this.viewModel = _viewModel;

        // Summary
        this.viewModel.summary.rows.forEach((row: row) => {
            this.setRowValue(row, "SUM");
        });

        // Received
        this.emptyTableUI("receivedHeaders");
        this.viewModel.receivedHeaders.receivedRows.forEach((receivedRow: ReceivedRow) => {
            let row: HTMLTableRowElement = document.createElement("tr");
            $("#receivedHeaders").append(row); // Must happen before we append cells to appease IE7
            this.appendCell(row, receivedRow.hop.value, "", "");
            this.appendCell(row, receivedRow.from.value, "", "");
            this.appendCell(row, receivedRow.by.value, "", "");
            this.appendCell(row, receivedRow.date.value, "", "");
            let labelClass = "hotBarLabel";
            if (receivedRow.delaySort.value < 0) {
                labelClass += " negativeCell";
            }

            const hotBar =
                "<div class='hotBarContainer'>" +
                "   <div class='" + labelClass + "'>" + receivedRow.delay + "</div>" +
                "   <div class='hotBarBar' style='width:" + receivedRow.percent + "%'></div>" +
                "</div>";
            this.appendCell(row, "", hotBar, "hotBarCell");
            this.appendCell(row, receivedRow.with.value, "", "");
            this.appendCell(row, receivedRow.id.value, "", "extraCol");
            this.appendCell(row, receivedRow.for.value, "", "extraCol");
            this.appendCell(row, receivedRow.via.value, "", "extraCol");
        });

        // Calculate heights for the hotbar cells (progress bars in Delay column)
        // Not clear why we need to do this
        $(".hotBarCell").each(function () {
            $(this).find(".hotBarContainer").height($(this).height());
        });

        $("#receivedHeaders tbody tr:odd").addClass("oddRow");
        this.hideEmptyColumns("receivedHeaders");

        // Forefront AntiSpam Report
        this.viewModel.forefrontAntiSpamReport.rows.forEach((row: row) => {
            this.setRowValue(row, "FFAS");
        });

        // AntiSpam Report
        this.viewModel.antiSpamReport.rows.forEach((row: row) => {
            this.setRowValue(row, "AS");
        });

        // Other
        this.emptyTableUI("otherHeaders");
        this.viewModel.otherHeaders.rows.forEach((otherRow: OtherRow) => {
            let row: HTMLTableRowElement = document.createElement("tr");
            $("#otherHeaders").append(row); // Must happen before we append cells to appease IE7
            this.appendCell(row, otherRow.number.toString(), "", "");
            this.appendCell(row, otherRow.header, otherRow.url, "");
            this.appendCell(row, otherRow.value, "", "allowBreak");
        });

        $("#otherHeaders tbody tr:odd").addClass("oddRow");

        // Original headers
        $("#originalHeaders").text(this.viewModel.originalHeaders);

        this.recalculateVisibility();
    }

    private makeSortableColumn(tableName: string, id: string): void {
        const header = $("#" + id);

        header.bind("click", this, function (eventObject) {
            var table: Table = eventObject.data as Table;
            if (table) {
                if (table.viewModel[tableName] instanceof iTable) {
                    let itable = table.viewModel[tableName] as iTable;
                    itable.doSort(id);
                    table.setArrows(itable.tableName, itable.sortColumn,
                        itable.sortOrder);
                    table.rebuildSections(table.viewModel);
                }
            }
        });

        const downSpan = $(document.createElement("span"));
        downSpan.addClass("downArrow");
        downSpan.addClass("hiddenElement");
        downSpan.html("&darr;");

        const upSpan = $(document.createElement("span"));
        upSpan.addClass("upArrow");
        upSpan.addClass("hiddenElement");
        upSpan.html("&uarr;");

        // Now that everything is built, put it together
        header.append(downSpan);
        header.append(upSpan);
    }

    private addColumns(tableName: string, columns: column[]): void {
        const tableHeader = $(document.createElement("thead"));
        if (tableHeader !== null) {
            $("#" + tableName).append(tableHeader);

            const headerRow = $(document.createElement("tr"));
            if (headerRow !== null) {
                headerRow.addClass("tableHeader");
                tableHeader.append(headerRow); // Must happen before we append cells to appease IE7

                for (let i = 0; i < columns.length; i++) {
                    const headerCell = $(document.createElement("th"));
                    if (headerCell !== null) {
                        headerCell.attr("id", columns[i].id);
                        headerCell.text(columns[i].label);
                        if (columns[i].class !== null) {
                            headerCell.addClass(columns[i].class);
                        }

                        headerRow.append(headerCell);
                    }

                    this.makeSortableColumn(tableName, columns[i].id);
                }
            }
        }
    }

    // Wraps a table into a collapsible table with a title
    private makeResizableTable(id: string, title: string, visibility: (table: Table) => boolean): void {
        const pane = $("#" + id);
        if (pane.hasClass("collapsibleElement")) { return; }

        pane.addClass("collapsibleElement");
        const wrap = $(document.createElement("div"));
        wrap.addClass("collapsibleWrapper");
        if (visibility) {
            wrap.attr("id", id + "Wrapper");
            this.visibilityBindings.push({ name: "#" + id + "Wrapper", visible: visibility });
        }

        const header = $(document.createElement("div"));
        header.addClass("tableCaption");
        header.bind("click", this, function (eventObject) {
            var table: Table = eventObject.data as Table;
            if (table) {
                table.toggleCollapse(eventObject.currentTarget);
            }
        });
        header.text(title);

        const moreSpan = $(document.createElement("span"));
        moreSpan.addClass("collapsibleSwitch");
        moreSpan.html("+&nbsp;");
        header.append(moreSpan);
        header.addClass("collapsibleElement");

        const captionDiv = $(document.createElement("div"));
        captionDiv.addClass("tableCaption");
        captionDiv.bind("click", this, function (eventObject) {
            var table: Table = eventObject.data as Table;
            if (table) {
                table.toggleCollapse(eventObject.currentTarget);
            }
        });
        captionDiv.text(title);

        const lessSpan = $(document.createElement("span"));
        lessSpan.addClass("collapsibleSwitch");
        lessSpan.html("&ndash;&nbsp;");
        captionDiv.append(lessSpan);

        const tbody = $(document.createElement("tbody"));

        // Now that everything is built, put it together
        pane.wrap(wrap);
        pane.before(header);
        pane.append(tbody);
        const caption = $((pane[0] as HTMLTableElement).createCaption());
        caption.prepend(captionDiv);
        header.hide();
    }

    private hideExtraColumns(): void {
        this.showExtra = false;
        $("#leftArrow").addClass("hiddenElement");
        $("#rightArrow").removeClass("hiddenElement");
    }

    private showExtraColumns(): void {
        this.showExtra = true;
        $("#rightArrow").addClass("hiddenElement");
        $("#leftArrow").removeClass("hiddenElement");
    }

    private toggleExtraColumns(): void {
        if (this.showExtra) {
            this.hideExtraColumns();
        } else {
            this.showExtraColumns();
        }

        this.recalculateVisibility();
    }

    public resetArrows(): void {
        this.setArrows("receivedHeaders", "hop", 1);
        this.setArrows("otherHeaders", "number", 1);
    }

    // Initialize UI with an empty viewModel
    public initializeTableUI(_viewModel: HeaderModel): void {
        this.viewModel = _viewModel;

        // Headers
        this.makeResizablePane("originalHeaders", mhaStrings.mhaOriginalHeaders, (table: Table) => { return table.viewModel.originalHeaders.length > 0; });
        $(".collapsibleElement", $("#originalHeaders").parents(".collapsibleWrapper")).toggle();

        // Summary
        this.makeResizablePane("summary", mhaStrings.mhaSummary, function (table: Table) { return table.viewModel.summary.exists(); });
        this.makeSummaryTable("#summary", this.viewModel.summary.rows, "SUM");

        // Received
        this.makeResizableTable("receivedHeaders", mhaStrings.mhaReceivedHeaders, function (table: Table) { return table.viewModel.receivedHeaders.exists(); });

        const receivedColumns = [
            new column("hop", mhaStrings.mhaReceivedHop, null),
            new column("from", mhaStrings.mhaReceivedSubmittingHost, null),
            new column("by", mhaStrings.mhaReceivedReceivingHost, null),
            new column("date", mhaStrings.mhaReceivedTime, null),
            new column("delay", mhaStrings.mhaReceivedDelay, null),
            new column("with", mhaStrings.mhaReceivedType, null),
            new column("id", mhaStrings.mhaReceivedId, "extraCol"),
            new column("for", mhaStrings.mhaReceivedFor, "extraCol"),
            new column("via", mhaStrings.mhaReceivedVia, "extraCol")
        ];

        this.addColumns(this.viewModel.receivedHeaders.tableName, receivedColumns);

        const withColumn = $("#receivedHeaders #with");
        if (withColumn !== null) {
            const leftSpan = $(document.createElement("span"));
            leftSpan.attr("id", "leftArrow");
            leftSpan.addClass("collapsibleArrow");
            leftSpan.addClass("hiddenElement");
            leftSpan.html("&lArr;");

            const rightSpan = $(document.createElement("span"));
            rightSpan.attr("id", "rightArrow");
            rightSpan.addClass("collapsibleArrow");
            rightSpan.html("&rArr;");

            withColumn.append(leftSpan);
            withColumn.append(rightSpan);
        }

        $("#receivedHeaders .collapsibleArrow").bind("click", this, function (eventObject) {
            var table: Table = eventObject.data as Table;
            if (table) {
                table.toggleExtraColumns();
                eventObject.stopPropagation();
            }
        });

        // FFAS
        this.makeResizablePane("forefrontAntiSpamReport", mhaStrings.mhaForefrontAntiSpamReport, function (table: Table) { return table.viewModel.forefrontAntiSpamReport.exists(); });
        this.makeSummaryTable("#forefrontAntiSpamReport", this.viewModel.forefrontAntiSpamReport.rows, "FFAS");

        // AntiSpam
        this.makeResizablePane("antiSpamReport", mhaStrings.mhaAntiSpamReport, (table: Table) => { return table.viewModel.antiSpamReport.exists(); });
        this.makeSummaryTable("#antiSpamReport", this.viewModel.antiSpamReport.rows, "AS");

        // Other
        this.makeResizableTable("otherHeaders", mhaStrings.mhaOtherHeaders, function (table: Table) { return table.viewModel.otherHeaders.rows.length > 0; });

        const otherColumns = [
            new column("number", mhaStrings.mhaNumber, null),
            new column("header", mhaStrings.mhaHeader, null),
            new column("value", mhaStrings.mhaValue, null)
        ];

        this.addColumns(this.viewModel.otherHeaders.tableName, otherColumns);

        this.resetArrows();
        this.rebuildSections(this.viewModel);
    }

    // Rebuilds the UI with a new viewModel
    // Used by Standalone.ts and Default.ts to rebuild with new viewModel
    public rebuildTables(_viewModel: HeaderModel): void {
        this.viewModel = _viewModel;
        this.rebuildSections(this.viewModel);
        this.hideExtraColumns();
    }
}