import { mhaStrings } from "./Strings";

export class row {
    constructor(header: string, label: string, headerName: string) {
        this.header = header;
        this.label = label;
        this.headerName = headerName;
        this.value = "";
        this.valueUrl = "";
        this.toString = function () { return this.label + ": " + this.value; };
    }
    header: string;
    label: string;
    headerName: string;
    value: string;
    valueUrl: string;
    toString: () => string;
};

export const AntiSpamReport = (function () {
    let source: string = "";
    let unparsed: string = "";
    const antiSpamRows: row[] = [
        new row("BCL", mhaStrings.mhaBcl, "X-Microsoft-Antispam"),
        new row("PCL", mhaStrings.mhaPcl, "X-Microsoft-Antispam"),
        new row("source", mhaStrings.mhaSource, "X-Microsoft-Antispam"),
        new row("unparsed", mhaStrings.mhaUnparsed, "X-Microsoft-Antispam")
    ];

    function existsInternal(rows: row[]): boolean {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].value) {
                return true;
            }
        }

        return false;
    }

    function setRowValue(rows: row[], key: string, value: string): boolean {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].header.toUpperCase() === key.toUpperCase()) {
                rows[i].value = value;
                rows[i].valueUrl = mhaStrings.mapHeaderToURL(rows[i].headerName, value);
                return true;
            }
        }

        return false;
    }

    // https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers
    function parse(report: string, rows: row[]): void {
        source = report;
        if (!report) {
            return;
        }

        // Sometimes we see extraneous (null) in the report. They look like this: UIP:(null);(null);(null)SFV:SKI
        // First pass: Remove the (null).
        report = report.replace(/\(null\)/g, "");

        // Occasionally, we find the final ; is missing. 
        // Second pass: Add one. If it is extraneous, the next pass will remove it.
        report = report + ";";

        // Removing the (null) can leave consecutive ; which confound later parsing.
        // Third pass: Collapse them.
        report = report.replace(/;+/g, ";");

        const lines = report.match(/(.*?):(.*?);/g);
        unparsed = "";
        if (lines) {
            for (let iLine = 0; iLine < lines.length; iLine++) {
                const line = lines[iLine].match(/(.*?):(.*?);/m);
                if (line && line[1]) {
                    if (!setRowValue(rows, line[1], line[2])) {
                        unparsed += line[1] + ':' + line[2] + ';';
                    }
                }
            }
        }

        setRowValue(rows, "source", source);
        setRowValue(rows, "unparsed", unparsed);
    }

    function add(report: string): void { parse(report, antiSpamRows); }
    function exists(): boolean { return existsInternal(antiSpamRows); }

    return {
        add: add,
        exists: exists,
        existsInternal: existsInternal,
        parse: parse,
        get source(): string { return source; },
        get unparsed(): string { return unparsed; },
        get antiSpamRows(): row[] { return antiSpamRows; },
        toString: function (): string {
            if (!exists()) return "";
            const ret = ["AntiSpamReport"];
            antiSpamRows.forEach(function (row) {
                if (row.value) { ret.push(row.toString()); }
            });
            return ret.join("\n");
        }
    };
});