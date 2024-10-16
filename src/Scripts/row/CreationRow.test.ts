import { CreationRow } from "./CreationRow";
import { SummaryRow } from "./SummaryRow";
import { Strings } from "../Strings";

jest.mock("../Strings", () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Strings: {
        mapHeaderToURL: jest.fn((header, label) => `url-for-${header}-${label}`)
    }
}));

describe("CreationRow", () => {
    let creationRow: CreationRow;

    beforeEach(() => {
        creationRow = new CreationRow("header", "label");
    });

    it("should be an instance of SummaryRow", () => {
        expect(creationRow).toBeInstanceOf(SummaryRow);
    });

    it("should initialize url using Strings.mapHeaderToURL", () => {
        expect(Strings.mapHeaderToURL).toHaveBeenCalledWith("header", "label");
        expect(creationRow.url).toBe("url-for-header-label");
    });

    it("should initialize postFix to an empty string", () => {
        expect(creationRow.postFix).toBe("");
    });

    it("should get value correctly", () => {
        creationRow["valueInternal"] = "internalValue";
        creationRow.postFix = "PostFix";
        expect(creationRow.value).toBe("internalValuePostFix");
    });

    it("should set value correctly", () => {
        creationRow.value = "newValue";
        expect(creationRow["valueInternal"]).toBe("newValue");
    });
});