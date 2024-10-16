import $ from "jquery";

import { HeaderModel } from "../HeaderModel";
import { mhaStrings } from "../mhaStrings";
import { OtherRow } from "../row/OtherRow";
import { ReceivedRow } from "../row/ReceivedRow";
import { Row } from "../row/Row";
import { Column } from "../table/Column";
import { ITable } from "../table/ITable";

type Binding = {
    name: string;
    visible: (table: Table) => boolean;
}

export class Table {
    private viewModel: HeaderModel = <HeaderModel>{};
    private showExtra = false;

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

    private toggleCollapse(id: string): void {
        $("#"+ id).toggleClass("hiddenElement");
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

        // Fix for Bug 1691235 - Create a hidden h2 element for a11y
        const hiddenHeading = $(document.createElement("h2"));
        hiddenHeading.attr("id", "button-heading");
        hiddenHeading.addClass("header-hidden");
        hiddenHeading.text(title);

        const header = $(document.createElement("button"));
        header.addClass(paneClass);
        header.on("click", this, function (eventObject) {
            const table: Table = eventObject.data as Table;
            if (table) {
                table.toggleCollapse(id);
                header.attr("aria-expanded", header.attr("aria-expanded") === "true" ? "false" : "true");
            }
        });
        header.text(title);
        header.attr("tabindex", 0);
        header.attr("type", "button");
        header.attr("aria-expanded", !hidden ? "true" : "false");

        const switchSpan = $(document.createElement("span"));
        switchSpan.attr("aria-hidden", "true");
        switchSpan.addClass("collapsibleSwitch");

        // Now that everything is built, put it together
        pane.wrap(wrap);
        pane.before(hiddenHeading);
        pane.before(header);
        header.append(switchSpan);
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
        $("#" + table + " th button").attr("aria-sort", "none");
        $("#" + table + " th #" + colName).attr("aria-sort", sortOrder === 1 ? "descending" : "ascending");
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

    private appendCell(row: HTMLTableRowElement, text: string | number | null, html: string, cellClass: string): void {
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
    public rebuildSections(viewModel: HeaderModel): void {
        this.viewModel = viewModel;

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
            if (receivedRow.delaySort.value !== null && typeof receivedRow.delaySort.value === "number" && receivedRow.delaySort.value < 0) {
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

    private makeSortableColumn(tableName: string, column: Column): JQuery<HTMLElement> {
        const header = $(document.createElement("th"));
        if (header !== null) {
            const headerButton = $(document.createElement("button"));
            if (headerButton !== null) {
                headerButton.addClass("tableHeaderButton");
                headerButton.attr("id", column.id);
                headerButton.attr("type", "button");
                headerButton.attr("role", "columnheader");
                headerButton.attr("aria-sort", "none");
                headerButton.text(column.label);
                if (column.class !== null) {
                    headerButton.addClass(column.class);
                }

                headerButton.on("click", this, function (eventObject) {
                    const table: Table = eventObject.data as Table;
                    if (table) {
                        if (table.viewModel[tableName] instanceof ITable) {
                            const itable = table.viewModel[tableName] as ITable;
                            itable.doSort(column.id);
                            table.setArrows(itable.tableName, itable.sortColumn,
                                itable.sortOrder);
                            table.rebuildSections(table.viewModel);
                        }
                    }
                });

                const arrowSpan = $(document.createElement("span"));
                arrowSpan.attr("aria-hidden", "true");
                arrowSpan.addClass("sortArrow");

                // Now that everything is built, put it together
                headerButton.append(arrowSpan);
                header.append(headerButton);
            }
        }

        return header;
    }

    private addColumns(tableName: string, columns: Column[]): void {
        const tableHeader = $(document.createElement("thead"));
        if (tableHeader !== null) {
            $("#" + tableName).append(tableHeader);

            const headerRow = $(document.createElement("tr"));
            if (headerRow !== null) {
                headerRow.addClass("tableHeader");
                tableHeader.append(headerRow); // Must happen before we append cells to appease IE7

                columns.forEach((column: Column) => {
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
    public initializeTableUI(viewModel: HeaderModel): void {
        this.viewModel = viewModel;

        // Headers
        this.makeResizablePane("originalHeaders", "sectionHeader", mhaStrings.mhaOriginalHeaders, (table: Table) => { return table.viewModel.originalHeaders.length > 0; });
        this.toggleCollapse("originalHeaders"); // start this section hidden

        // Summary
        this.makeResizablePane("summary", "sectionHeader", mhaStrings.mhaSummary, function (table: Table) { return table.viewModel.summary.exists(); });
        this.makeSummaryTable("#summary", this.viewModel.summary.rows, "SUM");

        // Received
        this.makeResizablePane("receivedHeaders", "tableCaption", mhaStrings.mhaReceivedHeaders, function (table: Table) { return table.viewModel.receivedHeaders.exists(); });

        const receivedColumns = [
            new Column("hop", mhaStrings.mhaReceivedHop, ""),
            new Column("from", mhaStrings.mhaReceivedSubmittingHost, ""),
            new Column("by", mhaStrings.mhaReceivedReceivingHost, ""),
            new Column("date", mhaStrings.mhaReceivedTime, ""),
            new Column("delay", mhaStrings.mhaReceivedDelay, ""),
            new Column("with", mhaStrings.mhaReceivedType, ""),
            new Column("id", mhaStrings.mhaReceivedId, "extraCol"),
            new Column("for", mhaStrings.mhaReceivedFor, "extraCol"),
            new Column("via", mhaStrings.mhaReceivedVia, "extraCol")
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
            new Column("number", mhaStrings.mhaNumber, ""),
            new Column("header", mhaStrings.mhaHeader, ""),
            new Column("value", mhaStrings.mhaValue, "")
        ];

        this.addColumns(this.viewModel.otherHeaders.tableName, otherColumns);

        this.resetArrows();
        this.rebuildSections(this.viewModel);
    }

    // Rebuilds the UI with a new viewModel
    // Used by mha.ts and Default.ts to rebuild with new viewModel
    public rebuildTables(viewModel: HeaderModel): void {
        this.viewModel = viewModel;
        this.rebuildSections(this.viewModel);
        this.hideExtraColumns();
    }
}
