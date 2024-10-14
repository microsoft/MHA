import { ArchivedRow } from "./ArchivedRow";
import { Strings } from "../Strings";

jest.mock("../Strings", () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Strings: {
        mapHeaderToURL: jest.fn(),
        mapValueToURL: jest.fn()
    }
}));

describe("ArchivedRow", () => {
    const header = "testHeader";
    const label = "testLabel";
    let archivedRow: ArchivedRow;

    beforeEach(() => {
        (Strings.mapHeaderToURL as jest.Mock).mockReturnValue("mockedHeaderURL");
        (Strings.mapValueToURL as jest.Mock).mockReturnValue("mockedValueURL");
        archivedRow = new ArchivedRow(header, label);
    });

    it("should set url using Strings.mapHeaderToURL", () => {
        expect(Strings.mapHeaderToURL).toHaveBeenCalledWith(header, label);
        expect(archivedRow.url).toBe("mockedHeaderURL");
    });

    it("should return valueUrl using Strings.mapValueToURL", () => {
        archivedRow["valueInternal"] = "internalValue";
        expect(archivedRow.valueUrl).toBe("mockedValueURL");
        expect(Strings.mapValueToURL).toHaveBeenCalledWith("internalValue");
    });
});