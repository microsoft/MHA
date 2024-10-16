import { Row } from "./Row";

describe("Row", () => {
    it("should return the correct id", () => {
        const row = new Row("headerValue", "labelValue", "headerNameValue");
        expect(row.id).toBe("headerValue_id");
    });

    it("should return a different id when header is changed", () => {
        const row = new Row("initialHeader", "labelValue", "headerNameValue");
        row.header = "newHeader";
        expect(row.id).toBe("newHeader_id");
    });
});