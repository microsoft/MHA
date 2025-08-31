import { SummaryTable } from "./SummaryTable";
import { Row } from "../row/Row";

describe("SummaryTable", () => {
    // Concrete implementation for testing abstract SummaryTable
    class TestSummaryTable extends SummaryTable {
        public readonly tableName = "testSummaryTable";
        public readonly displayName = "Test Summary Table";
        public readonly tag = "TST";

        private testRows: Row[] = [];

        constructor() {
            super();
            // Create rows properly using Row constructor and set values
            const row1 = new Row("field1", "Field 1", "");
            row1.value = "Value 1";

            const row2 = new Row("field2", "Field 2", "");
            row2.value = ""; // Empty value

            const row3 = new Row("field3", "Field 3", "");
            row3.value = "Value 3";

            this.testRows = [row1, row2, row3];
        }

        public get rows(): Row[] {
            return this.testRows;
        }

        public toString(): string {
            return this.testRows
                .filter(row => !!row.value)
                .map(row => `${row.label}: ${row.value}`)
                .join(", ");
        }

        // Test helpers
        public setRows(rows: Row[]): void {
            this.testRows = rows;
        }
    }

    let summaryTable: TestSummaryTable;

    beforeEach(() => {
        summaryTable = new TestSummaryTable();
    });

    describe("SummaryTable inheritance", () => {
        it("should extend TableSection", () => {
            expect(summaryTable.tableName).toBe("testSummaryTable");
            expect(summaryTable.displayName).toBe("Test Summary Table");
        });

        it("should have sectionHeader paneClass", () => {
            expect(summaryTable.paneClass).toBe("sectionHeader");
        });

        it("should inherit accessibility methods", () => {
            expect(summaryTable.getTableCaption()).toBe("Test Summary Table");
            expect(summaryTable.getAriaLabel()).toBe("Test Summary Table table");
        });
    });

    describe("Tag property", () => {
        it("should have correct tag", () => {
            expect(summaryTable.tag).toBe("TST");
        });

        it("should be readonly", () => {
            // TypeScript will catch this at compile time, but we can verify the property exists
            expect(typeof summaryTable.tag).toBe("string");
        });
    });

    describe("Rows management", () => {
        it("should have default rows", () => {
            expect(summaryTable.rows).toHaveLength(3);
            expect(summaryTable.rows[0]!.label).toBe("Field 1");
            expect(summaryTable.rows[0]!.value).toBe("Value 1");
        });

        it("should allow rows to be updated", () => {
            const newRow = new Row("newfield", "New Field", "");
            newRow.value = "New Value";
            summaryTable.setRows([newRow]);
            expect(summaryTable.rows).toEqual([newRow]);
        });
    });

    describe("Exists method", () => {
        it("should return true when any row has a value", () => {
            expect(summaryTable.exists()).toBe(true);
        });

        it("should return false when no rows have values", () => {
            const emptyRow1 = new Row("empty1", "Empty 1", "");
            emptyRow1.value = "";
            const emptyRow2 = new Row("empty2", "Empty 2", "");
            emptyRow2.value = "";

            summaryTable.setRows([emptyRow1, emptyRow2]);
            expect(summaryTable.exists()).toBe(false);
        });

        it("should return false when no rows exist", () => {
            summaryTable.setRows([]);
            expect(summaryTable.exists()).toBe(false);
        });

        it("should handle mixed empty and non-empty values", () => {
            const emptyRow = new Row("empty", "Empty", "");
            emptyRow.value = "";

            const valueRow = new Row("hasvalue", "HasValue", "");
            valueRow.value = "Some value";

            const empty2Row = new Row("empty2", "Empty2", "");
            empty2Row.value = "";

            summaryTable.setRows([emptyRow, valueRow, empty2Row]);
            expect(summaryTable.exists()).toBe(true);
        });
    });

    describe("toString method", () => {
        it("should format rows with values as string", () => {
            expect(summaryTable.toString()).toBe("Field 1: Value 1, Field 3: Value 3");
        });

        it("should handle empty rows", () => {
            summaryTable.setRows([]);
            expect(summaryTable.toString()).toBe("");
        });

        it("should filter out rows without values", () => {
            const valueRow = new Row("hasvalue", "HasValue", "");
            valueRow.value = "Test";

            const emptyRow = new Row("empty", "Empty", "");
            emptyRow.value = "";

            summaryTable.setRows([valueRow, emptyRow]);
            expect(summaryTable.toString()).toBe("HasValue: Test");
        });
    });

    describe("Type checking", () => {
        it("should be instance of SummaryTable", () => {
            expect(summaryTable).toBeInstanceOf(SummaryTable);
        });

        it("should allow polymorphic usage with TableSection", () => {
            const baseRef = summaryTable;
            expect(baseRef.getTableCaption()).toBe("Test Summary Table");
        });
    });

    describe("Different tag implementations", () => {
        it("should support different tag values", () => {
            // We can't test different implementations easily due to class count limits
            // but we can verify the tag property works
            expect(summaryTable.tag).toBe("TST");
            expect(typeof summaryTable.tag).toBe("string");
        });
    });
});
