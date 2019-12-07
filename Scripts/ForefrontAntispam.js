/* global ImportedStrings */
/* global AntiSpamReport */
/* exported ForefrontAntiSpamReport */

var ForefrontAntiSpamReport = (function () {
    // cheap inheritance
    var antiSpamReport = AntiSpamReport();
    var forefrontrows = [
        antiSpamReport.row("CTRY", ImportedStrings.mha_countryRegion, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("LANG", ImportedStrings.mha_lang, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("SCL", ImportedStrings.mha_scl, "X-MS-Exchange-Organization-SCL"),
        antiSpamReport.row("PCL", ImportedStrings.mha_pcl, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("SFV", ImportedStrings.mha_sfv, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("IPV", ImportedStrings.mha_ipv, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("H", ImportedStrings.mha_h, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("PTR", ImportedStrings.mha_ptr, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("CIP", ImportedStrings.mha_cip, "X-Forefront-Antispam-Report"),
        antiSpamReport.row("X-CustomSpam", ImportedStrings.mha_customSpam, "X-Forefront-Antispam-Report")
    ];

    function init(report) { antiSpamReport.parse(report, forefrontrows); }
    function exists() { return antiSpamReport.existsInternal(forefrontrows); }
    function rows() { return forefrontrows; }

    return {
        init: init,
        exists: exists,
        rows: rows
    }
});