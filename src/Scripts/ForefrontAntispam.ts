import { mhaStrings } from "./mhaStrings";
import { AntiSpamReport } from "./Antispam";
import { row } from "./Summary";
import { header } from "./Headers";

export class ForefrontAntiSpamReport extends AntiSpamReport {
    private forefrontAntiSpamRows: row[] = [
        new row("ARC", mhaStrings.mhaArc, "X-Forefront-Antispam-Report"),
        new row("CTRY", mhaStrings.mhaCountryRegion, "X-Forefront-Antispam-Report"),
        new row("LANG", mhaStrings.mhaLang, "X-Forefront-Antispam-Report"),
        new row("SCL", mhaStrings.mhaScl, "X-MS-Exchange-Organization-SCL"),
        new row("PCL", mhaStrings.mhaPcl, "X-Forefront-Antispam-Report"),
        new row("SFV", mhaStrings.mhaSfv, "X-Forefront-Antispam-Report"),
        new row("IPV", mhaStrings.mhaIpv, "X-Forefront-Antispam-Report"),
        new row("H", mhaStrings.mhaHelo, "X-Forefront-Antispam-Report"),
        new row("PTR", mhaStrings.mhaPtr, "X-Forefront-Antispam-Report"),
        new row("CIP", mhaStrings.mhaCip, "X-Forefront-Antispam-Report"),
        new row("CAT", mhaStrings.mhaCat, "X-Forefront-Antispam-Report"),
        new row("SFTY", mhaStrings.mhaSfty, "X-Forefront-Antispam-Report"),
        new row("SRV", mhaStrings.mhaSrv, "X-Forefront-Antispam-Report"),
        new row("X-CustomSpam", mhaStrings.mhaCustomSpam, "X-Forefront-Antispam-Report"),
        new row("SFS", mhaStrings.mhaSfs, "SFS"),
        new row("source", mhaStrings.mhaSource, "X-Microsoft-Antispam"),
        new row("unparsed", mhaStrings.mhaUnparsed, "X-Microsoft-Antispam")
    ];

    public override add(header: header): boolean {
        if (header.header.toUpperCase() === "X-Forefront-Antispam-Report".toUpperCase()) {
            this.parse(header.value, this.rows);
            return true;
        }

        return false;
    }

    public override get rows(): row[] { return this.forefrontAntiSpamRows; };
    public override toString(): string {
        if (!this.exists()) return "";
        const ret = ["ForefrontAntiSpamReport"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}