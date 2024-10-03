import { Other } from "../table/Other";
import { Header } from "../row/Header";

describe("Other", () => {
    let other: Other;

    beforeEach(() => {
        other = new Other();
    });

    test("should initialize with default values", () => {
        expect(other.tableName).toBe("otherHeaders");
        expect(other.exists()).toBe(false);
        expect(other.toString()).toBe("");
    });

    test("should add a header and return true", () => {
        const header = new Header("header1", "value1");
        const result = other.add(header);
        expect(result).toBe(true);
        expect(other.exists()).toBe(true);
        expect(other.rows.length).toBe(1);
        expect(other.rows[0] && other.rows[0].header).toBe("header1");
        expect(other.rows[0] && other.rows[0].value).toBe("value1");
    });

    test("should not add an empty header and return false", () => {
        const header = new Header("", "");
        const result = other.add(header);
        expect(result).toBe(false);
        expect(other.exists()).toBe(false);
        expect(other.rows.length).toBe(0);
    });

    test("should sort rows by specified column", () => {
        const header1 = new Header("header1", "value1");
        const header2 = new Header("header2", "value2");
        other.add(header1);
        other.add(header2);

        other.doSort("header");
        expect(other.rows[0] && other.rows[0].header).toBe("header1");
        expect(other.rows[1] && other.rows[1].header).toBe("header2");

        other.doSort("header");
        expect(other.rows[0] && other.rows[0].header).toBe("header2");
        expect(other.rows[1] && other.rows[1].header).toBe("header1");
    });

    test("should return correct string representation", () => {
        const header1 = new Header("header1", "value1");
        const header2 = new Header("header2", "value2");
        other.add(header1);
        other.add(header2);

        const result = other.toString();
        expect(result).toBe("Other\nvalue1\nvalue2");
    });
});