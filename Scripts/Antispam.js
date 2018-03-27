/* global ImportedStrings */
/* global ParseAntiSpamReport */

/// <reference path="Table.js" />
/// <reference path="Strings.js" />
/// <reference path="Headers.js" />
/// <reference path="ForefrontAntispam.js" />

var AntiSpamRow = function (header, label, url, set, get) {
    this.header = header;
    this.label = label;
    this.url = url;

    this.set = set || this.set;
    this.get = get || this.get;
};

AntiSpamRow.prototype.header = "";
AntiSpamRow.prototype.label = "";
AntiSpamRow.prototype.url = "";
AntiSpamRow.prototype.value = "";
AntiSpamRow.prototype.set = function (_value) { this.value = _value; };
AntiSpamRow.prototype.get = function () { return this.value; };

var AntiSpamReport = function () {
    this.antiSpamRows = [
        new AntiSpamRow("BCL", ImportedStrings.mha_bcl, "X-Microsoft-Antispam"),
        new AntiSpamRow("PCL", ImportedStrings.mha_pcl, "X-Microsoft-Antispam")
    ];
};

AntiSpamReport.prototype.antiSpamRows = [];

AntiSpamReport.prototype.exists = function () {
    for (var i = 0; i < this.antiSpamRows.length; i++) {
        if (this.antiSpamRows[i].get()) {
            return true;
        }
    }

    return false;
};

AntiSpamReport.prototype.init = function (report) {
    ParseAntiSpamReport(report, this.antiSpamRows);
};