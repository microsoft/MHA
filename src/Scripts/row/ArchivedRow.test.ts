import { ArchivedRow } from "./ArchivedRow";
import { Decoder } from "../2047";
import { Strings } from "../Strings";

jest.mock("../Strings", () => {
    const actualStrings = jest.requireActual("../Strings") as typeof import("../Strings");

    return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Strings: {
            mapHeaderToURL: jest.fn((value: string) => actualStrings.Strings.mapHeaderToURL(value)),
            htmlEncode: jest.fn((value: string) => actualStrings.Strings.htmlEncode(value))
        }
    };
});

describe("ArchivedRow", () => {
    const header = "Archived-At";
    const label = "testLabel";
    let archivedRow: ArchivedRow;

    beforeEach(() => {
        jest.clearAllMocks();
        archivedRow = new ArchivedRow(header, label);
    });

    it("should set url using Strings.mapHeaderToURL", () => {
        expect(Strings.mapHeaderToURL).toHaveBeenCalledWith(header, label);
        expect(archivedRow.url).toBe("<a href = 'https://tools.ietf.org/html/rfc5064' target = '_blank'>Archived-At</a>");
    });

    it("should return html href for bracketed http(s) links", () => {
        archivedRow.value = "<https://example.test/path>";
        expect(Strings.htmlEncode).not.toHaveBeenCalled();
        expect(archivedRow.valueUrl).toBe("<a href='https://example.test/path' target='_blank'>https://example.test/path</a>");
    });

    it("should html encode non-bracketed values", () => {
        archivedRow.value = "https://example.test/path";
        const valueUrl = archivedRow.valueUrl;
        expect(Strings.htmlEncode).toHaveBeenCalledWith(archivedRow.value);
        expect(valueUrl).toBe("https://example.test/path");
    });

    it("should html encode raw img payload instead of rendering executable HTML", () => {
        archivedRow.value = "<img src=x onerror=alert('XSS')>";
        const valueUrl = archivedRow.valueUrl;
        expect(Strings.htmlEncode).toHaveBeenCalledWith(archivedRow.value);
        expect(valueUrl).toContain("&lt;img");
        expect(valueUrl).toContain("&gt;");
        expect(valueUrl).not.toContain("<img");
        expect(valueUrl).not.toContain("<a href=");
    });

    it("should encode RFC2047-decoded img payload instead of rendering executable HTML", () => {
        const encodedPayload = "=?UTF-8?B?PGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KCdYU1MnKT4=?=";
        archivedRow.value = Decoder.clean2047Encoding(encodedPayload);

        expect(archivedRow.valueUrl).toContain("&lt;img");
        expect(archivedRow.valueUrl).toContain("&gt;");
        expect(archivedRow.valueUrl).not.toContain("<img");
        expect(archivedRow.valueUrl).not.toContain("<a href=");
    });

    it("should render anchor only for strict angle-bracketed http(s) URL", () => {
        const url = "https://example.com/test/list/foo-users@lists.example.com/message/mysubject/";
        archivedRow.value = `<${url}>`;

        expect(archivedRow.valueUrl).toContain("<a href='");
        expect(archivedRow.valueUrl).toContain(url);
        expect(archivedRow.valueUrl).toContain("target='_blank'");
    });
});