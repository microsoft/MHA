/* global mhaStrings  */
/* exported AntiSpamReport */

var AntiSpamReport = (function () {
    var row = function (header, label, url) {
        return {
            header: header,
            label: label,
            url: url,
            value: ""
        }
    };

    var source = "";
    var unparsed = "";
    var antiSpamRows = [
        row("BCL", mhaStrings.mha_bcl, "X-Microsoft-Antispam"),
        row("PCL", mhaStrings.mha_pcl, "X-Microsoft-Antispam"),
        row("source", mhaStrings.mha_source, "X-Microsoft-Antispam"),
        row("unparsed", mhaStrings.mha_unparsed, "X-Microsoft-Antispam")
    ];

    function existsInternal(rows) {
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].value) {
                return true;
            }
        }

        return false;
    }

    function setRowValue(rows, key, value) {
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].header.toUpperCase() === key.toUpperCase()) {
                rows[i].value = value;
                return true;
            }
        }

        return false;
    }

    // https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers
    function parse(report, rows) {
        source = report;
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
        unparsed = "";
        if (lines) {
            for (var iLine = 0; iLine < lines.length; iLine++) {
                var line = lines[iLine].match(/(.*?):(.*?);/m);
                if (line && line[1]) {
                    if (!setRowValue(rows, line[1], line[2])) {
                        unparsed += line[1] + ':' + line[2] + ';';
                    }
                }
            }
        }

        setRowValue(rows, "source", source);
        setRowValue(rows, "unparsed", unparsed);
    }

    function init(report) { parse(report, antiSpamRows); }
    function exists() { return existsInternal(antiSpamRows); }

    return {
        init: init,
        exists: exists,
        existsInternal: existsInternal,
        parse: parse,
        get source() { return source; },
        get unparsed() { return unparsed; },
        get antiSpamRows() { return antiSpamRows; },
        row: row
    }
});