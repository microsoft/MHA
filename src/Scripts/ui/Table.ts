import { HeaderModel } from "../HeaderModel";
import { mhaStrings } from "../mhaStrings";
import { DomUtils } from "./domUtils";
import { ViolationUI } from "./ViolationUI";
import { OtherRow } from "../row/OtherRow";
import { ReceivedRow } from "../row/ReceivedRow";
import { Row } from "../row/Row";
import { RuleViolation } from "../rules/types/AnalysisTypes";
import { getViolationsForRow, highlightContent } from "../rules/ViolationUtils";
import { Column } from "../table/Column";
import { DataTable } from "../table/DataTable";
import { SummaryTable } from "../table/SummaryTable";
import { TableSection } from "../table/TableSection";

type Binding = {
    name: string;
    visible: (table: Table) => boolean;
}

export class Table {
    private viewModel: HeaderModel | null = null;
    private showExtra = false;

    private visibilityBindings: Binding[] = [
        { name: "#lineBreak", visible: function (table: Table) { return !!table.viewModel?.hasData; } },
        { name: "#response", visible: function (table: Table) { return !!table.viewModel?.hasData; } },
        { name: "#status", visible: function (table: Table) { return !!table.viewModel?.status; } },
        { name: ".extraCol", visible: function (table: Table) { return table.showExtra; } },
        { name: "#clearButton", visible: function (table: Table) { return !!table.viewModel?.hasData; } },
        { name: "#copyButton", visible: function (table: Table) { return !!table.viewModel?.hasData; } }
    ];

    // Adjusts response under our lineBreak
    private positionResponse(): void {
        const lineBreak = document.getElementById("lineBreak");
        if (lineBreak) {
            const responseTop: number = lineBreak.offsetTop + (lineBreak.offsetHeight ?? 0);
            const responseElement = document.getElementById("response");
            if (responseElement) {
                responseElement.style.top = (responseTop + 15) + "px";
            }
        }
    }

    private toggleCollapse(id: string): void {
        DomUtils.toggleClass("#" + id, "hiddenElement");
        this.positionResponse();
    }

    // Wraps an element into a collapsible pane with a title
    public makeResizablePane(id: string, paneClass: string, title: string, visibility: (table: Table) => boolean): void {
        const paneElement = document.getElementById(id);
        if (!paneElement) return;
        if (paneElement.classList.contains("collapsibleElement")) {
            return;
        }
        const hidden = paneElement.classList.contains("hiddenElement");

        paneElement.classList.add("collapsibleElement");
        const wrapElement = document.createElement("div");
        wrapElement.classList.add("collapsibleWrapper");
        if (visibility) {
            wrapElement.setAttribute("id", id + "Wrapper");
            this.visibilityBindings.push({ name: "#" + id + "Wrapper", visible: visibility });
        }

        // Fix for Bug 1691235 - Create a hidden h2 element for a11y
        const hiddenHeadingElement = document.createElement("h2");
        hiddenHeadingElement.setAttribute("id", "button-heading");
        hiddenHeadingElement.classList.add("header-hidden");
        hiddenHeadingElement.textContent = title;

        const headerElement = document.createElement("button");
        headerElement.classList.add(paneClass);
        headerElement.addEventListener("click", () => {
            this.toggleCollapse(id);
            const currentExpanded = headerElement.getAttribute("aria-expanded") === "true";
            headerElement.setAttribute("aria-expanded", currentExpanded ? "false" : "true");
        });
        headerElement.textContent = title;
        headerElement.setAttribute("tabindex", "0");
        headerElement.setAttribute("type", "button");
        headerElement.setAttribute("aria-expanded", !hidden ? "true" : "false");

        const switchSpanElement = document.createElement("span");
        switchSpanElement.setAttribute("aria-hidden", "true");
        switchSpanElement.classList.add("collapsibleSwitch");

        // Now that everything is built, put it together
        const parent = paneElement.parentNode;
        if (parent) {
            parent.insertBefore(wrapElement, paneElement);
            wrapElement.appendChild(paneElement);
            wrapElement.insertBefore(hiddenHeadingElement, paneElement);
            wrapElement.insertBefore(headerElement, paneElement);
        }
        headerElement.appendChild(switchSpanElement);
    }

