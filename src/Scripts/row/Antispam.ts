import { mhaStrings } from "../mhaStrings";
import { Strings } from "../Strings";
import { Row } from "./Row";
import { Header } from "./Header";

export class AntiSpamReport {
    private sourceInternal = "";
    private unparsedInternal = "";
    private antiSpamRows: Row[] = [
        new Row("BCL", mhaStrings.mhaBcl, "X-Microsoft-Antispam"),
        new Row("PCL", mhaStrings.mhaPcl, "X-Microsoft-Antispam"),
        new Row("source", mhaStrings.mhaSource, "X-Microsoft-Antispam"),
        new Row("unparsed", mhaStrings.mhaUnparsed, "X-Microsoft-Antispam")
    ];

    public existsInternal(rows: Row[]): boolean {
        for (const row of rows) {
            if (row.value) {
                return true;
            }
        }

        return false;
    }

    private setRowValue(rows: Row[], key: string, value: string): boolean {
        for (const row of rows) {
            if (row.header.toUpperCase() === key.toUpperCase()) {
                row.value = value;
                row.onGetUrl = (headerName: string, value: string) => { return Strings.mapHeaderToURL(headerName, value); };
                return true;
            }
        }

        return false;
    }

    // https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers
    public parse(report: string): void {
        this.sourceInternal = report;
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
        this.unparsedInternal = "";
        if (lines) {
            for (let iLine = 0; iLine < lines.length; iLine++) {
                const line = lines[iLine]?.match(/(.*?):(.*?);/m);
                if (line && line[1]) {
                    if (!this.setRowValue(this.rows, line[1], line[2] ?? "")) {
                        this.unparsedInternal += line[1] + ":" + line[2] + ";";
                    }
                }
            }
        }

        this.setRowValue(this.rows, "source", this.sourceInternal);
        this.setRowValue(this.rows, "unparsed", this.unparsedInternal);
    }

    public addInternal(report: string): void { this.parse(report); }
    public add(header: Header): boolean {
        if (header.header.toUpperCase() === "X-Microsoft-Antispam".toUpperCase()) {
            this.parse(header.value);
            return true;
        }

        return false;
    }

    public exists(): boolean { return this.existsInternal(this.rows); }

    public get source(): string { return this.sourceInternal; }
    public get unparsed(): string { return this.unparsedInternal; }
    public get rows(): Row[] { return this.antiSpamRows; }
    public toString(): string {
        if (!this.exists()) return "";
        const ret = ["AntiSpamReport"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}
