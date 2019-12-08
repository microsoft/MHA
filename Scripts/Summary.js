/* global ImportedStrings */
/* exported Summary */

var Summary = (function () {
    var SummaryRow = function (_header, _label, _set, _get) {
        return {
            header: _header,
            label: _label,
            value: "",
            set: _set || function (_value) { this.value = _value; },
            get: _get || function () { return this.value; }
        };
    };

    var totalTime = "";
    var dateRow = SummaryRow(
        "Date",
        ImportedStrings.mha_creationTime,
        function (value) {
            if (value) {
                this.value = new Date(value).toLocaleString();
            } else {
                this.value = "";
            }
        },
        function () { return creationTime(dateRow.value); });

    var summaryRows = [
        SummaryRow("Subject", ImportedStrings.mha_subject),
        SummaryRow("Message-ID", ImportedStrings.mha_messageId),
        dateRow,
        SummaryRow("From", ImportedStrings.mha_from),
        SummaryRow("To", ImportedStrings.mha_to),
        SummaryRow("CC", ImportedStrings.mha_cc)
    ];

    function exists() {
        for (var i = 0; i < this.summaryRows.length; i++) {
            if (this.summaryRows[i].get()) {
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
            time.push(" ", ImportedStrings.mha_deliveredStart, " ", totalTime, ImportedStrings.mha_deliveredEnd);
        }

        return time.join("");
    }

    return {
        init: init,
        exists: exists,
        get summaryRows() { return summaryRows; },
        get totalTime() { return totalTime; },
        set totalTime(value) { totalTime = value; },
    }
});