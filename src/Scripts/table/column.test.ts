import { Column } from "../table/column";

describe("column", () => {
    it("should create an instance with the given id, label, and class", () => {
        const id = "col1";
        const label = "Column 1";
        const columnClass = "class1";
        const col = new Column(id, label, columnClass);

        expect(col.id).toBe(id);
        expect(col.label).toBe(label);
        expect(col.class).toBe(columnClass);
    });

    it("should have id as a string", () => {
        const col = new Column("col2", "Column 2", "class2");
        expect(typeof col.id).toBe("string");
    });

    it("should have label as a string", () => {
        const col = new Column("col3", "Column 3", "class3");
        expect(typeof col.label).toBe("string");
    });

    it("should have class as a string", () => {
        const col = new Column("col4", "Column 4", "class4");
        expect(typeof col.class).toBe("string");
    });
});