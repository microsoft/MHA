import { mhaStrings } from "./Strings";
import { AntiSpamReport, row } from "./Antispam";

export class ForefrontAntiSpamReport {
    // cheap inheritance
    private antiSpamReport = new AntiSpamReport();
    private _forefrontAntiSpamRows: row[] = [
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

    public add(report: string): void { this.antiSpamReport.parse(report, this._forefrontAntiSpamRows); }
    public exists(): boolean { return this.antiSpamReport.existsInternal(this._forefrontAntiSpamRows); }

    public get source(): string { return this.antiSpamReport.source; };
    public get unparsed(): string { return this.antiSpamReport.unparsed; };
    public get forefrontAntiSpamRows(): row[] { return this._forefrontAntiSpamRows; };
    public toString(): string {
        if (!this.exists()) return "";
        const ret = ["ForefrontAntiSpamReport"];
        this._forefrontAntiSpamRows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}