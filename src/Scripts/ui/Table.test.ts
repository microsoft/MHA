import { HeaderModel } from "../HeaderModel";
import { DomUtils } from "./domUtils";
import { Table } from "./Table";
import { Row } from "../row/Row";
import { DataTable } from "../table/DataTable";
import { SummaryTable } from "../table/SummaryTable";
import { TableSection } from "../table/TableSection";

describe("Table", () => {
    let table: Table;
    let viewModel: HeaderModel;

    beforeEach(async () => {
        // Set up the page as it's set in mhh.html and classicDesktopFrame.html
        // TODO: Actually do this setup for thos pages as part of the table init
        // initializeTableUI should just add all the components to the page
        document.body.insertAdjacentHTML("beforeend", `
            <hr id="lineBreak" />
            <div id="response" class="hiddenElement">
                <div class="responsePane">
                    <div id="status"></div>
                    <table id="summary"></table>
                    <table id="receivedHeaders"></table>
                    <table id="forefrontAntiSpamReport"></table>
                    <table id="antiSpamReport"></table>
                    <table id="otherHeaders"></table>
                </div>
            </div>
          `);
        table = new Table();
        viewModel = await HeaderModel.create(
            "Received: from example.com (::1) by" +
            " example2.com with HTTPS; Mon, 14 Oct 2024 18:24:33" +
            " +0000" +
            "From: John Doe <jdoe@example.com>" +
            "To: \"Everyone\" <everyone@example.com>" +
            "Subject: Test email" +
            "Date: Mon, 14 Oct 2024 18:24:17 +0000" +
            "X-Microsoft-Antispam: BCL:0;ARA:13230040|366016|4022899009|41050700001;" +
            "X-Forefront-Antispam-Report:" +
            " CIP:255.255.255.255;CTRY:;LANG:en;SCL:1;SRV:;IPV:NLI;SFV:NSPM;H:something.example.com;PTR:;CAT:NONE;SFS:(13230040)(366016)(4022899009)(41050700001);DIR:INT;" +
            "Content-Language: en-US"
        );
        table.initializeTableUI(viewModel);
    });

    it("should initialize table UI", () => {
        expect(table["viewModel"]).toEqual(viewModel);
    });

    it("should rebuild sections", () => {
        table.rebuildSections(viewModel);
        expect(table["viewModel"]).toEqual(viewModel);
    });

    it("should recalculate visibility", () => {
        table.recalculateVisibility();
        table["visibilityBindings"].forEach(binding => {
            const element = document.querySelector(binding.name);
            const hasHiddenClass = element ? element.classList.contains("hiddenElement") : false;
            expect(hasHiddenClass).toBe(!binding.visible(table));
        });
    });

    it("should toggle collapse", () => {
        const id = "testElement";
        document.body.insertAdjacentHTML("beforeend", `<div id="${id}" class="hiddenElement"></div>`);
        table["toggleCollapse"](id);
        expect(DomUtils.hasClass(`#${id}`, "hiddenElement")).toBe(false);
        table["toggleCollapse"](id);
        expect(DomUtils.hasClass(`#${id}`, "hiddenElement")).toBe(true);
        document.getElementById(id)?.remove();
    });

    it("should make element visible", () => {
        const id = "#testElement";
        document.body.insertAdjacentHTML("beforeend", "<div id=\"testElement\" class=\"hiddenElement\"></div>");
        table["makeVisible"](id, true);
        expect(DomUtils.hasClass(id, "hiddenElement")).toBe(false);
        table["makeVisible"](id, false);
        expect(DomUtils.hasClass(id, "hiddenElement")).toBe(true);
        document.querySelector(id)?.remove();
    });

    it("should hide empty columns", () => {
        const tableId = "testTable";
        document.body.insertAdjacentHTML("beforeend", `
            <table id="${tableId}">
                <thead>
                    <tr>
                        <th>Header 1</th>
                        <th>Header 2</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td></td>
                        <td>Data</td>
                    </tr>
                </tbody>
            </table>
        `);
        table["hideEmptyColumns"](tableId);
        expect(DomUtils.hasClass(`#${tableId} th:first-child`, "emptyColumn")).toBe(true);
        expect(DomUtils.hasClass(`#${tableId} th:nth-child(2)`, "emptyColumn")).toBe(false);
        document.getElementById(tableId)?.remove();
    });

    it("should set row value", () => {
        const row: Row = new Row("testHeader", "testValue", "testId");
        row.value = "testValue";
        document.body.insertAdjacentHTML("beforeend", "<div id=\"testHeaderSUMVal\"></div>");
        table["setRowValue"](row, "SUM");
        expect(DomUtils.getText("#testHeaderSUMVal")).toBe("testValue");
        document.getElementById("testHeaderSUMVal")?.remove();
    });

    it("should append cell", () => {
        const row = document.createElement("tr");
        table["appendCell"](row, "", "<b>html</b>test", "cellClass");
        const td = row.querySelectorAll("td");
        expect(td[0]?.textContent).toBe("htmltest");
        expect(td[0]?.innerHTML).toBe("<b>html</b>test");
        expect(td[0]?.className).toBe("cellClass");
    });

    it("should empty table UI", () => {
        const tableId = "testTable";
        document.body.insertAdjacentHTML("beforeend", `
            <table id="${tableId}">
                <thead>
                    <tr class="tableHeader">
                        <th>Header 1</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Data</td>
                    </tr>
                </tbody>
            </table>
        `);
        table["emptyTableUI"](tableId);
        expect(document.querySelectorAll(`#${tableId} tbody tr`).length).toBe(0);
        expect(DomUtils.hasClass(`#${tableId} th:first-child`, "emptyColumn")).toBe(false);
        expect(DomUtils.hasClass(`#${tableId} th:first-child`, "hiddenElement")).toBe(false);
        document.getElementById(tableId)?.remove();
    });

    it("should toggle extra columns", () => {
        table["showExtra"] = false;
        table["toggleExtraColumns"]();
        expect(table["showExtra"]).toBe(true);
        table["toggleExtraColumns"]();
        expect(table["showExtra"]).toBe(false);
    });

    it("should reset arrows", () => {
        const by = document.querySelector("#receivedHeaders th #by") as HTMLElement;
        const hop = document.querySelector("#receivedHeaders th #hop") as HTMLElement;
        const number = document.querySelector("#otherHeaders th #number") as HTMLElement;

        // Check aria-sort on the parent th elements instead of buttons
        const byTh = by?.parentElement as HTMLElement;
        const hopTh = hop?.parentElement as HTMLElement;
        const numberTh = number?.parentElement as HTMLElement;

        expect(hopTh.getAttribute("aria-sort")).toBe("descending");
        expect(byTh.getAttribute("aria-sort")).toBe("none");
        expect(numberTh.getAttribute("aria-sort")).toBe("descending");
        by.click();
        expect(hopTh.getAttribute("aria-sort")).toBe("none");
        expect(byTh.getAttribute("aria-sort")).toBe("descending");
        table.resetArrows();
        expect(hopTh.getAttribute("aria-sort")).toBe("descending");
        expect(byTh.getAttribute("aria-sort")).toBe("none");
    });

    describe("TableSection Integration", () => {
        it("should initialize table sections with proper accessibility", () => {
            // Check that table sections exist on viewModel (some may be undefined if no data)
            const vm = table["viewModel"];
            expect(vm).not.toBeNull();
            if (!vm) return;

            const summary = vm["summary"] as TableSection | undefined;
            const received = vm["received"] as TableSection | undefined;
            const antispam = vm["antispam"] as TableSection | undefined;
            const forefrontAntispam = vm["forefrontAntispam"] as TableSection | undefined;
            const other = vm["other"] as TableSection | undefined;

            // At least summary should exist
            expect(summary).toBeDefined();

            // Only test defined sections for accessibility
            if (received) {
                expect(received.getTableCaption).toBeDefined();
                expect(received.getAriaLabel).toBeDefined();
            }
            if (antispam) {
                expect(antispam.getTableCaption).toBeDefined();
                expect(antispam.getAriaLabel).toBeDefined();
            }
            if (forefrontAntispam) {
                expect(forefrontAntispam.getTableCaption).toBeDefined();
                expect(forefrontAntispam.getAriaLabel).toBeDefined();
            }
            if (other) {
                expect(other.getTableCaption).toBeDefined();
                expect(other.getAriaLabel).toBeDefined();
            }
        });

        it("should apply accessibility attributes to tables", () => {
            // Verify aria-label is applied to each table
            const summaryTable = document.getElementById("summary");
            const receivedTable = document.getElementById("receivedHeaders");
            const antispamTable = document.getElementById("antiSpamReport");
            const forefrontTable = document.getElementById("forefrontAntiSpamReport");
            const otherTable = document.getElementById("otherHeaders");

            expect(summaryTable?.getAttribute("aria-label")).toContain("table");
            expect(receivedTable?.getAttribute("aria-label")).toContain("table");
            expect(antispamTable?.getAttribute("aria-label")).toContain("table");
            expect(forefrontTable?.getAttribute("aria-label")).toContain("table");
            expect(otherTable?.getAttribute("aria-label")).toContain("table");
        });

        it("should handle table section existence properly", () => {
            // Each table section should implement exists() method
            const vm = table["viewModel"];
            if (!vm) return;

            const summary = vm["summary"] as TableSection | undefined;
            const received = vm["received"] as TableSection | undefined;
            const antispam = vm["antispam"] as TableSection | undefined;
            const forefrontAntispam = vm["forefrontAntispam"] as TableSection | undefined;
            const other = vm["other"] as TableSection | undefined;

            if (summary) expect(typeof summary.exists).toBe("function");
            if (received) expect(typeof received.exists).toBe("function");
            if (antispam) expect(typeof antispam.exists).toBe("function");
            if (forefrontAntispam) expect(typeof forefrontAntispam.exists).toBe("function");
            if (other) expect(typeof other.exists).toBe("function");
        });

        it("should provide consistent accessibility methods", () => {
            const vm = table["viewModel"];
            if (!vm) return;

            const summary = vm["summary"] as TableSection | undefined;

            if (summary) {
                expect(typeof summary.getTableCaption).toBe("function");
                expect(typeof summary.getAriaLabel).toBe("function");

                const caption = summary.getTableCaption();
                const ariaLabel = summary.getAriaLabel();

                expect(typeof caption).toBe("string");
                expect(typeof ariaLabel).toBe("string");
                expect(ariaLabel).toContain("table");
            }
        });

        it("should handle DataTable sorting interface", () => {
            const vm = table["viewModel"];
            if (!vm) return;

            const received = vm["received"] as DataTable | undefined;
            const other = vm["other"] as DataTable | undefined;

            if (received) {
                // DataTable instances should have sorting properties
                expect(typeof received.sortColumn).toBe("string");
                expect(typeof received.sortOrder).toBe("number");
                expect(typeof received.doSort).toBe("function");
            }

            if (other) {
                expect(typeof other.sortColumn).toBe("string");
                expect(typeof other.sortOrder).toBe("number");
                expect(typeof other.doSort).toBe("function");
            }
        });

        it("should handle SummaryTable tag interface", () => {
            const vm = table["viewModel"];
            if (!vm) return;

            const summary = vm["summary"] as SummaryTable | undefined;
            const antispam = vm["antispam"] as SummaryTable | undefined;
            const forefrontAntispam = vm["forefrontAntispam"] as SummaryTable | undefined;

            if (summary) {
                // SummaryTable instances should have tag property
                expect(typeof summary.tag).toBe("string");
                expect(summary.tag).toBe("SUM");
            }
            if (antispam) {
                expect(typeof antispam.tag).toBe("string");
                expect(antispam.tag).toBe("AS");
            }
            if (forefrontAntispam) {
                expect(typeof forefrontAntispam.tag).toBe("string");
                expect(forefrontAntispam.tag).toBe("FFAS");
            }
        });

        it("should properly distinguish DataTable vs SummaryTable", () => {
            const vm = table["viewModel"];
            if (!vm) return;

            const received = vm["received"] as TableSection | undefined;
            const other = vm["other"] as TableSection | undefined;
            const summary = vm["summary"] as TableSection | undefined;
            const antispam = vm["antispam"] as TableSection | undefined;

            if (received && other) {
                // DataTables should have tableCaption paneClass
                expect(received.paneClass).toBe("tableCaption");
                expect(other.paneClass).toBe("tableCaption");
            }

            if (summary && antispam) {
                // SummaryTables should have sectionHeader paneClass
                expect(summary.paneClass).toBe("sectionHeader");
                expect(antispam.paneClass).toBe("sectionHeader");
            }
        });
    });
});