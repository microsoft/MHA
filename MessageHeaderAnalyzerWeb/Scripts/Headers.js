/// <reference path="Table.js" />
/// <reference path="Strings.js" />
/// <reference path="2047.js" />

// View model for our headers tables
var viewModel = null;

var HeaderModel = function () {
    this.summary = new Summary();
    this.antiSpamReport = new AntiSpamReport();
};

HeaderModel.prototype.summary = {};
HeaderModel.prototype.antiSpamReport = {};
HeaderModel.prototype.receivedHeaders = [];
HeaderModel.prototype.otherHeaders = [];
HeaderModel.prototype._status = "";
HeaderModel.prototype.originalHeaders = "";

HeaderModel.prototype.resetView = function () {
    this._status = "";
    this.originalHeaders = "";

    this.receivedHeaders = [];
    this.otherHeaders = [];

    this.summary.reset();
    this.antiSpamReport.reset();
};

HeaderModel.prototype.resetSort = function () {
    setArrows("receivedHeaders", "hop", 1);
    setArrows("otherHeaders", "number", 1);
};

HeaderModel.prototype.doSort = function (table, col) {
    var colName = $("#" + table).attr("data-colName");
    var sortOrder = $("#" + table).attr("data-sortOrder");
    if (colName === col) {
        sortOrder *= -1;
    } else {
        colName = col;
        sortOrder = 1;
    }

    setArrows(table, colName, sortOrder);

    if (viewModel[table].length && col + "Sort" in viewModel[table][0]) {
        col = col + "Sort";
    }

    viewModel[table].sort(function (a, b) {
        return sortOrder * (a[col] < b[col] ? -1 : 1);
    });

    rebuildSections();
};

function parseHeadersToHeaderList(headers) {
    var lines = headers.match(/^.*([\n\r]+|$)/gm);

    var headerList = [];
    var iNextHeader = 0;
    for (var iLine = 0 ; iLine < lines.length ; iLine++) {
        updateStatus(lines[iLine]);
        // Recognizing a header:
        // - First colon comes before first white space.
        // - We're not strictly honoring white space folding because initial white space.
        // - is commonly lost. Instead, we heuristically assume that space before colon must have been folded.
        // This expression will give us:
        // match[1] - everything before the first colon, assuming no spaces (header).
        // match[2] - everything after the first colon (value).
        var match = lines[iLine].match(/(^[\w-\.]*?): ?(.*)/);

        // There's one false positive we might get: if the time in a Received header has been
        // folded to the next line, the line might start with something like "16:20:05 -0400".
        // This matches our regular expression. The RFC does not preclude such a header, but I've
        // never seen one in practice, so we check for and exclude 'headers' that
        // consist only of 1 or 2 digits.
        if (match && match[1] && !match[1].match(/^\d{1,2}$/)) {
            headerList[iNextHeader] = { header: match[1], value: match[2] };
            iNextHeader++;
        } else {
            if (iNextHeader > 0) {
                // Tack this line to the previous line
                headerList[iNextHeader - 1].value += " " + lines[iLine];
            } else {
                // If we didn't have a previous line, go ahead and use this line
                if (lines[iLine].match(/\S/g)) {
                    headerList[iNextHeader] = { header: "", value: lines[iLine] };
                    iNextHeader++;
                }
            }
        }
    }

    return headerList;
}

var space = " ";

var receivedHeaderNames = ["from", "by", "with", "id", "for", "via"];
// Returns array of values for each header in receivedHeaderNames.
// This algorithm should work regardless of the order of the headers, given:
//  - The date, if present, is always at the end, separated by a ";".
// Values not attached to a header will not be reflected in output.
function parseReceivedHeader(receivedHeader) {
    // Build array of header locations
    var headerMatches = [];
    var parsedHeader = {};

    // Read out the date first, then clear it from the string
    var iDate = receivedHeader.lastIndexOf(";");
    if (iDate !== -1) {
        parsedHeader.date = receivedHeader.substring(iDate + 1);
        receivedHeader = receivedHeader.substring(0, iDate);
    }

    // Split up the string now so we can look for our headers
    var tokens = receivedHeader.split(/\s+/);

    var iMatch = 0;
    var iHeader;
    var iToken;

    for (iHeader = 0 ; iHeader < receivedHeaderNames.length; iHeader++) {
        parsedHeader[receivedHeaderNames[iHeader]] = "";
        for (iToken = 0 ; iToken < tokens.length; iToken++) {
            if (receivedHeaderNames[iHeader] === tokens[iToken]) {
                headerMatches[iMatch++] = [iHeader, iToken];
            }
        }
    }

    // Next bit assumes headerMatches[x,y] is increasing on y.
    // Sort it so it is.
    headerMatches.sort(function (a, b) {
        return a[1] - b[1];
    });

    for (iMatch = 0 ; iMatch < headerMatches.length; iMatch++) {
        iHeader = headerMatches[iMatch][0];
        var iTokenHeader = headerMatches[iMatch][1];
        var iFirstVal = iTokenHeader + 1;

        var iNextTokenHeader;
        var iLastVal;
        if (iMatch + 1 < headerMatches.length) {
            iNextTokenHeader = headerMatches[iMatch + 1][1];
        } else {
            iNextTokenHeader = tokens.length;
        }
        iLastVal = iNextTokenHeader - 1;

        var headerName = receivedHeaderNames[iHeader];
        if (parsedHeader[headerName] !== "") { parsedHeader[headerName] += "; "; }
        for (iToken = iFirstVal ; iToken <= iLastVal ; iToken++) {
            parsedHeader[headerName] += tokens[iToken];
            if (iToken < iLastVal) { parsedHeader[headerName] += " "; }
        }
    }

    return parsedHeader;
}

