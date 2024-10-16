import "../jestMatchers/arrayEqual";
import { expect } from "@jest/globals";

import { AntiSpamReport } from "./Antispam";

describe("antiSpam Tests", () => {
    const header = "BCL:1;";
    const unparsed = "";
    const antiSpamRows = [
        {
            "header": "BCL",
            "headerName": "X-Microsoft-Antispam",
            "label": "Bulk Complaint Level",
            "value": "1",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>1</a>"
        },
        {
            "header": "PCL",
            "headerName": "X-Microsoft-Antispam",
            "label": "Phishing Confidence Level",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "source",
            "headerName": "X-Microsoft-Antispam",
            "label": "Source header",
            "value": header,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>BCL:1;</a>"
        },
        {
            "header": "unparsed",
            "headerName": "X-Microsoft-Antispam",
            "label": "Unknown fields",
            "value": unparsed,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>X-Microsoft-Antispam</a>"
        }
    ];

    const antiSpamReport = new AntiSpamReport();
    antiSpamReport.addInternal(header);
    test("antiSpamRows", ()=>{
        expect(antiSpamReport.rows).arrayEqual(antiSpamRows);
    });
    test("antiSpamRows-sourceHeader", () => {
        expect(antiSpamReport.source).toBe(header);
    });
    test("antiSpamRows-unparsed", () => {
        expect(antiSpamReport.unparsed).toBe(unparsed);
    });
});

describe("antiSpam nulls", () => {
    const header = "UIP:(null);(null);(null)SFV:SKI";
    const unparsed = "UIP:;SFV:SKI;";
    const antiSpamRows = [
        {
            "header": "BCL",
            "headerName": "X-Microsoft-Antispam",
            "label": "Bulk Complaint Level",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "PCL",
            "headerName": "X-Microsoft-Antispam",
            "label": "Phishing Confidence Level",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "source",
            "headerName": "X-Microsoft-Antispam",
            "label": "Source header",
            "value": header,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>UIP:(null);(null);(null)SFV:SKI</a>"
        },
        {
            "header": "unparsed",
            "headerName": "X-Microsoft-Antispam",
            "label": "Unknown fields",
            "value": unparsed,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>UIP:;SFV:SKI;</a>"
        }
    ];

    const antiSpamReport = new AntiSpamReport();
    antiSpamReport.addInternal(header);
    test("antiSpamRows null", ()=>{
        expect(antiSpamReport.rows).arrayEqual(antiSpamRows);
    });
    test("antiSpamRows-sourceHeader null", () => {
        expect(antiSpamReport.source).toBe(header);
    });
    test("antiSpamRows-unparsed null", () => {
        expect(antiSpamReport.unparsed).toBe(unparsed);
    });
});

describe("antiSpam toString", () => {
    test("toString with values", () => {
        const header = "BCL:1;";
        const antiSpamReport = new AntiSpamReport();
        antiSpamReport.addInternal(header);
        const expectedString = [
            "AntiSpamReport",
            "Bulk Complaint Level: 1",
            "Source header: BCL:1;"
        ].join("\n");
        expect(antiSpamReport.toString()).toBe(expectedString);
    });

    test("toString without values", () => {
        const antiSpamReport = new AntiSpamReport();
        const expectedString = "";
        expect(antiSpamReport.toString()).toBe(expectedString);
    });

    test("toString with null values", () => {
        const header = "UIP:(null);(null);(null)SFV:SKI";
        const antiSpamReport = new AntiSpamReport();
        antiSpamReport.addInternal(header);
        const expectedString = [
            "AntiSpamReport",
            "Source header: " + header,
            "Unknown fields: UIP:;SFV:SKI;"
        ].join("\n");
        expect(antiSpamReport.toString()).toBe(expectedString);
    });

    test("toString with values", () => {
        const header = "BCL:1;";
        const antiSpamReport = new AntiSpamReport();
        antiSpamReport.addInternal(header);
        const expectedString = [
            "AntiSpamReport",
            "Bulk Complaint Level: 1",
            "Source header: " + header
        ].join("\n");
        expect(antiSpamReport.toString()).toBe(expectedString);
    });

    test("toString without values", () => {
        const antiSpamReport = new AntiSpamReport();
        const expectedString = "";
        expect(antiSpamReport.toString()).toBe(expectedString);
    });

    test("toString with null values", () => {
        const header = "UIP:(null);(null);(null)SFV:SKI";
        const antiSpamReport = new AntiSpamReport();
        antiSpamReport.addInternal(header);
        const expectedString = [
            "AntiSpamReport",
            "Source header: " + header,
            "Unknown fields: UIP:;SFV:SKI;"
        ].join("\n");
        expect(antiSpamReport.toString()).toBe(expectedString);
    });
});

describe("antiSpam add", () => {
    test("add valid header", () => {
        const value = "BCL:1;";
        const header = { header: "X-Microsoft-Antispam", value: value };
        const antiSpamReport = new AntiSpamReport();
        const result = antiSpamReport.add(header);
        expect(result).toBe(true);
        expect(antiSpamReport.source).toBe(value);
    });

    test("add invalid header", () => {
        const value = "BCL:1;";
        const header = { header: "X-Other-Header", value: value };
        const antiSpamReport = new AntiSpamReport();
        const result = antiSpamReport.add(header);
        expect(result).toBe(false);
        expect(antiSpamReport.source).toBe("");
    });

    test("add valid header with null values", () => {
        const value = "UIP:(null);(null);(null)SFV:SKI";
        const header = { header: "X-Microsoft-Antispam", value: value };
        const antiSpamReport = new AntiSpamReport();
        const result = antiSpamReport.add(header);
        expect(result).toBe(true);
        expect(antiSpamReport.source).toBe(value);
        expect(antiSpamReport.unparsed).toBe("UIP:;SFV:SKI;");
    });
});

describe("antiSpam parse", () => {
    test("parse a null report", () => {
        const report = "";
        const antiSpamReport = new AntiSpamReport();
        antiSpamReport.parse(report);
        expect(antiSpamReport.source).toBe("");
        expect(antiSpamReport.unparsed).toBe("");
    });
});
