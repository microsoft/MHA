/* global mhaStrings  */
/* exported AntiSpamReport */

var AntiSpamReport = (function () {
    var row = function (header, label, url) {
        var _value = "";
        function _get() { return _value; }
        function _set(__value) { _value = __value; }

        return {
            header: header,
            label: label,
            url: url,
            get value() { return _get(); },
            set value(_value) { _set(_value); }
        }
    };

    var antiSpamRows = [
        row("BCL", mhaStrings.mha_bcl, "X-Microsoft-Antispam"),
        row("PCL", mhaStrings.mha_pcl, "X-Microsoft-Antispam")
    ];

    function existsInternal(rows) {
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].value) {
                return true;
            }
        }

        return false;
    }

    // https://technet.microsoft.com/en-us/library/dn205071
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
                            rows[i].value = line[2];
                            break;
                        }
                    }
                }
            }
        }
    }

    function init(report) { parse(report, antiSpamRows); }
    function exists() { return existsInternal(antiSpamRows); }

    return {
        init: init,
        exists: exists,
        existsInternal: existsInternal,
        parse: parse,
        get antiSpamRows() { return antiSpamRows; },
        row: row
    }
});