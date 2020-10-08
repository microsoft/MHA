/* global mhaStrings  */
/* exported AntiSpamReport */

const AntiSpamReport = (function () {
    "use strict";

    const row = function (header, label, headerName) {
        return {
            header: header,
            label: label,
            headerName: headerName,
            value: "",
            valueUrl: "",
            toString: function () { return this.label + ": " + this.value; }

        }
    };

    let source = "";
    let unparsed = "";
    const antiSpamRows = [
        row("BCL", mhaStrings.mhaBcl, "X-Microsoft-Antispam"),
        row("PCL", mhaStrings.mhaPcl, "X-Microsoft-Antispam"),
        row("source", mhaStrings.mhaSource, "X-Microsoft-Antispam"),
        row("unparsed", mhaStrings.mhaUnparsed, "X-Microsoft-Antispam")
    ];

    function existsInternal(rows) {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].value) {
                return true;
            }
        }

        return false;
    }

    function setRowValue(rows, key, value) {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].header.toUpperCase() === key.toUpperCase()) {
                rows[i].value = value;
                rows[i].valueUrl = mhaStrings.mapHeaderToURL(rows[i].headerName, value);
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

        const lines = report.match(/(.*?):(.*?);/g);
        unparsed = "";
        if (lines) {
            for (let iLine = 0; iLine < lines.length; iLine++) {
                const line = lines[iLine].match(/(.*?):(.*?);/m);
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

    function add(report) { parse(report, antiSpamRows); }
    function exists() { return existsInternal(antiSpamRows); }

    return {
        add: add,
        exists: exists,
        existsInternal: existsInternal,
        parse: parse,
        get source() { return source; },
        get unparsed() { return unparsed; },
        get antiSpamRows() { return antiSpamRows; },
        row: row,
        toString: function () {
            if (!exists()) return "";
            const ret = ["AntiSpamReport"];
            antiSpamRows.forEach(function (row) {
                if (row.value) { ret.push(row.toString()); }
            });
            return ret.join("\n");
        }
    };
});