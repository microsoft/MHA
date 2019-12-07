/* global ImportedStrings */
/* exported AntiSpamReport */

var AntiSpamReport = (function () {
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

    var antispamRows = [
        new AntiSpamRow("BCL", ImportedStrings.mha_bcl, "X-Microsoft-Antispam"),
        new AntiSpamRow("PCL", ImportedStrings.mha_pcl, "X-Microsoft-Antispam")
    ];

    function exists() {
        for (var i = 0; i < this.rows().length; i++) {
            if (this.rows()[i].get()) {
                return true;
            }
        }

        return false;
    }

    function init(report) {
        parse(report, antispamRows);
    }

    function rows() { return antispamRows;}

    //// https://technet.microsoft.com/en-us/library/dn205071
    function parse(report, rows) {
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
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].header.toUpperCase() === line[1].toUpperCase()) {
                            rows[i].set(line[2]);
                            break;
                        }
                    }
                }
            }
        }
    }

    return {
        init: init,
        exists: exists,
        parse: parse,
        rows: rows
    }
});


