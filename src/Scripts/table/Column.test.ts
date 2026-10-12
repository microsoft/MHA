import { Column } from "./Column";

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

    it.each([
        ["id"],
        ["label"],
        ["class"],
    ])("should have %s as a string", (property) => {
        const col = new Column("col2", "Column 2", "class2");
        expect(typeof col[property as keyof Column]).toBe("string");
    });
});
