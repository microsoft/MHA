/* global AntiSpamReport */
/* global ForefrontAntiSpamReport */
/* global Decoder */
/* global Other */
/* global Received */
/* global Summary */
/* global message */
/* exported HeaderModel */

var HeaderModel = (function (headers) {
    "use strict";

    var summary = Summary();
    var receivedHeaders = Received();
    var forefrontAntiSpamReport = ForefrontAntiSpamReport();
    var antiSpamReport = AntiSpamReport();
    var otherHeaders = Other();
    var originalHeaders = "";
    var status = "";
    var hasData = false;

    var Header = function (_header, _value) {
        return {
            header: _header,
            value: _value
        };
    };

    function parseHeaders(headers) {
        // Initialize originalHeaders in case we have parsing problems
        // Flatten CRLF to LF to avoid extra blank lines
        originalHeaders = headers.replace(/(?:\r\n|\r|\n)/g, '\n');
        var headerList = GetHeaderList(headers);

        if (headerList.length > 0) {
            hasData = true;
        }

        for (var i = 0; i < headerList.length; i++) {
            // Grab values for our summary pane
            if (summary.add(headerList[i])) continue;

            // Properties with special parsing
            switch (headerList[i].header.toUpperCase()) {
                case "X-Forefront-Antispam-Report".toUpperCase():
                    forefrontAntiSpamReport.add(headerList[i].value);
                    continue;
                case "X-Microsoft-Antispam".toUpperCase():
                    antiSpamReport.add(headerList[i].value);
                    continue;
            }

            if (headerList[i].header.toUpperCase() === "Received".toUpperCase()) {
                receivedHeaders.add(headerList[i].value);
            } else if (headerList[i].header || headerList[i].value) {
                otherHeaders.add(headerList[i]);
            }
        }

        summary.totalTime = receivedHeaders.computeDeltas();
    }

    function GetHeaderList(headers) {
        // First, break up out input by lines.
        var lines = headers.split(/[\n\r]+/);

        var headerList = [];
        var iNextHeader = 0;
        // Unfold lines
        for (var iLine = 0; iLine < lines.length; iLine++) {
            var line = lines[iLine];
            // Skip empty lines
            if (line === "") continue;

            // Recognizing a header:
            // - First colon comes before first white space.
            // - We're not strictly honoring white space folding because initial white space
            // - is commonly lost. Instead, we heuristically assume that space before a colon must have been folded.
            // This expression will give us:
            // match[1] - everything before the first colon, assuming no spaces (header).
            // match[2] - everything after the first colon (value).
            var match = line.match(/(^[\w-.]*?): ?(.*)/);

            // There's one false positive we might get: if the time in a Received header has been
            // folded to the next line, the line might start with something like "16:20:05 -0400".
            // This matches our regular expression. The RFC does not preclude such a header, but I've
            // never seen one in practice, so we check for and exclude 'headers' that
            // consist only of 1 or 2 digits.
            if (match && match[1] && !match[1].match(/^\d{1,2}$/)) {
                headerList[iNextHeader] = Header(match[1], match[2]);
                iNextHeader++;
            } else {
                if (iNextHeader > 0) {
                    // Tack this line to the previous line
                    // All folding whitespace should collapse to a single space
                    line = line.replace(/^[\s]+/, "");
                    if (!line) continue;
                    var separator = headerList[iNextHeader - 1].value ? " " : "";
                    headerList[iNextHeader - 1].value += separator + line;
                } else {
                    // If we didn't have a previous line, go ahead and use this line
                    if (line.match(/\S/g)) {
                        headerList[iNextHeader] = Header("", line);
                        iNextHeader++;
                    }
                }
            }
        }

        // 2047 decode our headers now
        for (var iHeader = 0; iHeader < headerList.length; iHeader++) {
            // Clean 2047 encoding
            // Strip nulls
            // Strip trailing carriage returns
            var headerValue = Decoder.clean2047Encoding(headerList[iHeader].value).replace(/\0/g, "").replace(/[\n\r]+$/, "");
            headerList[iHeader].value = headerValue;
        }

        return headerList;
    }

    function toString() {
        var ret = [];
        if (summary.exists()) ret.push(summary);
        if (receivedHeaders.exists()) ret.push(receivedHeaders);
        if (forefrontAntiSpamReport.exists()) ret.push(forefrontAntiSpamReport);
        if (antiSpamReport.exists()) ret.push(antiSpamReport);
        if (otherHeaders.exists()) ret.push(otherHeaders);
        return ret.join("\n\n");
    }

    if (headers) {
        parseHeaders(headers);
        message.postMessageToParent("modelToString", toString());
    }

    return {
        originalHeaders: originalHeaders,
        summary: summary,
        receivedHeaders: receivedHeaders,
        forefrontAntiSpamReport: forefrontAntiSpamReport,
        antiSpamReport: antiSpamReport,
        otherHeaders: otherHeaders,
        get hasData() { return hasData || status; },
        GetHeaderList: GetHeaderList,
        get status() { return status; },
        set status(value) { status = value; },
        toString: toString
    };
});