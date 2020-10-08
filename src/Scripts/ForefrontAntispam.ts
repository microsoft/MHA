import mhaStrings from "./Strings";
import AntiSpamReport from "./AntiSpam";

const ForefrontAntiSpamReport = (function () {
    "use strict";

    // cheap inheritance
    const antiSpamReport = AntiSpamReport();
    const forefrontAntiSpamRows = [
        antiSpamReport.row("ARC", mhaStrings.mhaArc, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("CTRY", mhaStrings.mhaCountryRegion, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("LANG", mhaStrings.mhaLang, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("SCL", mhaStrings.mhaScl, "X-MS-Exchange-Organization-SCL"),
        antiSpamReport.row("PCL", mhaStrings.mhaPcl, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("SFV", mhaStrings.mhaSfv, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("IPV", mhaStrings.mhaIpv, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("H", mhaStrings.mhaHelo, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("PTR", mhaStrings.mhaPtr, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("CIP", mhaStrings.mhaCip, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("CAT", mhaStrings.mhaCat, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("SFTY", mhaStrings.mhaSfty, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("SRV", mhaStrings.mhaSrv, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("X-CustomSpam", mhaStrings.mhaCustomSpam, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("SFS", mhaStrings.mhaSfs, "SFS"),
        antiSpamReport.row("source", mhaStrings.mhaSource, "X-Microsoft-Antispam"),
        antiSpamReport.row("unparsed", mhaStrings.mhaUnparsed, "X-Microsoft-Antispam")

    ];

    function add(report) { antiSpamReport.parse(report, forefrontAntiSpamRows); }
    function exists() { return antiSpamReport.existsInternal(forefrontAntiSpamRows); }

    return {
        add: add,
        exists: exists,
        get source() { return antiSpamReport.source; },
        get unparsed() { return antiSpamReport.unparsed; },
        get forefrontAntiSpamRows() { return forefrontAntiSpamRows; },
        toString: function () {
            if (!exists()) return "";
            const ret = ["ForefrontAntiSpamReport"];
            forefrontAntiSpamRows.forEach(function (row) {
                if (row.value) { ret.push(row.toString()); }
            });
            return ret.join("\n");
        }
    };
});

export default ForefrontAntiSpamReport;