// Computes min/sec from the diff of current and last.
// Returns nothing if last or current is NaN.
function computeTime(current, last) {
    var time = [];

    if (isNaN(current) || isNaN(last)) { return time; }
    var diff = current - last;
    var iDelay;
    var printedMinutes = false;

    if (diff < 0) {
        time.push(ImportedStrings.mha_negative);
        diff = -diff;
    }

    if (diff >= 1000 * 60) {
        iDelay = Math.floor(diff / 1000 / 60);
        time.push(iDelay, space);
        if (iDelay === 1) {
            time.push(ImportedStrings.mha_minute);
        } else {
            time.push(ImportedStrings.mha_minutes);
        }

        diff -= iDelay * 1000 * 60;
        printedMinutes = true;
    }

    if (printedMinutes && diff) {
        time.push(space);
    }

    if (!printedMinutes || diff) {
        iDelay = Math.floor(diff / 1000);
        time.push(iDelay, space);
        if (iDelay === 1) {
            time.push(ImportedStrings.mha_second);
        } else {
            time.push(ImportedStrings.mha_seconds);
        }
    }
    return time.join("");
}

function initViewModels() {
    viewModel = new HeaderModel();
    makeResizableTable("receivedHeaders", ImportedStrings.mha_receivedHeaders, function () { return viewModel.receivedHeaders.length; });
    makeResizableTable("otherHeaders", ImportedStrings.mha_otherHeaders, function () { return viewModel.otherHeaders.length; });
    makeResizablePane("originalHeaders", ImportedStrings.mha_originalHeaders, function () { return viewModel.originalHeaders.length; });

    makeSortableColumn("receivedHeaders", "hop");
    makeSortableColumn("receivedHeaders", "from");
    makeSortableColumn("receivedHeaders", "by");
    makeSortableColumn("receivedHeaders", "_with");
    makeSortableColumn("receivedHeaders", "id");
    makeSortableColumn("receivedHeaders", "_for");
    makeSortableColumn("receivedHeaders", "via");
    makeSortableColumn("receivedHeaders", "date");
    makeSortableColumn("receivedHeaders", "delay");
    $("#receivedHeaders .collapsibleArrow").bind("click", function (event) {
        toggleExtraColumns(event.currentTarget);
        event.stopPropagation();
    });

    makeSortableColumn("otherHeaders", "number");
    makeSortableColumn("otherHeaders", "header");
    makeSortableColumn("otherHeaders", "value");
    rebuildSections();
}

