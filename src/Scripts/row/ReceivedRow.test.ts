import { ReceivedField } from "./ReceivedField";
import { ReceivedRow } from "./ReceivedRow";
import { mhaStrings } from "../mhaStrings";

describe("ReceivedRow", () => {
    let receivedRow: ReceivedRow;

    beforeEach(() => {
        receivedRow = new ReceivedRow("Test Header");
    });

    test("should initialize fields correctly", () => {
        expect(receivedRow.sourceHeader).toBeInstanceOf(ReceivedField);
        expect(receivedRow.sourceHeader.value).toBe("Test Header");
        expect(receivedRow.hop).toBeInstanceOf(ReceivedField);
        expect(receivedRow.hop.label).toBe(mhaStrings.mhaReceivedHop);
        // Add similar checks for other fields
    });

    test("should set field value correctly", () => {
        const result = receivedRow.setField("hop", "Test Hop");
        expect(result).toBe(false);
        expect(receivedRow.hop.value).toBe("Test Hop");
    });

    test("should append to existing field value", () => {
        receivedRow.setField("hop", "First Value");
        const result = receivedRow.setField("hop", "Second Value");
        expect(result).toBe(false);
        expect(receivedRow.hop.value).toBe("First Value; Second Value");
    });

    test("should return false for invalid field name", () => {
        const result = receivedRow.setField("invalidField", "Test Value");
        expect(result).toBe(false);
    });

    test("should return false for empty field name or value", () => {
        let result = receivedRow.setField("", "Test Value");
        expect(result).toBe(false);
        result = receivedRow.setField("hop", "");
        expect(result).toBe(false);
    });

    test("toString should return correct string representation", () => {
        receivedRow.setField("hop", "Test Hop");
        receivedRow.setField("from", "Test From");
        const result = receivedRow.toString();
        expect(result).toContain(`${mhaStrings.mhaReceivedHop}: Test Hop`);
        expect(result).toContain(`${mhaStrings.mhaReceivedFrom}: Test From`);
    });
});