/* global ImportedStrings */
/* global AntiSpamReport */
/* exported ForefrontAntiSpamReport */

var ForefrontAntiSpamReport = (function () {
    var ForefrontAntiSpamRow = function (header, label, url, set, get) {
        this.header = header;
        this.label = label;
        this.url = url;

        this.set = set || this.set;
        this.get = get || this.get;
    };

    ForefrontAntiSpamRow.prototype.header = "";
    ForefrontAntiSpamRow.prototype.label = "";
    ForefrontAntiSpamRow.prototype.url = "";
    ForefrontAntiSpamRow.prototype.value = "";
    ForefrontAntiSpamRow.prototype.set = function (_value) { this.value = _value; };
    ForefrontAntiSpamRow.prototype.get = function () { return this.value; };

    var forefrontrows = [
        new ForefrontAntiSpamRow("CTRY", ImportedStrings.mha_countryRegion, "X-Forefront-Antispam-Report"),
        new ForefrontAntiSpamRow("LANG", ImportedStrings.mha_lang, "X-Forefront-Antispam-Report"),
        new ForefrontAntiSpamRow("SCL", ImportedStrings.mha_scl, "X-MS-Exchange-Organization-SCL"),
        new ForefrontAntiSpamRow("PCL", ImportedStrings.mha_pcl, "X-Forefront-Antispam-Report"),
        new ForefrontAntiSpamRow("SFV", ImportedStrings.mha_sfv, "X-Forefront-Antispam-Report"),
        new ForefrontAntiSpamRow("IPV", ImportedStrings.mha_ipv, "X-Forefront-Antispam-Report"),
        new ForefrontAntiSpamRow("H", ImportedStrings.mha_h, "X-Forefront-Antispam-Report"),
        new ForefrontAntiSpamRow("PTR", ImportedStrings.mha_ptr, "X-Forefront-Antispam-Report"),
        new ForefrontAntiSpamRow("CIP", ImportedStrings.mha_cip, "X-Forefront-Antispam-Report"),
        new ForefrontAntiSpamRow("X-CustomSpam", ImportedStrings.mha_customSpam, "X-Forefront-Antispam-Report")
    ];

    function init(report) {
        AntiSpamReport().parse(report, forefrontrows);
    }

    function exists() {
        for (var i = 0; i < forefrontrows.length; i++) {
            if (forefrontrows[i].get()) {
                return true;
            }
        }

        return false;
    }

    function rows() { return forefrontrows; }

    return {
        init: init,
        exists: exists,
        rows: rows
    }
});