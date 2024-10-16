import { OtherRow } from "./OtherRow";

describe("OtherRow", () => {
    describe("toString", () => {
        it("should return the correct string representation", () => {
            const header = "Test Header";
            const value = "Test Value";
            const number = 1;
            const otherRow = new OtherRow(number, header, value);

            const result = otherRow.toString();

            expect(result).toBe(`${header}: ${value}`);
        });
    });
});