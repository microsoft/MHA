import { mhaStrings } from "../mhaStrings";
import { AntiSpamReport } from "./AntiSpamReport";
import { Header } from "./Header";
import { Row } from "./Row";

export class ForefrontAntiSpamReport extends AntiSpamReport {
    public override readonly tableName: string = "forefrontAntiSpamReport";
    public override readonly displayName: string = mhaStrings.mhaForefrontAntiSpamReport;
    public override readonly tag: string = "FFAS";
    private forefrontAntiSpamRows: Row[] = [
        new Row("ARC", mhaStrings.mhaArc, "X-Forefront-Antispam-Report"),
        new Row("CTRY", mhaStrings.mhaCountryRegion, "X-Forefront-Antispam-Report"),
        new Row("LANG", mhaStrings.mhaLang, "X-Forefront-Antispam-Report"),
        new Row("SCL", mhaStrings.mhaScl, "X-MS-Exchange-Organization-SCL"),
        new Row("PCL", mhaStrings.mhaPcl, "X-Forefront-Antispam-Report"),
        new Row("SFV", mhaStrings.mhaSfv, "X-Forefront-Antispam-Report"),
        new Row("IPV", mhaStrings.mhaIpv, "X-Forefront-Antispam-Report"),
        new Row("H", mhaStrings.mhaHelo, "X-Forefront-Antispam-Report"),
        new Row("PTR", mhaStrings.mhaPtr, "X-Forefront-Antispam-Report"),
        new Row("CIP", mhaStrings.mhaCip, "X-Forefront-Antispam-Report"),
        new Row("CAT", mhaStrings.mhaCat, "X-Forefront-Antispam-Report"),
        new Row("SFTY", mhaStrings.mhaSfty, "X-Forefront-Antispam-Report"),
        new Row("SRV", mhaStrings.mhaSrv, "X-Forefront-Antispam-Report"),
        new Row("X-CustomSpam", mhaStrings.mhaCustomSpam, "X-Forefront-Antispam-Report"),
        new Row("SFS", mhaStrings.mhaSfs, "SFS"),
        new Row("source", mhaStrings.mhaSource, "X-Microsoft-Antispam"),
        new Row("unparsed", mhaStrings.mhaUnparsed, "X-Microsoft-Antispam"),
        // Add the header name itself as a section for rules validation compatibility
        new Row("X-Forefront-Antispam-Report", mhaStrings.mhaForefrontAntiSpamReport, "X-Forefront-Antispam-Report")
    ];

    public override add(header: Header): boolean {
        if (header.header.toUpperCase() === "X-Forefront-Antispam-Report".toUpperCase()) {
            this.parse(header.value);

            // Set the header name row for rules validation compatibility
            const headerNameRow = this.forefrontAntiSpamRows.find(row => row.header === "X-Forefront-Antispam-Report");
            if (headerNameRow) {
                headerNameRow.value = header.value;
            }

            return true;
        }

        return false;
    }

    public override get rows(): Row[] { return this.forefrontAntiSpamRows; }
    public override toString(): string {
        if (!this.exists()) return "";
        const ret = ["ForefrontAntiSpamReport"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}