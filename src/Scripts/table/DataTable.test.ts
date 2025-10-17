import { DataTable } from "./DataTable";

describe("DataTable", () => {
    // Concrete implementation for testing abstract DataTable
    class TestDataTable extends DataTable {
        public readonly tableName = "testDataTable";
        public readonly displayName = "Test Data Table";

        protected sortColumnInternal = "default";
        protected sortOrderInternal = 1;

        private testRows: { id: number; name: string }[] = [
            { id: 1, name: "First" },
            { id: 2, name: "Second" }
        ];

        public get rows(): { id: number; name: string }[] {
            return this.testRows;
        }

        public doSort(col: string): void {
            this.sortColumnInternal = col;
            this.sortOrderInternal = this.sortOrderInternal === 1 ? -1 : 1;

            // Simple sort implementation for testing
            this.testRows.sort((a, b) => {
                const aVal = a[col as keyof typeof a];
                const bVal = b[col as keyof typeof b];
                const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return this.sortOrderInternal === 1 ? result : -result;
            });
        }

        public toString(): string {
            return this.testRows.map(row => `${row.id}: ${row.name}`).join(", ");
        }

        // Test helpers
        public setRows(rows: { id: number; name: string }[]): void {
            this.testRows = rows;
        }
    }

    let dataTable: TestDataTable;

    beforeEach(() => {
        dataTable = new TestDataTable();
    });

    describe("DataTable inheritance", () => {
        it("should extend TableSection", () => {
            expect(dataTable.tableName).toBe("testDataTable");
            expect(dataTable.displayName).toBe("Test Data Table");
        });

        it("should have tableCaption paneClass", () => {
            expect(dataTable.paneClass).toBe("tableCaption");
        });

        it("should inherit accessibility methods", () => {
            expect(dataTable.getTableCaption()).toBe("Test Data Table");
            expect(dataTable.getAriaLabel()).toBe("Test Data Table table");
        });
    });

    describe("Sorting functionality", () => {
        it("should have initial sort column and order", () => {
            expect(dataTable.sortColumn).toBe("default");
            expect(dataTable.sortOrder).toBe(1);
        });

        it("should change sort column and order when doSort is called", () => {
            dataTable.doSort("name");
            expect(dataTable.sortColumn).toBe("name");
            expect(dataTable.sortOrder).toBe(-1); // Flipped from initial 1
        });

        it("should toggle sort order on same column", () => {
            dataTable.doSort("id");
            expect(dataTable.sortOrder).toBe(-1);

            dataTable.doSort("id");
            expect(dataTable.sortOrder).toBe(1);
        });

        it("should sort rows when doSort is called", () => {
            // Sort by name
            dataTable.doSort("name");
            const sortedRows = dataTable.rows;
            expect(sortedRows.length).toBe(2);
            expect(sortedRows[0]!.name).toBe("Second"); // Descending order
            expect(sortedRows[1]!.name).toBe("First");
        });
    });

    describe("Rows management", () => {
        it("should have default rows", () => {
            expect(dataTable.rows).toHaveLength(2);
            expect(dataTable.rows[0]).toEqual({ id: 1, name: "First" });
            expect(dataTable.rows[1]).toEqual({ id: 2, name: "Second" });
        });

        it("should allow rows to be updated", () => {
            const newRows = [{ id: 3, name: "Third" }];
            dataTable.setRows(newRows);
            expect(dataTable.rows).toEqual(newRows);
        });
    });

    describe("Exists method", () => {
        it("should return true when rows exist", () => {
            expect(dataTable.exists()).toBe(true);
        });

        it("should return false when no rows exist", () => {
            dataTable.setRows([]);
            expect(dataTable.exists()).toBe(false);
        });
    });

    describe("toString method", () => {
        it("should format rows as string", () => {
            expect(dataTable.toString()).toBe("1: First, 2: Second");
        });

        it("should handle empty rows", () => {
            dataTable.setRows([]);
            expect(dataTable.toString()).toBe("");
        });
    });

    describe("Type checking", () => {
        it("should be instance of DataTable", () => {
            expect(dataTable).toBeInstanceOf(DataTable);
        });

        it("should allow polymorphic usage with TableSection", () => {
            const baseRef = dataTable;
            expect(baseRef.getTableCaption()).toBe("Test Data Table");
        });
    });
});