    private makeVisible(id: string, visible: boolean): void {
        const elements = document.querySelectorAll(id);
        elements.forEach(element => {
            if (visible) {
                element.classList.remove("hiddenElement");
            } else {
                element.classList.add("hiddenElement");
            }
        });
    }

    private addTableAccessibility(section: TableSection): void {
        const table = document.getElementById(section.tableName);
        if (table) {
            table.setAttribute("aria-label", section.getAriaLabel());
            table.setAttribute("role", "table");
        }
    }

    private makeSummaryTable(summaryName: string, rows: Row[], tag: string): void {
        const summaryListElement = document.querySelector(summaryName);
        if (summaryListElement) {
            summaryListElement.classList.add("summaryList");

            rows.forEach((summaryRow: Row) => {
                const id = summaryRow.header + tag;
                const row = document.createElement("tr");
                if (row !== null) {
                    row.id = id;
                    summaryListElement.appendChild(row); // Must happen before we append cells to appease IE7
                    const headerCell = row.insertCell(-1);
                    if (summaryRow.url) {
                        headerCell.innerHTML = summaryRow.url;
                    } else {
                        headerCell.textContent = summaryRow.label;
                    }
                    headerCell.classList.add("summaryHeader");
                    headerCell.setAttribute("id", summaryRow.header + "_id" + tag);

                    const valCell = row.insertCell(-1);
                    valCell.setAttribute("id", id + "Val");
                    valCell.setAttribute("aria-labelledby", summaryRow.header + "_id" + tag);

                    this.makeVisible("#" + id, false);
                }
            });
        }
    }

    private setArrows(table: string, colName: string, sortOrder: number): void {
        const headers = document.querySelectorAll(`#${table} th[role="columnheader"]`);
        headers.forEach(header => header.setAttribute("aria-sort", "none"));

        const targetButton = document.querySelector(`#${table} th #${colName}`);
        if (targetButton && targetButton.parentElement) {
            targetButton.parentElement.setAttribute("aria-sort", sortOrder === 1 ? "descending" : "ascending");
        }
    }

    private setRowValue(row: Row, type: string): void {
        const headerVal = document.getElementById(row.header + type + "Val");
        if (headerVal) {
            if (row.value) {
                const rowViolations = this.viewModel ? getViolationsForRow(row, this.viewModel.violationGroups) : [];
                const highlightedContent = this.viewModel ? highlightContent(row.valueUrl || row.value, this.viewModel.violationGroups) : (row.valueUrl || row.value);

                if (row.valueUrl) {
                    headerVal.innerHTML = highlightedContent;
                } else {
                    headerVal.innerHTML = highlightedContent;
                }

                if (rowViolations.length > 0) {
                    rowViolations.forEach((violation: RuleViolation) => {
                        headerVal.appendChild(document.createTextNode(" "));
                        headerVal.appendChild(ViolationUI.createInlineViolation(violation));
                    });
                }

                this.makeVisible("#" + row.header + type, true);
            } else {
                headerVal.textContent = "";
                this.makeVisible("#" + row.header + type, false);
            }
        }
    }

    private appendCell(row: HTMLTableRowElement, text: string | number | null, html: string, cellClass: string, headerId?: string): void {
        const cell = row.insertCell(-1);
        if (text) { cell.textContent = text.toString(); }
        if (html) { cell.innerHTML = html; }
        if (cellClass) { cell.classList.add(cellClass); }
        if (headerId) { cell.setAttribute("headers", headerId); }
    }

    // Restores table to empty state so we can repopulate it
    private emptyTableUI(id: string): void {
        const rowsToRemove = document.querySelectorAll(`#${id} tr:not(.tableHeader)`);
        rowsToRemove.forEach(row => row.remove()); // Remove the rows
        const headers = document.querySelectorAll(`#${id} th`);
        headers.forEach(header => {
            header.classList.remove("emptyColumn"); // Restore header visibility
            header.classList.remove("hiddenElement"); // Restore header visibility
        });
    }

    // Recompute visibility with the current viewModel. Does not repopulate.
    public recalculateVisibility(): void {
        this.visibilityBindings.forEach((binding: Binding) => {
            this.makeVisible(binding.name, binding.visible(this));
        });

        this.positionResponse();
    }

