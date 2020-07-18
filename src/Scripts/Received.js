/* global appInsights */
/* global mhaStrings */
/* exported Received */

var Received = (function () {
    var receivedRows = [];
    var sortColumn = "hop";
    var sortOrder = 1;

    // Builds array of values for each header in receivedHeaderNames.
    // This algorithm should work regardless of the order of the headers, given:
    //  - The date, if present, is always at the end, separated by a ";".
    // Values not attached to a header will not be reflected in output.
    function parseHeader(receivedHeader) {
        var parsedRow = {
            sourceHeader: receivedHeader,
            delaySort: -1, // Force the "no previous or current time" rows to sort before the 0 second rows
            percent: 0
        }

        if (!receivedHeader) { return parsedRow; }
        // Strip linefeeds first
        receivedHeader = receivedHeader.replace(/\r|\n|\r\n/g, ' ')

        var receivedHeaderNames = ["from", "by", "with", "id", "for", "via"];

        // Build array of header locations
        var headerMatches = [];

        // Some bad dates don't wrap UTC in paren - fix that first
        receivedHeader = receivedHeader.replace(/UTC|\(UTC\)/gi, "(UTC)");

        // Read out the date first, then clear it from the string
        var iDate = receivedHeader.lastIndexOf(";");

        // No semicolon means no date - or maybe there's one there?
        // Sendgrid is bad about this
        if (iDate === -1) {
            // First try to find a day of the week
            receivedHeader = receivedHeader.replace(/\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/g, "; $1");
            iDate = receivedHeader.lastIndexOf(";");
        }

        if (iDate === -1) {
            // Next we look for year-month-day, 4-1/2-1/2
            receivedHeader = receivedHeader.replace(/\s*(\d{4}-\d{1,2}-\d{1,2})/g, "; $1");
            iDate = receivedHeader.lastIndexOf(";");
        }

        if (iDate !== -1 && receivedHeader.length !== iDate + 1) {
            var date = receivedHeader.substring(iDate + 1);
            receivedHeader = receivedHeader.substring(0, iDate);

            // Invert any backwards dates: 2018-01-28 -> 01-28-2018
            date = date.replace(/\s*(\d{4})-(\d{1,2})-(\d{1,2})/g, "$2/$3/$1");
            // Replace dashes with slashes
            date = date.replace(/\s*(\d{1,2})-(\d{1,2})-(\d{4})/g, "$1/$2/$3");

            // If we don't have a +xxxx or -xxxx on our date, it will be interpreted in local time
            // This likely isn't the intended timezone, so we add a +0000 to get UTC
            var offset = date.match(/[+|-]\d{4}/);
            if (!offset || offset.length !== 1) {
                date += " +0000";
            }

            // Some browsers don't like milliseconds in parse
            // Trim off milliseconds so we don't pass them into Date.parse
            var milliseconds = date.match(/\d{1,2}:\d{2}:\d{2}.(\d+)/);
            date = date.replace(/(\d{1,2}:\d{2}:\d{2}).(\d+)/, "$1");

            // And now we can parse our date
            parsedRow.dateNum = Date.parse(date);
            if (milliseconds && milliseconds.length >= 2) {
                parsedRow.dateNum = parsedRow.dateNum + Math.floor(parseFloat("0." + milliseconds[1]) * 1000);
            }

            parsedRow.date = dateString(date);
            parsedRow.dateSort = parsedRow.dateNum;
        }

        // Scan for malformed postFix headers
        // Received: by example.com (Postfix, from userid 1001)
        //   id 1234ABCD; Thu, 21 Aug 2014 12:12:48 +0200 (CEST)
        var postFix = receivedHeader.match(/(.*)by (.*? \(Postfix, from userid .*?\))(.*)/mi);
        if (postFix) {
            parsedRow.by = postFix[2];
            receivedHeader = postFix[1] + postFix[3];
            receivedHeaderNames = removeEntry(receivedHeaderNames, "by");
        }

        // Scan for malformed qmail headers
        // Received: (qmail 10876 invoked from network); 24 Aug 2014 16:13:38 -0000
        var qmail = receivedHeader.match(/(.*)\((qmail .*? invoked from .*?)\)(.*)/mi);
        if (qmail) {
            parsedRow.by = qmail[2];
            receivedHeader = qmail[1] + qmail[3];
            receivedHeaderNames = removeEntry(receivedHeaderNames, "by");
        }

        // Split up the string now so we can look for our headers
        var tokens = receivedHeader.split(/\s+/);

        var iMatch = 0;
        receivedHeaderNames.forEach(function (receivedHeaderName, iHeader) {
            tokens.some(function (token, iToken) {
                if (receivedHeaderName.toUpperCase() === token.toUpperCase()) {
                    headerMatches[iMatch++] = { iHeader: iHeader, iToken: iToken };
                    // We don't return true so we can match any duplicate headers
                    // In doing this, we risk failing to parse a string where a header
                    // keyword appears as the value for another header
                    // Both situations are invalid input
                    // We're just picking which one we'd prefer to handle
                }
            });
        });

        // Next bit assumes headerMatches[x,y] is increasing on y.
        // Sort it so it is.
        headerMatches.sort(function (a, b) { return a.iToken - b.iToken; });

        headerMatches.forEach(function (headerMatch, iMatch) {
            var iNextTokenHeader;
            if (iMatch + 1 < headerMatches.length) {
                iNextTokenHeader = headerMatches[iMatch + 1].iToken;
            } else {
                iNextTokenHeader = tokens.length;
            }

            var headerName = receivedHeaderNames[headerMatch.iHeader];
            if (parsedRow[headerName] === undefined) { parsedRow[headerName] = ""; }
            if (parsedRow[headerName] !== "") { parsedRow[headerName] += "; "; }
            parsedRow[headerName] += tokens.slice(headerMatch.iToken + 1, iNextTokenHeader).join(" ").trim();
        });

        return parsedRow;
    }

    function exists() { return receivedRows.length > 0; }

    function doSort(col) {
        if (sortColumn === col) {
            sortOrder *= -1;
        } else {
            sortColumn = col;
            sortOrder = 1;
        }

        if (sortColumn + "Sort" in receivedRows[0]) {
            col = col + "Sort";
        }

        var that = this;
        receivedRows.sort(function (a, b) {
            return that.sortOrder * (a[col] < b[col] ? -1 : 1);
        });
    }

    function removeEntry(stringArray, entry) {
        var i = stringArray.indexOf(entry);
        if (i >= 0) {
            stringArray.splice(i, 1);
        }

        return stringArray;
    }

    function init(receivedHeader) { receivedRows.push(parseHeader(receivedHeader)); }

    function computeDeltas() {
        // Process received headers in reverse order
        receivedRows.reverse();

        // Parse rows and compute values needed for the "Delay" column
        var iStartTime = 0;
        var iEndTime = 0;
        var iLastTime = NaN;
        var iDelta = 0; // This will be the sum of our positive deltas

        receivedRows.forEach(function (row) {
            if (!isNaN(row.dateNum)) {
                if (!isNaN(iLastTime) && iLastTime < row.dateNum) {
                    iDelta += row.dateNum - iLastTime;
                }

                iStartTime = iStartTime || row.dateNum;
                iEndTime = row.dateNum;
                iLastTime = row.dateNum;
            }
        });

        iLastTime = NaN;

        receivedRows.forEach(function (row, index) {
            row.hop = index + 1;
            row.delay = computeTime(row.dateNum, iLastTime);

            if (!isNaN(row.dateNum) && !isNaN(iLastTime) && iDelta !== 0) {
                row.delaySort = row.dateNum - iLastTime;

                // Only positive delays will get percentage bars. Negative delays will be color coded at render time.
                if (row.delaySort > 0) {
                    row.percent = 100 * row.delaySort / iDelta;
                }
            }

            if (!isNaN(row.dateNum)) {
                iLastTime = row.dateNum;
            }
        });

        // Total time is still last minus first, even if negative.
        return iEndTime !== iStartTime ? computeTime(iEndTime, iStartTime) : "";
    }

    // Computes min/sec from the diff of current and last.
    // Returns nothing if last or current is NaN.
    function computeTime(current, last) {
        var time = [];

        if (isNaN(current) || isNaN(last)) { return ""; }
        var diff = current - last;
        var iDelay;
        var printedMinutes = false;

        if (Math.abs(diff) < 1000) {
            return "0 " + mhaStrings.mha_seconds;
        }

        if (diff < 0) {
            time.push(mhaStrings.mha_negative);
            diff = -diff;
        }

        if (diff >= 1000 * 60) {
            iDelay = Math.floor(diff / 1000 / 60);
            time.push(iDelay, " ");
            if (iDelay === 1) {
                time.push(mhaStrings.mha_minute);
            } else {
                time.push(mhaStrings.mha_minutes);
            }

            diff -= iDelay * 1000 * 60;
            printedMinutes = true;
        }

        if (printedMinutes && diff) {
            time.push(" ");
        }

        if (!printedMinutes || diff) {
            iDelay = Math.floor(diff / 1000);
            time.push(iDelay, " ");
            if (iDelay === 1) {
                time.push(mhaStrings.mha_second);
            } else {
                time.push(mhaStrings.mha_seconds);
            }
        }

        return time.join("");
    }

    function dateString(value) {
        try {

            var ret = new Date(value).toLocaleString().replace(/\u200E|,/g, "");
            return ret;
        } catch (e) {
            appInsights.trackException(e, { date: value });
            return value;
        }
    }

    return {
        init: init,
        exists: exists,
        doSort: doSort,
        computeDeltas: computeDeltas,
        get receivedRows() { return receivedRows; },
        get sortColumn() { return sortColumn; },
        get sortOrder() { return sortOrder; },
        parseHeader: parseHeader, // For testing only
        dateString: dateString, // For testing only
        computeTime: computeTime // For testing only
    }
});