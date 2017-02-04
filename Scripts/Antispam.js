/// <reference path="Table.js" />
/// <reference path="Strings.js" />

var AntiSpamRow = function (header, label, url, set, get) {
    this.header = header;
    this.label = label;
    this.url = url;

    var that = this;

    this.set = set || function (_value) { that.value = _value; };
    this.get = get || function () { return that.value; };
};

AntiSpamRow.prototype.header = "";
AntiSpamRow.prototype.label = "";
AntiSpamRow.prototype.url = "";
AntiSpamRow.prototype.value = "";
AntiSpamRow.prototype.set = function (_value) { };
AntiSpamRow.prototype.get = function () { };

var AntiSpamReport = function () {
    var that = this;

    this.antiSpamRows = [
        new AntiSpamRow("BCL", ImportedStrings.mha_bcl, "X-Microsoft-Antispam"),
        new AntiSpamRow("PCL", ImportedStrings.mha_pcl, "X-Microsoft-Antispam")
    ];

    makeResizablePane("antiSpamReport", ImportedStrings.mha_antiSpamReport, function () { return that.exists(); });
    makeSummaryTable("#antiSpamReport", this.antiSpamRows, "AS");
};

AntiSpamReport.prototype.antiSpamRows = [];

AntiSpamReport.prototype.reset = function () {
    for (var i = 0 ; i < this.antiSpamRows.length ; i++) {
        this.antiSpamRows[i].set("");
    }
};

AntiSpamReport.prototype.exists = function () {
    for (var i = 0 ; i < this.antiSpamRows.length ; i++) {
        if (this.antiSpamRows[i].get()) {
            return true;
        }
    }

    return false;
};

AntiSpamReport.prototype.populateTable = function () {
    for (var i = 0 ; i < this.antiSpamRows.length ; i++) {
        var headerVal = $("#" + this.antiSpamRows[i].header + "ASVal");
        if (headerVal) {
            headerVal.html(mapHeaderToURL(this.antiSpamRows[i].url, this.antiSpamRows[i].get()));
        }
    }
};

AntiSpamReport.prototype.init = function (report) {
    ParseAntiSpamReport(report, this.antiSpamRows);
};