    private hideEmptyColumns(id: string): void {
        const headers = document.querySelectorAll(`#${id} th`);
        headers.forEach((header, i) => {
            let keep = 0;

            // Find a child cell which has data
            const table = header.closest("table");
            if (table) {
                const children = table.querySelectorAll(`tr td:nth-child(${i + 1})`);
                children.forEach((cell) => {
                    if (cell.innerHTML !== "") {
                        keep++;
                    }
                });

                if (keep === 0) {
                    header.classList.add("emptyColumn");
                    children.forEach(cell => cell.classList.add("emptyColumn"));
                } else {
                    header.classList.remove("emptyColumn");
                    children.forEach(cell => cell.classList.remove("emptyColumn"));
                }
            }
        });
    }

    // Rebuilds content and recalculates what sections should be displayed
    // Repopulate the UI with the current viewModel
    public rebuildSections(viewModel: HeaderModel | null): void {
        this.viewModel = viewModel;

        if (!viewModel) {
            this.recalculateVisibility();
            return;
        }

        // Summary
        viewModel.summary.rows.forEach((row: Row) => {
            this.setRowValue(row, "SUM");
        });

        // Diagnostics
        const diagnosticsContainer = document.getElementById("diagnosticsContent");
        if (diagnosticsContainer) {
            diagnosticsContainer.innerHTML = "";
            const diagnosticsSection = ViolationUI.buildDiagnosticsSection(viewModel.violationGroups);
            if (diagnosticsSection) {
                diagnosticsContainer.appendChild(diagnosticsSection);
            }
        }

        // Received
        this.emptyTableUI("receivedHeaders");
        viewModel.receivedHeaders.rows.forEach((receivedRow: ReceivedRow) => {
            const row: HTMLTableRowElement = document.createElement("tr");
            const receivedHeadersTable = document.getElementById("receivedHeaders");
            if (receivedHeadersTable) {
                receivedHeadersTable.appendChild(row); // Must happen before we append cells to appease IE7
            }
            this.appendCell(row, receivedRow.hop.value, "", "", "hop_header");
            this.appendCell(row, receivedRow.from.value, "", "", "from_header");
            this.appendCell(row, receivedRow.by.value, "", "", "by_header");
            this.appendCell(row, receivedRow.date.value, "", "", "date_header");
            let labelClass = "hotBarLabel";
            if (receivedRow.delaySort.value !== null && typeof receivedRow.delaySort.value === "number" && receivedRow.delaySort.value < 0) {
                labelClass += " negativeCell";
            }

            const hotBar =
                "<div class='hotBarContainer'>" +
                "   <div class='" + labelClass + "'>" + receivedRow.delay + "</div>" +
                "   <div class='hotBarBar' style='width:" + receivedRow.percent + "%'></div>" +
                "</div>";
            this.appendCell(row, "", hotBar, "hotBarCell", "delay_header");
            this.appendCell(row, receivedRow.with.value, "", "", "with_header");
            this.appendCell(row, receivedRow.id.value, "", "extraCol", "id_header");
            this.appendCell(row, receivedRow.for.value, "", "extraCol", "for_header");
            this.appendCell(row, receivedRow.via.value, "", "extraCol", "via_header");
        });

        // Calculate heights for the hotbar cells (progress bars in Delay column)
        // Not clear why we need to do this
        const hotBarCells = document.querySelectorAll(".hotBarCell");
        hotBarCells.forEach(cell => {
            const height = (cell as HTMLElement).offsetHeight;
            if (height) {
                const container = cell.querySelector(".hotBarContainer") as HTMLElement;
                if (container) {
                    container.style.height = height + "px";
                }
            }
        });

        const receivedRows = document.querySelectorAll("#receivedHeaders tr:nth-child(odd)");
        receivedRows.forEach(row => row.classList.add("oddRow"));
        this.hideEmptyColumns("receivedHeaders");

        // Forefront AntiSpam Report
        viewModel.forefrontAntiSpamReport.rows.forEach((row: Row) => {
            this.setRowValue(row, "FFAS");
        });

        // AntiSpam Report
        viewModel.antiSpamReport.rows.forEach((row: Row) => {
            this.setRowValue(row, "AS");
        });

        // Other
        this.emptyTableUI("otherHeaders");
        viewModel.otherHeaders.rows.forEach((otherRow: OtherRow) => {
            const row: HTMLTableRowElement = document.createElement("tr");
            const otherHeadersTable = document.getElementById("otherHeaders");
            if (otherHeadersTable) {
                otherHeadersTable.appendChild(row);
            }
            this.appendCell(row, otherRow.number.toString(), "", "", "number_header");

            const rowViolations = getViolationsForRow(otherRow, viewModel.violationGroups);
            const highlightedHeader = highlightContent(otherRow.url || otherRow.header, viewModel.violationGroups);

            const headerCell = row.insertCell(-1);
            headerCell.innerHTML = highlightedHeader;
            headerCell.setAttribute("headers", "header_header");

            if (rowViolations.length > 0) {
                rowViolations.forEach((violation: RuleViolation) => {
                    headerCell.appendChild(document.createTextNode(" "));
                    headerCell.appendChild(ViolationUI.createInlineViolation(violation));
                });
            }

            const highlightedValue = highlightContent(otherRow.value, viewModel.violationGroups);
            this.appendCell(row, "", highlightedValue, "allowBreak", "value_header");
        });

        const otherRows = document.querySelectorAll("#otherHeaders tr:nth-child(odd)");
        otherRows.forEach(row => row.classList.add("oddRow"));

        // Original headers
        DomUtils.setText("#originalHeaders", viewModel.originalHeaders);

        this.recalculateVisibility();
    }

