/* global mhaStrings */
/* exported Summary */

var Summary = (function () {
    "use strict";

    var SummaryRow = function (_header, _label, _set, _get) {
        var valueUrl = "";
        return {
            header: _header,
            label: _label,
            value: "",
            valueUrl: valueUrl,
            set: _set || function (_value) { this.value = _value; },
            get: _get || function () { return this.value; }
        };
    };

    var totalTime = "";
    var dateRow = SummaryRow(
        "Date",
        mhaStrings.mha_creationTime,
        function (value) {
            if (value) {
                this.value = new Date(value).toLocaleString();
            } else {
                this.value = "";
            }
        },
        function () { return creationTime(dateRow.value); });

    var archivedRow = SummaryRow(
        "Archived-At",
        mhaStrings.mha_archivedAt,
        function (value) {
            if (value) {
                this.valueUrl = mhaStrings.mapValueToURL(value);
                this.value = value;
            } else {
                this.rawUrl = "";
                this.value = "";
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
            if (summaryRows[i].get()) {
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
            if (summaryRows[i].header === header.header) {
                summaryRows[i].set(header.value);
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
    };
});