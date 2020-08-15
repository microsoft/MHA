/* global mhaStrings */
/* global mhaDates */
/* exported Summary */

var Summary = (function () {
    var SummaryRow = function (header, label, onSet, onGet, onGetUrl) {
        var value = "";

        return {
            header: header,
            label: label,
            url: mhaStrings.mapHeaderToURL(header, label),
            set value(_value) { value = onSet ? onSet(_value) : _value; },
            get value() { return onGet ? onGet(value) : value; },
            get valueUrl() { return onGetUrl ? onGetUrl(value) : ""; },
        };
    };

    var totalTime = "";
    var dateRow = SummaryRow(
        "Date",
        mhaStrings.mha_creationTime,
        function (value) { return mhaDates.parseDate(value); },
        function (value) { return creationTime(value); });

    var archivedRow = SummaryRow(
        "Archived-At",
        mhaStrings.mha_archivedAt,
        null,
        null,
        function (value) { return mhaStrings.mapValueToURL(value); }
    );

    var summaryRows = [
        SummaryRow("Subject", mhaStrings.mha_subject),
        SummaryRow("Message-ID", mhaStrings.mha_messageId),
        archivedRow,
        dateRow,
        SummaryRow("From", mhaStrings.mha_from),
        SummaryRow("Reply-To", mhaStrings.mha_replyTo),
        SummaryRow("To", mhaStrings.mha_to),
        SummaryRow("CC", mhaStrings.mha_cc)
    ];

    function exists() {
        for (var i = 0; i < summaryRows.length; i++) {
            if (summaryRows[i].value) {
                return true;
            }
        }

        return false;
    }

    function add(header) {
        if (!header) {
            return false;
        }

        for (var i = 0; i < summaryRows.length; i++) {
            if (summaryRows[i].header.toUpperCase() === header.header.toUpperCase()) {
                summaryRows[i].value = header.value;
                return true;
            }
        }

        return false;
    }

    function creationTime(date) {
        if (!date && !totalTime) {
            return null;
        }

        var time = [date || ""];

        if (totalTime) {
            time.push(" ", mhaStrings.mha_deliveredStart, " ", totalTime, mhaStrings.mha_deliveredEnd);
        }

        return time.join("");
    }

    return {
        add: add,
        exists: exists,
        get summaryRows() { return summaryRows; },
        get totalTime() { return totalTime; },
        set totalTime(value) { totalTime = value; }
    }
});