    private makeSortableColumn(tableName: string, column: Column): HTMLTableCellElement {
        const header = document.createElement("th");
        if (header !== null) {
            header.setAttribute("role", "columnheader");
            header.setAttribute("aria-sort", "none");
            header.setAttribute("id", column.id + "_header"); // Add unique ID for headers attribute

            const headerButton = document.createElement("button");
            if (headerButton !== null) {
                headerButton.setAttribute("class", "tableHeaderButton");
                headerButton.setAttribute("id", column.id);
                headerButton.setAttribute("type", "button");
                headerButton.innerHTML = column.label;
                if (column.class !== null) {
                    headerButton.setAttribute("class", "tableHeaderButton " + column.class);
                }

                headerButton.addEventListener("click", () => {
                    if (this.viewModel && this.viewModel[tableName] instanceof DataTable) {
                        const dataTable = this.viewModel[tableName] as DataTable;
                        dataTable.doSort(column.id);
                        this.setArrows(dataTable.tableName, dataTable.sortColumn,
                            dataTable.sortOrder);
                        this.rebuildSections(this.viewModel);
                    }
                });

                const arrowSpan = document.createElement("span");
                arrowSpan.setAttribute("aria-hidden", "true");
                arrowSpan.classList.add("sortArrow");

                // Now that everything is built, put it together
                headerButton.appendChild(arrowSpan);
                header.appendChild(headerButton);
            }
        }

        return header;
    }

    private addColumns(tableName: string, columns: Column[]): void {
        const tableHeader = document.createElement("thead");
        const table = document.getElementById(tableName);
        if (table) {
            table.appendChild(tableHeader);

            const headerRow = document.createElement("tr");
            headerRow.classList.add("tableHeader");
            headerRow.setAttribute("role", "row");
            tableHeader.appendChild(headerRow); // Must happen before we append cells to appease IE7

            columns.forEach((column: Column) => {
                const sortableColumn = this.makeSortableColumn(tableName, column);
                if (sortableColumn) {
                    headerRow.appendChild(sortableColumn);
                }
            });
        }
    }

    private hideExtraColumns(): void {
        this.showExtra = false;
        DomUtils.addClass("#leftArrow", "hiddenElement");
        DomUtils.removeClass("#rightArrow", "hiddenElement");
    }

    private showExtraColumns(): void {
        this.showExtra = true;
        DomUtils.addClass("#rightArrow", "hiddenElement");
        DomUtils.removeClass("#leftArrow", "hiddenElement");
    }

    private toggleExtraColumns(): void {
        if (this.showExtra) {
            this.hideExtraColumns();
        } else {
            this.showExtraColumns();
        }

        this.recalculateVisibility();
    }

