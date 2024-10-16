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
        receivedRow.setField("hop", "Test Hop");
        expect(receivedRow.hop.value).toBe("Test Hop");
    });

    test("should append to existing field value", () => {
        receivedRow.setField("hop", "First Value");
        receivedRow.setField("hop", "Second Value");
        expect(receivedRow.hop.value).toBe("First Value; Second Value");
    });

    test("toString should return correct string representation", () => {
        receivedRow.setField("hop", "Test Hop");
        receivedRow.setField("from", "Test From");
        const result = receivedRow.toString();
        expect(result).toContain(`${mhaStrings.mhaReceivedHop}: Test Hop`);
        expect(result).toContain(`${mhaStrings.mhaReceivedFrom}: Test From`);
    });

    test("should not set field value if fieldName is empty", () => {
        receivedRow.setField("", "Test Value");
        expect(receivedRow.sourceHeader.value).toBe("Test Header");
    });

    test("should not set field value if fieldValue is empty", () => {
        receivedRow.setField("hop", "");
        expect(receivedRow.hop.value).toBe("");
    });

    test("should not set field value if field does not exist", () => {
        receivedRow.setField("nonExistentField", "Test Value");
        expect(receivedRow["nonExistentField"]).toBeUndefined();
    });
});