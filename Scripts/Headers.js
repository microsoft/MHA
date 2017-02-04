/// <reference path="Table.js" />
/// <reference path="Strings.js" />
/// <reference path="2047.js" />
/// <reference path="~/Scripts/Summary.js" />
/// <reference path="~/Scripts/Received.js" />
/// <reference path="~/Scripts/ForefrontAntispam.js" />
/// <reference path="~/Scripts/Antispam.js" />
/// <reference path="~/Scripts/Other.js" />

// View model for our headers tables
var viewModel = null;

function initViewModels() {
    viewModel = new HeaderModel();
    rebuildSections();
}

var HeaderModel = function () {
    // Initialize defaults
    var that = this;
    this.summary = new Summary();
    this.receivedHeaders = new Received();
    this.forefrontAntiSpamReport = new ForefrontAntiSpamReport();
    this.antiSpamReport = new AntiSpamReport();
    this.otherHeaders = new Other();

    this.status = "";
    this.originalHeaders = "";
    makeResizablePane("originalHeaders", ImportedStrings.mha_originalHeaders, function () { return that.originalHeaders.length; });
    $(".collapsibleElement", $("#originalHeaders").parents(".collapsibleWrapper")).toggle();
};

HeaderModel.prototype.status = "";
HeaderModel.prototype.summary = {};
HeaderModel.prototype.receivedHeaders = {};
HeaderModel.prototype.otherHeaders = {};
HeaderModel.prototype.forefrontAntiSpamReport = {};
HeaderModel.prototype.antiSpamReport = {};
HeaderModel.prototype.originalHeaders = "";
HeaderModel.prototype.hasData = false;

HeaderModel.prototype.resetView = function () {
    this.status = "";

    this.summary.reset();
    this.receivedHeaders.reset();
    this.forefrontAntiSpamReport.reset();
    this.antiSpamReport.reset();
    this.otherHeaders.reset();

    this.originalHeaders = "";

    this.hasData = false;
};

var Header = function (_header, _value) {
    this.header = _header;
    this.value = _value;
};

Header.prototype.header = "";
Header.prototype.value = "";

function parseHeadersToTables(headers) {
    var lines = headers.match(/^.*([\n\r]+|$)/gm);

    var headerList = [];
    var iNextHeader = 0;
    for (var iLine = 0 ; iLine < lines.length ; iLine++) {
        updateStatus(lines[iLine]);
        lines[iLine] = clean2047Encoding(lines[iLine]);

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
            headerList[iNextHeader] = new Header(match[1], match[2]);
            iNextHeader++;
        } else {
            if (iNextHeader > 0) {
                // Tack this line to the previous line
                headerList[iNextHeader - 1].value += " " + lines[iLine];
            } else {
                // If we didn't have a previous line, go ahead and use this line
                if (lines[iLine].match(/\S/g)) {
                    headerList[iNextHeader] = new Header("", lines[iLine]);
                    iNextHeader++;
                }
            }
        }
    }

    updateStatus(ImportedStrings.mha_parsingHeaders);

    if (headerList.length > 0) {
        viewModel.hasData = true;
    }

    for (var i = 0; i < headerList.length; i++) {
        updateStatus(ImportedStrings.mha_processingHeader + " " + i.toString());

        // Grab values for our summary pane
        viewModel.summary.init(headerList[i]);

        // Properties with special parsing
        switch (headerList[i].header) {
            case "X-Forefront-Antispam-Report":
                viewModel.forefrontAntiSpamReport.init(headerList[i].value);
                break;
            case "X-Microsoft-Antispam":
                viewModel.antiSpamReport.init(headerList[i].value);
                break;
        }

        if (headerList[i].header === "Received") {
            viewModel.receivedHeaders.init(headerList[i].value);
        } else if (headerList[i].header || headerList[i].value) {
            viewModel.otherHeaders.init(headerList[i]);
        }
    }

    viewModel.receivedHeaders.computeDeltas();

    hideStatus();
    rebuildSections();
    hideExtraColumns();
    recalculateLayout(true);
}

function mapHeaderToURL(headerName, text) {
    for (var i = 0 ; i < HeaderToURLMap.length ; i++) {
        if (headerName.toLowerCase() === HeaderToURLMap[i][0].toLowerCase()) {
            return ["<a href = '", HeaderToURLMap[i][1], "' target = '_blank'>", text || headerName, "</a>"].join("");
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
["X-Auto-Response-Suppress", "http://go.microsoft.com/?linkid=9837863"], // "http://msdn.microsoft.com/en-us/library/ee219609.aspx
["X-Forefront-Antispam-Report", "http://go.microsoft.com/?linkid=9837870"], // "http://technet.microsoft.com/en-us/library/dn205071.aspx"
["X-Forefront-Antispam-Report-Untrusted", "http://technet.microsoft.com/en-us/library/bb232136.aspx"],
["X-Forefront-Prvs", "http://go.microsoft.com/?linkid=9837869"], // "http://technet.microsoft.com/en-us/library/dd639361.aspx"
["X-Message-Flag", "http://go.microsoft.com/?linkid=9837864"], // "http://msdn.microsoft.com/en-us/library/exchange/ms875195.aspx"
["X-Microsoft-Antispam", "http://go.microsoft.com/?linkid=9837870"], // "http://technet.microsoft.com/en-us/library/dn205071.aspx"
["X-MS-Exchange-Organization-AuthAs", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-AuthMechanism", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-AuthSource", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-AutoForwarded", "http://msdn.microsoft.com/en-us/library/ee178180.aspx"],
["X-MS-Exchange-Organization-AVStamp-Enterprise", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-AVStamp-Mailbox", "http://go.microsoft.com/?linkid=9837867"], // "http://technet.microsoft.com/en-us/library/bb232136.aspx"
["X-MS-Exchange-Organization-Network-Message-Id", "http://technet.microsoft.com/en-us/library/bb232136.aspx"],
["X-MS-Exchange-Organization-SCL", "http://go.microsoft.com/?linkid=9837871"], // "http://technet.microsoft.com/en-us/library/jj200686.aspx"
["X-MS-Has-Attach", "http://go.microsoft.com/?linkid=9837861"], // "http://msdn.microsoft.com/en-us/library/ee178420.aspx"
["X-MS-TNEF-Correlator", "http://go.microsoft.com/?linkid=9837862"], // "http://msdn.microsoft.com/en-us/library/ee219198.aspx"
["X-Originating-IP", "http://go.microsoft.com/?linkid=9837859"], // "http://en.wikipedia.org/wiki/X-Originating-IP"
["X-Priority", "http://go.microsoft.com/?linkid=9837868"] // "http://technet.microsoft.com/en-us/library/bb691107(v=exchg.150)"
];
/// <enable>JS2073.CommentIsMisspelled</enable>
