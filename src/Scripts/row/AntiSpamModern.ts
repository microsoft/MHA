import { mhaStrings } from "../mhaStrings";
import { AntiSpamReport } from "./AntiSpamReport";
import { ParseAntiSpamReport } from "./ForefrontAntispam";
import { Header } from "./Header";
import { Row } from "./Row";

export class AntiSpam extends AntiSpamReport {
    public override readonly tableName: string = "antiSpamReport";
    public override readonly displayName: string = mhaStrings.mhaAntiSpamReport;
    public override readonly tag: string = "AS";

    private antiSpamRows: Row[] = [
        new Row("BCL", mhaStrings.mhaBcl, "X-Microsoft-Antispam"),
        new Row("PCL", mhaStrings.mhaPcl, "X-Microsoft-Antispam")
    ];

    public override get rows(): Row[] { return this.antiSpamRows; }

    public override add(header: Header): boolean {
        if (header.header.toUpperCase() === "X-Microsoft-Antispam".toUpperCase()) {
            ParseAntiSpamReport(header.value, this.antiSpamRows);
            return true;
        }

        return false;
    }

    public override toString(): string {
        if (!this.exists()) return "";
        const ret = ["AntiSpamReport"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}

// Re-export legacy function-based constructor for backward compatibility
export { AntiSpamRow, AntiSpamReport } from "./Antispam";