function parseHeadersToTables(headerList) {
    updateStatus(ImportedStrings.mha_parsingHeaders);

    if (headerList.length > 0) {
        viewModel.hasData = true;
    }

    var received = [];
    var iOther = 1;
    for (var i = 0; i < headerList.length; i++) {
        updateStatus(ImportedStrings.mha_processingHeader + space + i);
        headerList[i].value = clean2047Encoding(headerList[i].value);

        // Grab values for our summary pane
        viewModel.summary.init(headerList[i]);

        // Properties with special parsing
        switch (headerList[i].header) {
            case "X-Forefront-Antispam-Report":
                viewModel.antiSpamReport.init(headerList[i].value);
                break;
        }

        if (headerList[i].header === "Received") {
            received.push(headerList[i].value);
        } else if (headerList[i].header || headerList[i].value) {
            viewModel.otherHeaders.push(
            {
                number: iOther++,
                header: headerList[i].header,
                url: mapHeaderToURL(headerList[i].header),
                value: headerList[i].value
            });
        }
    }

    // Process received headers in reverse order
    received.reverse();

    // Preparse headers and compute values needed for the "Delay" column
    var iStartTime = 0;
    var iEndTime = 0;
    var iLastTime = NaN;
    var iDelta = 0; // This will be the sum of our positive deltas
    var headerValsArray = [];
    for (i = 0 ; i < received.length ; i++) {
        updateStatus(ImportedStrings.mha_processingReceivedHeader + space + i);
        headerValsArray[i] = parseReceivedHeader(received[i]);
        headerValsArray[i].dateNum = Date.parse(headerValsArray[i].date);
        if (!isNaN(headerValsArray[i].dateNum)) {
            if (!isNaN(iLastTime) && iLastTime < headerValsArray[i].dateNum) {
                iDelta += headerValsArray[i].dateNum - iLastTime;
            }

            iStartTime = iStartTime || headerValsArray[i].dateNum;
            iEndTime = headerValsArray[i].dateNum;
            iLastTime = headerValsArray[i].dateNum;
        }
    }

    iLastTime = NaN;
    // Total time is still last minus first, even if negative.
    if (iEndTime !== iStartTime) {
        viewModel.summary.totalTime = computeTime(iEndTime, iStartTime);
    }

    for (i = 0 ; i < received.length ; i++) {
        var row = {};
        var headerVals = headerValsArray[i];

        row.hop = i + 1;
        row.from = headerVals.from;
        row.by = headerVals.by;
        row._with = headerVals["with"];
        row.id = headerVals.id;
        row._for = headerVals["for"];
        row.via = headerVals.via;
        row.date = new Date(headerVals.date).toLocaleString();
        row.dateSort = headerVals.dateNum;
        row.delay = computeTime(headerVals.dateNum, iLastTime);
        row.delaySort = -1; // Force the "no previous or current time" rows to sort before the 0 second rows
        row.percent = 0;

        if (!isNaN(headerVals.dateNum) && !isNaN(iLastTime) && iDelta !== 0) {
            row.delaySort = headerVals.dateNum - iLastTime;

            // Only positive delays will get percentage bars. Negative delays will be color coded at render time.
            if (row.delaySort > 0) {
                row.percent = 100 * row.delaySort / iDelta;
            }
        }

        if (!isNaN(headerVals.dateNum)) {
            iLastTime = headerVals.dateNum;
        }

        viewModel.receivedHeaders.push(row);
    }

    hideStatus();
    viewModel.resetSort();
    rebuildSections();
    hideExtraColumns();
    recalcLayout(true);
}

function mapHeaderToURL(header, text) {
    for (var i = 0 ; i < HeaderToURLMap.length ; i++) {
        if (header.toLowerCase() === HeaderToURLMap[i][0].toLowerCase()) {
            return ["<a href = '", HeaderToURLMap[i][1], "' target = '_blank'>", text || header, "</a>"].join("");
        }
    }

    return null;
}