    // Helper method to initialize a table section using the unified TableSection approach
    private initializeTableSection(section: TableSection, sectionProperty: keyof HeaderModel): void {
        // Create resizable pane using TableSection properties, but with proper closure
        this.makeResizablePane(section.tableName, section.paneClass, section.displayName, (table: Table) => {
            // Use table.viewModel[sectionProperty] to get the current section with data
            if (!table.viewModel) return false;
            const currentSection = table.viewModel[sectionProperty] as TableSection;
            return currentSection.exists();
        });

        // Handle DataTable-specific initialization (sortable tables)
        if (section instanceof DataTable) {
            const dataTable = section as DataTable;

            // Special handling for received headers
            if (dataTable.tableName === "receivedHeaders") {
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
                this.addColumns(dataTable.tableName, receivedColumns);
                this.setupReceivedHeadersUI();
            }

            // Special handling for other headers
            if (dataTable.tableName === "otherHeaders") {
                const otherColumns = [
                    new Column("number", mhaStrings.mhaNumber, ""),
                    new Column("header", mhaStrings.mhaHeader, ""),
                    new Column("value", mhaStrings.mhaValue, "")
                ];
                this.addColumns(dataTable.tableName, otherColumns);
            }
        }

        // Handle SummaryTable-specific initialization
        if (section instanceof SummaryTable) {
            const summaryTable = section as SummaryTable;
            this.makeSummaryTable(`#${summaryTable.tableName}`, summaryTable.rows, summaryTable.tag);
        }

        // Add accessibility features
        this.addTableAccessibility(section);
    }

    private setupReceivedHeadersUI(): void {
        const withColumn = document.querySelector("#receivedHeaders #with");
        if (withColumn !== null) {
            const leftSpan = document.createElement("span");
            leftSpan.setAttribute("id", "leftArrow");
            leftSpan.classList.add("collapsibleArrow");
            leftSpan.classList.add("hiddenElement");
            leftSpan.innerHTML = "&lArr;";

            const rightSpan = document.createElement("span");
            rightSpan.setAttribute("id", "rightArrow");
            rightSpan.classList.add("collapsibleArrow");
            rightSpan.innerHTML = "&rArr;";

            withColumn.appendChild(leftSpan);
            withColumn.appendChild(rightSpan);
        }

        const arrows = document.querySelectorAll("#receivedHeaders .collapsibleArrow");
        arrows.forEach(arrow => {
            arrow.addEventListener("click", (event) => {
                this.toggleExtraColumns();
                event.stopPropagation();
            });
        });
    }

    public resetArrows(): void {
        this.setArrows("receivedHeaders", "hop", 1);
        this.setArrows("otherHeaders", "number", 1);
    }

    // Initialize UI with an empty viewModel using unified TableSection approach
    public initializeTableUI(viewModel: HeaderModel | null = null): void {
        this.viewModel = viewModel;

        // Original headers (not a TableSection, handle separately)
        this.makeResizablePane("originalHeaders", "sectionHeader", mhaStrings.mhaOriginalHeaders, (table: Table) => {
            return !!table.viewModel && table.viewModel.originalHeaders.length > 0;
        });
        this.toggleCollapse("originalHeaders");

        // Diagnostics (collapsible, starts collapsed)
        this.makeResizablePane("diagnosticsContent", "sectionHeader", "Diagnostics Report", (table: Table) => {
            return !!table.viewModel && table.viewModel.violationGroups && table.viewModel.violationGroups.length > 0;
        });

        if (!viewModel) {
            this.recalculateVisibility();
            return;
        }

        // Initialize all TableSection-based tables using unified approach
        this.initializeTableSection(viewModel.summary, "summary");
        this.initializeTableSection(viewModel.receivedHeaders, "receivedHeaders");
        this.initializeTableSection(viewModel.forefrontAntiSpamReport, "forefrontAntiSpamReport");
        this.initializeTableSection(viewModel.antiSpamReport, "antiSpamReport");
        this.initializeTableSection(viewModel.otherHeaders, "otherHeaders");

        this.resetArrows();
        this.rebuildSections(viewModel);
    }

    // Rebuilds the UI with a new viewModel
    // Used by mha.ts and Default.ts to rebuild with new viewModel
    public rebuildTables(viewModel: HeaderModel): void {
        this.viewModel = viewModel;
        this.rebuildSections(this.viewModel);
        this.hideExtraColumns();
    }
}
