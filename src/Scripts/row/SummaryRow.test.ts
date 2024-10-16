import { SummaryRow } from "./SummaryRow";
import { Strings } from "../Strings";

// Mock the Strings.mapHeaderToURL method
jest.mock("../Strings", () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Strings: {
        mapHeaderToURL: jest.fn()
    }
}));

describe("SummaryRow", () => {
    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        (Strings.mapHeaderToURL as jest.Mock).mockClear();
    });

    it("should call Strings.mapHeaderToURL with correct parameters", () => {
        const header = "testHeader";
        const label = "testLabel";
        const url = "testURL";

        (Strings.mapHeaderToURL as jest.Mock).mockReturnValue(url);

        const summaryRow = new SummaryRow(header, label);

        expect(Strings.mapHeaderToURL).toHaveBeenCalledWith(header, label);
        expect(summaryRow.url).toBe(url);
    });

    it("should set the url property correctly", () => {
        const header = "anotherHeader";
        const label = "anotherLabel";
        const url = "anotherURL";

        (Strings.mapHeaderToURL as jest.Mock).mockReturnValue(url);

        const summaryRow = new SummaryRow(header, label);

        expect(summaryRow.url).toBe(url);
    });
});