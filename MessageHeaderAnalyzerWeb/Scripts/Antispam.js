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
        new AntiSpamRow("CTRY", ImportedStrings.mha_countryRegion, "X-Forefront-Antispam-Report"),
        new AntiSpamRow("LANG", ImportedStrings.mha_lang, "X-Forefront-Antispam-Report"),
        new AntiSpamRow("SCL", ImportedStrings.mha_scl, "X-MS-Exchange-Organization-SCL"),
        new AntiSpamRow("SFV", ImportedStrings.mha_sfv, "X-Forefront-Antispam-Report")
    ];

    makeResizablePane("antiSpamReport", ImportedStrings.mha_antiSpamReport, function () { return that.exists(); });
    makeSummaryTable("#antiSpamReport", this.antiSpamRows);
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
        var headerVal = $("#" + this.antiSpamRows[i].header + "Val");
        if (headerVal) {
            headerVal.html(mapHeaderToURL(this.antiSpamRows[i].url, this.antiSpamRows[i].get()));
        }
    }
};

//// http://technet.microsoft.com/en-us/library/dn205071(v=exchg.150).aspx
AntiSpamReport.prototype.init = function (report) {
    if (!report) {
        return;
    }

    // Sometimes we see extraneous (null) in the report. They look like this: UIP:(null);(null);(null)SFV:SKI
    // First pass: Remove the (null).
    report = report.replace(/\(null\)/g, "");
    // Removing the (null) can leave consecutive ; which confound later parsing.
    // Second pass: Collapse them.
    report = report.replace(/;+/g, ";");

    var lines = report.match(/(.*?):(.*?);/g);
    if (lines) {
        for (var iLine = 0 ; iLine < lines.length ; iLine++) {
            var line = lines[iLine].match(/(.*?):(.*?);/m);
            if (line && line[1] && line[2]) {
                for (var i = 0 ; i < this.antiSpamRows.length ; i++) {
                    if (this.antiSpamRows[i].header === line[1].toUpperCase()) {
                        this.antiSpamRows[i].set(line[2]);
                        break;
                    }
                }
            }
        }
    }
};