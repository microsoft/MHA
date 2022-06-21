import { mhaStrings } from "./Strings";
import { mhaDates, date } from "./dates";

export const Received = (function () {
    const receivedRows = [];
    let sortColumn = "hop";
    let sortOrder = 1;

    // Builds array of values for each header in receivedHeaderNames.
    // This algorithm should work regardless of the order of the headers, given:
    //  - The date, if present, is always at the end, separated by a ";".
    // Values not attached to a header will not be reflected in output.
    const parseHeader = function (receivedHeader) {
        const ReceivedField = function (_label: string, _value?) {
            return {
                label: _label,
                value: _value !== undefined ? _value : "",
                toString: function () { return this.value; }
            };
        };

        const receivedFields = {};
        receivedFields["sourceHeader"] = ReceivedField("", receivedHeader);
        receivedFields["hop"] = ReceivedField(mhaStrings.mhaReceivedHop);
        receivedFields["from"] = ReceivedField(mhaStrings.mhaReceivedFrom);
        receivedFields["by"] = ReceivedField(mhaStrings.mhaReceivedBy);
        receivedFields["with"] = ReceivedField(mhaStrings.mhaReceivedWith);
        receivedFields["id"] = ReceivedField(mhaStrings.mhaReceivedId);
        receivedFields["for"] = ReceivedField(mhaStrings.mhaReceivedFor);
        receivedFields["via"] = ReceivedField(mhaStrings.mhaReceivedVia);
        receivedFields["date"] = ReceivedField(mhaStrings.mhaReceivedDate);
        receivedFields["delay"] = ReceivedField(mhaStrings.mhaReceivedDelay);
        receivedFields["percent"] = ReceivedField(mhaStrings.mhaReceivedPercent, 0);
        receivedFields["delaySort"] = ReceivedField("", -1);
        receivedFields["dateNum"] = ReceivedField("");
        receivedFields.toString = function () {
            const str = [];
            for (const fieldName in receivedFields) {
                if (receivedFields[fieldName].label && receivedFields[fieldName].toString()) {
                    str.push(receivedFields[fieldName].label + ": " + receivedFields[fieldName].toString());
                }
            }

            return str.join("\n");
        }

        const setField = function (fieldName, fieldValue) {
            if (!fieldName || !fieldValue || !receivedFields[fieldName.toLowerCase()]) {
                return false;
            }

            if (receivedFields[fieldName.toLowerCase()].value) { receivedFields[fieldName.toLowerCase()].value += "; " + fieldValue; }
            else { receivedFields[fieldName.toLowerCase()].value = fieldValue; }

            return false;
        }

        if (receivedHeader) {
            // Strip linefeeds first
            receivedHeader = receivedHeader.replace(/\r|\n|\r\n/g, ' ')

            // Build array of header locations
            const headerMatches = [];

            // Some bad dates don't wrap UTC in paren - fix that first
            receivedHeader = receivedHeader.replace(/UTC|\(UTC\)/gi, "(UTC)");

            // Read out the date first, then clear it from the string
            let iDate = receivedHeader.lastIndexOf(";");

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
                const dateField = receivedHeader.substring(iDate + 1);
                receivedHeader = receivedHeader.substring(0, iDate);
                const parsedDate: date = mhaDates.parseDate(dateField);

                if (parsedDate) {
                    receivedFields["date"].value = parsedDate.date;
                    receivedFields["dateNum"].value = parsedDate.dateNum;
                }
            }

            // Scan for malformed postFix headers
            // Received: by example.com (Postfix, from userid 1001)
            //   id 1234ABCD; Thu, 21 Aug 2014 12:12:48 +0200 (CEST)
            const postFix = receivedHeader.match(/(.*)by (.*? \(Postfix, from userid .*?\))(.*)/mi);
            if (postFix) {
                setField("by", postFix[2]);
                receivedHeader = postFix[1] + postFix[3];
            }

            // Scan for malformed qmail headers
            // Received: (qmail 10876 invoked from network); 24 Aug 2014 16:13:38 -0000
            const qmail = receivedHeader.match(/(.*)\((qmail .*? invoked from .*?)\)(.*)/mi);
            if (qmail) {
                setField("by", qmail[2]);
                receivedHeader = qmail[1] + qmail[3];
            }

            // Split up the string now so we can look for our headers
            const tokens = receivedHeader.split(/\s+/);

            let fieldName;
            for (fieldName in receivedFields) {
                tokens.some(function (token, iToken) {
                    if (fieldName.toLowerCase() === token.toLowerCase()) {
                        headerMatches.push({ fieldName: fieldName, iToken: iToken });
                        // We don't return true so we can match any duplicate headers
                        // In doing this, we risk failing to parse a string where a header
                        // keyword appears as the value for another header
                        // Both situations are invalid input
                        // We're just picking which one we'd prefer to handle
                    }
                });
            }

            // Next bit assumes headerMatches[fieldName,iToken] is increasing on iToken.
            // Sort it so it is.
            headerMatches.sort(function (a, b) { return a.iToken - b.iToken; });

            headerMatches.forEach(function (headerMatch, iMatch) {
                let iNextTokenHeader;
                if (iMatch + 1 < headerMatches.length) {
                    iNextTokenHeader = headerMatches[iMatch + 1].iToken;
                } else {
                    iNextTokenHeader = tokens.length;
                }

                setField(headerMatch.fieldName, tokens.slice(headerMatch.iToken + 1, iNextTokenHeader).join(" ").trim())
            });
        }

        return receivedFields;
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

        receivedRows.sort((a, b) => {
            return this.sortOrder * (a[col] < b[col] ? -1 : 1);
        });
    }

    function add(receivedHeader) { receivedRows.push(parseHeader(receivedHeader)); }

    // Computes min/sec from the diff of current and last.
    // Returns nothing if last or current is NaN.
    function computeTime(current, last) {
        const time = [];

        if (isNaN(current) || isNaN(last)) { return ""; }
        let diff = current - last;
        let iDelay;
        let printedMinutes = false;

        if (Math.abs(diff) < 1000) {
            return "0 " + mhaStrings.mhaSeconds;
        }

        if (diff < 0) {
            time.push(mhaStrings.mhaNegative);
            diff = -diff;
        }

        if (diff >= 1000 * 60) {
            iDelay = Math.floor(diff / 1000 / 60);
            time.push(iDelay, " ");
            if (iDelay === 1) {
                time.push(mhaStrings.mhaMinute);
            } else {
                time.push(mhaStrings.mhaMinutes);
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
                time.push(mhaStrings.mhaSecond);
            } else {
                time.push(mhaStrings.mhaSeconds);
            }
        }

        return time.join("");
    }

    function computeDeltas() {
        // Process received headers in reverse order
        receivedRows.reverse();

        // Parse rows and compute values needed for the "Delay" column
        let iStartTime = 0;
        let iEndTime = 0;
        let iLastTime = NaN;
        let iDelta = 0; // This will be the sum of our positive deltas

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
            row.hop.value = index + 1;
            row.delay.value = computeTime(row.dateNum, iLastTime);

            if (!isNaN(row.dateNum) && !isNaN(iLastTime) && iDelta !== 0) {
                row.delaySort.value = row.dateNum.value - iLastTime;

                // Only positive delays will get percentage bars. Negative delays will be color coded at render time.
                if (row.delaySort.value > 0) {
                    row.percent.value = 100 * row.delaySort.value / iDelta;
                }
            }

            if (!isNaN(row.dateNum)) {
                iLastTime = row.dateNum.value;
            }
        });

        // Total time is still last minus first, even if negative.
        return iEndTime !== iStartTime ? computeTime(iEndTime, iStartTime) : "";
    }

    return {
        tableName: "receivedHeaders",
        add: add,
        exists: exists,
        doSort: doSort,
        computeDeltas: computeDeltas,
        get receivedRows() { return receivedRows; },
        get sortColumn() { return sortColumn; },
        get sortOrder() { return sortOrder; },
        parseHeader: parseHeader, // For testing only
        computeTime: computeTime, // For testing only
        toString: function () {
            if (!exists()) return "";
            const ret = ["Received"];
            const rows = [];
            receivedRows.forEach(function (row) {
                rows.push(row);
            });
            if (rows.length) ret.push(rows.join("\n\n"));
            return ret.join("\n");
        }
    };
});