/// <disable>JS2073.CommentIsMisspelled</disable>
var HeaderToURLMap = [
["Accept-Language", "http://go.microsoft.com/?linkid=9837880"], // "http://tools.ietf.org/html/rfc3282"
["BCC", "http://go.microsoft.com/?linkid=9837885"], // "http://tools.ietf.org/html/rfc5322#section-3.6.3"
["CC", "http://go.microsoft.com/?linkid=9837885"], // "http://tools.ietf.org/html/rfc5322#section-3.6.3"
["Content-Description", "http://go.microsoft.com/?linkid=9837876"], // "http://tools.ietf.org/html/rfc2045#section-8"
["Content-Disposition", "http://go.microsoft.com/?linkid=9837878"], // "http://tools.ietf.org/html/rfc2183"
["Content-Id", "http://go.microsoft.com/?linkid=9837875"], // "http://tools.ietf.org/html/rfc2045#section-7"
["Content-Language", "http://go.microsoft.com/?linkid=9837880"], // "http://tools.ietf.org/html/rfc3282"
["Content-Transfer-Encoding", "http://go.microsoft.com/?linkid=9837874"], // "http://tools.ietf.org/html/rfc2045#section-6"
["Content-Type", "http://go.microsoft.com/?linkid=9837873"], // "http://tools.ietf.org/html/rfc2045#section-5"
["Date", "http://go.microsoft.com/?linkid=9837883"], // "http://tools.ietf.org/html/rfc5322#section-3.6.1"
["From", "http://go.microsoft.com/?linkid=9837884"], // "http://tools.ietf.org/html/rfc5322#section-3.6.2"
["In-Reply-To", "http://go.microsoft.com/?linkid=9837886"], // "http://tools.ietf.org/html/rfc5322#section-3.6.4"
["Importance", "http://go.microsoft.com/?linkid=9837877"], // "http://tools.ietf.org/html/rfc2156#section-5.3"
["X-Priority", "http://go.microsoft.com/?linkid=9837868"], // "http://technet.microsoft.com/en-us/library/bb691107(v=exchg.150)"
["List-Help", "http://go.microsoft.com/?linkid=9837879"], // "http://tools.ietf.org/html/rfc2369"
["List-Subscribe", "http://go.microsoft.com/?linkid=9837879"], // "http://tools.ietf.org/html/rfc2369"
["List-Unsubscribe", "http://go.microsoft.com/?linkid=9837879"], // "http://tools.ietf.org/html/rfc2369"
["Message-ID", "http://go.microsoft.com/?linkid=9837886"], // "http://tools.ietf.org/html/rfc5322#section-3.6.4"
["MIME-Version", "http://go.microsoft.com/?linkid=9837872"], // "http://tools.ietf.org/html/rfc2045#section-4"
["Received", "http://go.microsoft.com/?linkid=9837882"], // "http://tools.ietf.org/html/rfc5321#section-4.4"
["Received-SPF", "http://go.microsoft.com/?linkid=9837881"], // "http://tools.ietf.org/html/rfc4408#section-7"
["References", "http://go.microsoft.com/?linkid=9837886"], // "http://tools.ietf.org/html/rfc5322#section-3.6.4"
["Reply-To", "http://go.microsoft.com/?linkid=9837884"], // "http://tools.ietf.org/html/rfc5322#section-3.6.2"
["Return-Path", "http://go.microsoft.com/?linkid=9837888"], // "http://tools.ietf.org/html/rfc5322#section-3.6.7"
["Sender", "http://go.microsoft.com/?linkid=9837884"], // "http://tools.ietf.org/html/rfc5322#section-3.6.2"
["Subject", "http://go.microsoft.com/?linkid=9837887"],  // "http://tools.ietf.org/html/rfc5322#section-3.6.5"
["Thread-Index", "http://go.microsoft.com/?linkid=9837865"], // "http://msdn.microsoft.com/en-us/library/ms526219.aspx"
["Thread-Topic", "http://go.microsoft.com/?linkid=9837866"], // "http://msdn.microsoft.com/en-us/library/ms526986.aspx"
["To", "http://go.microsoft.com/?linkid=9837885"], // "http://tools.ietf.org/html/rfc5322#section-3.6.3"
["X-MS-Exchange-Organization-AutoForwarded", "http://msdn.microsoft.com/en-us/library/ee178180.aspx"],
["X-Auto-Response-Suppress", "http://go.microsoft.com/?linkid=9837863"], // "http://msdn.microsoft.com/en-us/library/ee219609.aspx
["X-Forefront-Antispam-Report", "http://go.microsoft.com/?linkid=9837870"], // "http://technet.microsoft.com/en-us/library/dn205071.aspx"
["X-Forefront-Antispam-Report-Untrusted", "http://technet.microsoft.com/en-us/library/bb232136.aspx"],
["X-Forefront-Prvs", "http://go.microsoft.com/?linkid=9837869"], // "http://technet.microsoft.com/en-us/library/dd639361.aspx"
["X-Message-Flag", "http://go.microsoft.com/?linkid=9837864"], // "http://msdn.microsoft.com/en-us/library/exchange/ms875195.aspx"
["X-MS-Exchange-Organization-AuthAs", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-AuthMechanism", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-AuthSource", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-AVStamp-Enterprise", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-AVStamp-Mailbox", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-Network-Message-Id", "http://technet.microsoft.com/en-us/library/bb232136.aspx"],
["X-MS-Exchange-Organization-SCL", "http://go.microsoft.com/?linkid=9837871"], // "http://technet.microsoft.com/en-us/library/jj200686.aspx"
["X-MS-Has-Attach", "http://go.microsoft.com/?linkid=9837861"], // "http://msdn.microsoft.com/en-us/library/ee178420.aspx"
["X-MS-TNEF-Correlator", "http://go.microsoft.com/?linkid=9837862"], // "http://msdn.microsoft.com/en-us/library/ee219198.aspx"
["X-Originating-IP", "http://go.microsoft.com/?linkid=9837859"] // "http://en.wikipedia.org/wiki/X-Originating-IP"
];
/// <enable>JS2073.CommentIsMisspelled</enable>
