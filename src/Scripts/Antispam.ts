import { mhaStrings } from "./mhaStrings";
import { strings } from "./Strings";

export class row {
    constructor(header: string, label: string, headerName: string) {
        this.header = header;
        this.label = label;
        this.headerName = headerName;
        this.value = "";
        this.valueUrl = "";
    }
    header: string;
    label: string;
    headerName: string;
    value: string;
    valueUrl: string;
    toString(): string { return this.label + ": " + this.value; };
};

export class AntiSpamReport {
    private _source: string = "";
    private _unparsed: string = "";
    private antiSpamRows: row[] = [
        new row("BCL", mhaStrings.mhaBcl, "X-Microsoft-Antispam"),
        new row("PCL", mhaStrings.mhaPcl, "X-Microsoft-Antispam"),
        new row("source", mhaStrings.mhaSource, "X-Microsoft-Antispam"),
        new row("unparsed", mhaStrings.mhaUnparsed, "X-Microsoft-Antispam")
    ];

    public existsInternal(rows: row[]): boolean {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].value) {
                return true;
            }
        }

        return false;
    }

    private setRowValue(rows: row[], key: string, value: string): boolean {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].header.toUpperCase() === key.toUpperCase()) {
                rows[i].value = value;
                rows[i].valueUrl = strings.mapHeaderToURL(rows[i].headerName, value);
                return true;
            }
        }

        return false;
    }

    // https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers
    public parse(report: string, rows: row[]): void {
        this._source = report;
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
        this._unparsed = "";
        if (lines) {
            for (let iLine = 0; iLine < lines.length; iLine++) {
                const line = lines[iLine].match(/(.*?):(.*?);/m);
                if (line && line[1]) {
                    if (!this.setRowValue(rows, line[1], line[2])) {
                        this._unparsed += line[1] + ':' + line[2] + ';';
                    }
                }
            }
        }

        this.setRowValue(rows, "source", this._source);
        this.setRowValue(rows, "unparsed", this._unparsed);
    }

    public add(report: string): void { this.parse(report, this.rows); }
    public exists(): boolean { return this.existsInternal(this.rows); }

    public get source(): string { return this._source; };
    public get unparsed(): string { return this._unparsed; };
    public get rows(): row[] { return this.antiSpamRows; };
    public toString(): string {
        if (!this.exists()) return "";
        const ret = ["AntiSpamReport"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}