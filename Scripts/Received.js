/* global ImportedStrings */
/* global appInsights */
/* exported Received */

var Received = (function () {
    var tableName = "receivedHeaders";
    var receivedRows = [];
    var sortColumn = "hop";
    var sortOrder = 1;

    // Builds array of values for each header in receivedHeaderNames.
    // This algorithm should work regardless of the order of the headers, given:
    //  - The date, if present, is always at the end, separated by a ";".
    // Values not attached to a header will not be reflected in output.
    var row = function (receivedHeader) {
        var receivedHeaderNames = ["from", "by", "with", "id", "for", "via"];

        // Build array of header locations
        var headerMatches = [];

        var retVal = { sourceHeader: receivedHeader };

        // Some bad dates don't wrap UTC in paren - fix that first
        receivedHeader = receivedHeader.replace(/UTC|\(UTC\)/g, "(UTC)");

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
            // Next we look for year-month-day
            receivedHeader = receivedHeader.replace(/\s*(\d{4}-\d{1,2}-\d{1,2})/g, "; $1");
            iDate = receivedHeader.lastIndexOf(";");
        }

        if (iDate !== -1) {
            retVal.date = receivedHeader.substring(iDate + 1);
            receivedHeader = receivedHeader.substring(0, iDate);

            // Invert any backwards dates: 2018-01-28 -> 01-28-2018
            retVal.date = retVal.date.replace(/\s*(\d{4})-(\d{1,2})-(\d{1,2})/g, "$2/$3/$1");
            // Replace dashes with slashes
            retVal.date = retVal.date.replace(/\s*(\d{1,2})-(\d{1,2})-(\d{4})/g, "$1/$2/$3");

            // If we don't have a +xxxx or -xxxx on our date, it will be interpreted in local time
            // This likely isn't the intended timezone, so we add a +0000 to get UTC
            var offset = retVal.date.match(/[+|-]\d{4}/);
            if (!offset || offset.length !== 1) {
                retVal.date += " +0000";
            }

            // Some browsers don't like milliseconds in parse
            // Trim off milliseconds so we don't pass them into Date.parse
            var milliseconds = retVal.date.match(/\d{1,2}:\d{2}:\d{2}.(\d+)/);
            var trimDate = retVal.date.replace(/(\d{1,2}:\d{2}:\d{2}).(\d+)/, "$1");

            // And now we can parse our date
            retVal.dateNum = Date.parse(trimDate);
            if (milliseconds && milliseconds.length >= 2) {
                retVal.dateNum = retVal.dateNum + Math.floor(parseFloat("0." + milliseconds[1]) * 1000);
            }

            retVal.date = dateString(trimDate);
            retVal.dateSort = retVal.dateNum;
        }

        // Scan for malformed postFix headers
        // Received: by example.com (Postfix, from userid 1001)
        //   id 1234ABCD; Thu, 21 Aug 2014 12:12:48 +0200 (CEST)
        var postFix = receivedHeader.match(/(.*)by (.*? \(Postfix, from userid .*?\))(.*)/);
        if (postFix) {
            retVal.by = postFix[2];
            receivedHeader = postFix[1] + postFix[3];
            receivedHeaderNames = RemoveEntry(receivedHeaderNames, "by");
        }

        // Scan for malformed qmail headers
        // Received: (qmail 10876 invoked from network); 24 Aug 2014 16:13:38 -0000
        postFix = receivedHeader.match(/(.*)\((qmail .*? invoked from .*?)\)(.*)/);
        if (postFix) {
            retVal.by = postFix[2];
            receivedHeader = postFix[1] + postFix[3];
            receivedHeaderNames = RemoveEntry(receivedHeaderNames, "by");
        }

        // Split up the string now so we can look for our headers
        var tokens = receivedHeader.split(/\s+/);

        var iMatch = 0;
        receivedHeaderNames.forEach(function (receivedHeaderName, iHeader) {
            tokens.some(function (token, iToken) {
                if (receivedHeaderName === token) {
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
            if (retVal[headerName] === undefined) { retVal[headerName] = ""; }
            if (retVal[headerName] !== "") { retVal[headerName] += "; "; }
            retVal[headerName] += tokens.slice(headerMatch.iToken + 1, iNextTokenHeader).join(" ").trim();
        }, retVal);

        retVal.delaySort = -1; // Force the "no previous or current time" rows to sort before the 0 second rows
        retVal.percent = 0;

        return retVal;
    };

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

    function RemoveEntry(stringArray, entry) {
        var i = stringArray.indexOf(entry);
        if (i >= 0) {
            stringArray.splice(i, 1);
        }

        return stringArray;
    }

    function init(receivedHeader) { receivedRows.push(row(receivedHeader)); }

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
            return "0 " + ImportedStrings.mha_seconds;
        }

        if (diff < 0) {
            time.push(ImportedStrings.mha_negative);
            diff = -diff;
        }

        if (diff >= 1000 * 60) {
            iDelay = Math.floor(diff / 1000 / 60);
            time.push(iDelay, " ");
            if (iDelay === 1) {
                time.push(ImportedStrings.mha_minute);
            } else {
                time.push(ImportedStrings.mha_minutes);
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
                time.push(ImportedStrings.mha_second);
            } else {
                time.push(ImportedStrings.mha_seconds);
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
        tableName: tableName,
        get receivedRows() { return receivedRows; },
        get sortColumn() { return sortColumn; },
        get sortOrder() { return sortOrder; },
        row: row, // For testing only
        dateString: dateString, // For testing only
        computeTime: computeTime // For testing only
    }
});