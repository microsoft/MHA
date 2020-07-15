/* global mhaStrings */
/* exported Summary */

var Summary = (function () {
    var SummaryRow = function (header, label, onSet, onGet) {
        var value = "";
        function get() { return onGet ? onGet(value) : value; }
        function set(_value) { value = onSet ? onSet(_value) : _value; }

        return {
            header: header,
            label: label,
            set value(_value) { return set(_value); },
            get value() { return get(); },
            valueUrl: "",
        };
    };

    var totalTime = "";
    var dateRow = SummaryRow(
        "Date",
        mhaStrings.mha_creationTime,
        function (value) {
            if (value) {
                return new Date(value).toLocaleString();
            } else {
                return "";
            }
        },
        function (value) { return creationTime(value); });

    var archivedRow = SummaryRow(
        "Archived-At",
        mhaStrings.mha_archivedAt,
        function (value) {
            if (value) {
                this.valueUrl = mhaStrings.mapValueToURL(value);
                return value;
            } else {
                this.valueUrl = "";
                return "";
            }
        });

    var summaryRows = [
        SummaryRow("Subject", mhaStrings.mha_subject),
        SummaryRow("Message-ID", mhaStrings.mha_messageId),
        archivedRow,
        dateRow,
        SummaryRow("From", mhaStrings.mha_from),
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

    function init(header) {
        if (!header) {
            return;
        }

        for (var i = 0; i < summaryRows.length; i++) {
            if (summaryRows[i].header.toUpperCase() === header.header.toUpperCase()) {
                summaryRows[i].value = header.value;
                return;
            }
        }
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
        init: init,
        exists: exists,
        get summaryRows() { return summaryRows; },
        get totalTime() { return totalTime; },
        set totalTime(value) { totalTime = value; }
    }
});