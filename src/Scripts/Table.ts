import * as $ from "jquery";
import { HeaderModel } from "./Headers";
import { mhaStrings } from "./mhaStrings";
import { Row } from "./Summary";
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
    private viewModel: HeaderModel = <HeaderModel>{};
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
        const lineBreak = $("#lineBreak");
        if (lineBreak && lineBreak[0]) {
            const responseTop: number = lineBreak[0]?.offsetTop + (lineBreak.height() ?? 0);
            $("#response").css("top", responseTop + 15);
        }
    }

    private isExpanded(id: string): boolean {
        return $("#"+ id+"Wrapper .moreSwitch").hasClass("hiddenElement");
    }

    private toggleCollapse(id: string): void {
        $("#"+ id).toggleClass("hiddenElement");
        $("#"+ id+"Wrapper .collapsibleSwitch").toggleClass("hiddenElement");
        this.positionResponse();
    }

    // Wraps an element into a collapsible pane with a title
    public makeResizablePane(id: string, paneClass: string, title: string, visibility: (table: Table) => boolean): void {
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
        const header = $(document.createElement("button"));
        header.addClass(paneClass);
        header.on("click", this, function (eventObject) {
            const table: Table = eventObject.data as Table;
            if (table) {
                table.toggleCollapse(id);
                header.attr("aria-expanded", table.isExpanded(id)? "true" : "false");
            }
        });
        header.text(title);
        header.attr("tabindex", 0);
        header.attr("type", "button");
        header.attr("aria-expanded", !hidden ? "true" : "false");

        const moreSpan = $(document.createElement("span"));
        moreSpan.addClass("collapsibleSwitch");
        moreSpan.addClass("moreSwitch");
        moreSpan.html("+&nbsp;");

        const lessSpan = $(document.createElement("span"));
        lessSpan.addClass("collapsibleSwitch");
        lessSpan.addClass("lessSwitch");
        lessSpan.html("&ndash;&nbsp;");

        // Now that everything is built, put it together
        pane.wrap(wrap);
        pane.before(header);
        header.append(moreSpan);
        header.append(lessSpan);
        if (hidden) {
            lessSpan.addClass("hiddenElement");
        } else {
            moreSpan.addClass("hiddenElement");
        }
    }

    private makeVisible(id: string, visible: boolean): void {
        if (visible) {
            $(id).removeClass("hiddenElement");
        } else {
            $(id).addClass("hiddenElement");
        }
    }

    private makeSummaryTable(summaryName: string, rows: Row[], tag: string): void {
        const summaryList = $(summaryName);
        if (summaryList) {
            summaryList.addClass("summaryList");

            rows.forEach((summaryRow: Row) => {
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
                        headerCell.attr("id", summaryRow.id);
                    }

                    const valCell = $(row.insertCell(-1));
                    if (valCell) {
                        valCell.attr("id", id + "Val");
                        valCell.attr("aria-labelledby", summaryRow.id);
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

    private setRowValue(row: Row, type: string): void {
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
        $("#" + id + " tr:not(.tableHeader)").remove(); // Remove the rows
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
        this.viewModel.summary.rows.forEach((row: Row) => {
            this.setRowValue(row, "SUM");
        });

        // Received
        this.emptyTableUI("receivedHeaders");
        this.viewModel.receivedHeaders.rows.forEach((receivedRow: ReceivedRow) => {
            const row: HTMLTableRowElement = document.createElement("tr");
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
            const height: number | undefined = $(this).height();
            if (height) {
                $(this).find(".hotBarContainer").height(height);
            }
        });

        $("#receivedHeaders tr:odd").addClass("oddRow");
        this.hideEmptyColumns("receivedHeaders");

        // Forefront AntiSpam Report
        this.viewModel.forefrontAntiSpamReport.rows.forEach((row: Row) => {
            this.setRowValue(row, "FFAS");
        });

        // AntiSpam Report
        this.viewModel.antiSpamReport.rows.forEach((row: Row) => {
            this.setRowValue(row, "AS");
        });

        // Other
        this.emptyTableUI("otherHeaders");
        this.viewModel.otherHeaders.rows.forEach((otherRow: OtherRow) => {
            const row: HTMLTableRowElement = document.createElement("tr");
            $("#otherHeaders").append(row); // Must happen before we append cells to appease IE7
            this.appendCell(row, otherRow.number.toString(), "", "");
            this.appendCell(row, otherRow.header, otherRow.url, "");
            this.appendCell(row, otherRow.value, "", "allowBreak");
        });

        $("#otherHeaders tr:odd").addClass("oddRow");

        // Original headers
        $("#originalHeaders").text(this.viewModel.originalHeaders);

        this.recalculateVisibility();
    }

    private makeSortableColumn(tableName: string, column: column): JQuery<HTMLElement> {
        const header = $(document.createElement("th"));
        if (header !== null) {
            const headerButton = $(document.createElement("button"));
            if (headerButton !== null) {
                headerButton.addClass("tableHeaderButton");
                headerButton.attr("id", column.id);
                headerButton.attr("type", "button");
                headerButton.text(column.label);
                if (column.class !== null) {
                    headerButton.addClass(column.class);
                }

                headerButton.on("click", this, function (eventObject) {
                    const table: Table = eventObject.data as Table;
                    if (table) {
                        if (table.viewModel[tableName] instanceof iTable) {
                            const itable = table.viewModel[tableName] as iTable;
                            itable.doSort(column.id);
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
                headerButton.append(downSpan);
                headerButton.append(upSpan);
                header.append(headerButton);
            }
        }

        return header;
    }

    private addColumns(tableName: string, columns: column[]): void {
        const tableHeader = $(document.createElement("thead"));
        if (tableHeader !== null) {
            $("#" + tableName).append(tableHeader);

            const headerRow = $(document.createElement("tr"));
            if (headerRow !== null) {
                headerRow.addClass("tableHeader");
                tableHeader.append(headerRow); // Must happen before we append cells to appease IE7

                columns.forEach((column: column) => {
                    headerRow.append(this.makeSortableColumn(tableName, column));
                });
            }
        }
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
        this.makeResizablePane("originalHeaders", "sectionHeader", mhaStrings.mhaOriginalHeaders, (table: Table) => { return table.viewModel.originalHeaders.length > 0; });
        this.toggleCollapse("originalHeaders"); // start this section hidden

        // Summary
        this.makeResizablePane("summary", "sectionHeader", mhaStrings.mhaSummary, function (table: Table) { return table.viewModel.summary.exists(); });
        this.makeSummaryTable("#summary", this.viewModel.summary.rows, "SUM");

        // Received
        this.makeResizablePane("receivedHeaders", "tableCaption", mhaStrings.mhaReceivedHeaders, function (table: Table) { return table.viewModel.receivedHeaders.exists(); });

        const receivedColumns = [
            new column("hop", mhaStrings.mhaReceivedHop, ""),
            new column("from", mhaStrings.mhaReceivedSubmittingHost, ""),
            new column("by", mhaStrings.mhaReceivedReceivingHost, ""),
            new column("date", mhaStrings.mhaReceivedTime, ""),
            new column("delay", mhaStrings.mhaReceivedDelay, ""),
            new column("with", mhaStrings.mhaReceivedType, ""),
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

        $("#receivedHeaders .collapsibleArrow").on("click", this, function (eventObject) {
            const table: Table = eventObject.data as Table;
            if (table) {
                table.toggleExtraColumns();
                eventObject.stopPropagation();
            }
        });

        // FFAS
        this.makeResizablePane("forefrontAntiSpamReport", "sectionHeader", mhaStrings.mhaForefrontAntiSpamReport, function (table: Table) { return table.viewModel.forefrontAntiSpamReport.exists(); });
        this.makeSummaryTable("#forefrontAntiSpamReport", this.viewModel.forefrontAntiSpamReport.rows, "FFAS");

        // AntiSpam
        this.makeResizablePane("antiSpamReport", "sectionHeader", mhaStrings.mhaAntiSpamReport, (table: Table) => { return table.viewModel.antiSpamReport.exists(); });
        this.makeSummaryTable("#antiSpamReport", this.viewModel.antiSpamReport.rows, "AS");

        // Other
        this.makeResizablePane("otherHeaders", "tableCaption", mhaStrings.mhaOtherHeaders, function (table: Table) { return table.viewModel.otherHeaders.rows.length > 0; });

        const otherColumns = [
            new column("number", mhaStrings.mhaNumber, ""),
            new column("header", mhaStrings.mhaHeader, ""),
            new column("value", mhaStrings.mhaValue, "")
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
