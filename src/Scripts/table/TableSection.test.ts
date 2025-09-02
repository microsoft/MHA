import { TableSection } from "./TableSection";

describe("TableSection", () => {
    // Concrete implementation for testing abstract base class
    class TestTableSection extends TableSection {
        public readonly tableName = "testTable";
        public readonly displayName = "Test Table";
        public readonly paneClass = "sectionHeader" as const;

        private testExists = true;
        private testToString = "Test table content";

        public exists(): boolean {
            return this.testExists;
        }

        public toString(): string {
            return this.testToString;
        }

        // Test helpers
        public setExists(value: boolean): void {
            this.testExists = value;
        }

        public setToString(value: string): void {
            this.testToString = value;
        }
    }

    let tableSection: TestTableSection;

    beforeEach(() => {
        tableSection = new TestTableSection();
    });

    describe("Abstract properties", () => {
        it("should have correct table name", () => {
            expect(tableSection.tableName).toBe("testTable");
        });

        it("should have correct display name", () => {
            expect(tableSection.displayName).toBe("Test Table");
        });

        it("should have correct pane class", () => {
            expect(tableSection.paneClass).toBe("sectionHeader");
        });
    });

    describe("Abstract methods", () => {
        it("should implement exists method", () => {
            expect(tableSection.exists()).toBe(true);

            tableSection.setExists(false);
            expect(tableSection.exists()).toBe(false);
        });

        it("should implement toString method", () => {
            expect(tableSection.toString()).toBe("Test table content");

            tableSection.setToString("Modified content");
            expect(tableSection.toString()).toBe("Modified content");
        });
    });

    describe("Accessibility methods", () => {
        it("should return display name as table caption", () => {
            expect(tableSection.getTableCaption()).toBe("Test Table");
        });

        it("should return proper ARIA label", () => {
            expect(tableSection.getAriaLabel()).toBe("Test Table table");
        });

        it("should handle different display names in accessibility methods", () => {
            // Test with the existing test table's display name
            expect(tableSection.getTableCaption()).toBe(tableSection.displayName);
            expect(tableSection.getAriaLabel()).toBe(`${tableSection.displayName} table`);
        });
    });

    describe("Type checking", () => {
        it("should be instance of TableSection", () => {
            expect(tableSection).toBeInstanceOf(TableSection);
        });

        it("should allow polymorphic usage", () => {
            const baseRef: TableSection = tableSection;
            expect(baseRef.getTableCaption()).toBe("Test Table");
            expect(baseRef.getAriaLabel()).toBe("Test Table table");
        });
    });
});
