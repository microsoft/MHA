/// <reference path="Table.js" />
/// <reference path="Strings.js" />
/// <reference path="Headers.js" />
var ForefrontAntiSpamRow = function (header, label, url, set, get) {
    this.header = header;
    this.label = label;
    this.url = url;

    var that = this;

    this.set = set || function (value) { that.value = value; };
    this.get = get || function () { return that.value; };
};

ForefrontAntiSpamRow.prototype.header = "";
ForefrontAntiSpamRow.prototype.label = "";
ForefrontAntiSpamRow.prototype.url = "";
ForefrontAntiSpamRow.prototype.value = "";
ForefrontAntiSpamRow.prototype.set = function () { };
ForefrontAntiSpamRow.prototype.get = function () { };

var ForefrontAntiSpamReport = function () {
    this.forefrontAntiSpamRows = [
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
};

ForefrontAntiSpamReport.prototype.forefrontAntiSpamRows = [];

ForefrontAntiSpamReport.prototype.reset = function () {
    for (var i = 0; i < this.forefrontAntiSpamRows.length; i++) {
        this.forefrontAntiSpamRows[i].set("");
    }
};

ForefrontAntiSpamReport.prototype.exists = function () {
    for (var i = 0; i < this.forefrontAntiSpamRows.length; i++) {
        if (this.forefrontAntiSpamRows[i].get()) {
            return true;
        }
    }

    return false;
};

//// http://technet.microsoft.com/en-us/library/dn205071(v=exchg.150).aspx
function ParseAntiSpamReport(report, antispamRows) {
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

    var lines = report.match(/(.*?):(.*?);/g);
    if (lines) {
        for (var iLine = 0; iLine < lines.length; iLine++) {
            var line = lines[iLine].match(/(.*?):(.*?);/m);
            if (line && line[1] && line[2]) {
                for (var i = 0; i < antispamRows.length; i++) {
                    if (antispamRows[i].header.toUpperCase() === line[1].toUpperCase()) {
                        antispamRows[i].set(line[2]);
                        break;
                    }
                }
            }
        }
    }
}

ForefrontAntiSpamReport.prototype.init = function (report) {
    ParseAntiSpamReport(report, this.forefrontAntiSpamRows);
};