/* global mhaStrings */
/* global mhaDates */
/* exported Summary */

const Summary = (function () {
    "use strict";

    const SummaryRow = function (header: string, label: string, onSet?: Function, onGet?: Function, onGetUrl?: Function) {
        let value = "";

        return {
            header: header,
            label: label,
            url: mhaStrings.mapHeaderToURL(header, label),
            set value(_value) { value = onSet ? onSet(_value) : _value; },
            get value() { return onGet ? onGet(value) : value; },
            get valueUrl() { return onGetUrl ? onGetUrl(value) : ""; },
            toString: function () { return label + ": " + value; }
        };
    };

    let totalTime = "";
    function creationTime(date) {
        if (!date && !totalTime) {
            return null;
        }

        const time = [date || ""];

        if (totalTime) {
            time.push(" ", mhaStrings.mha_deliveredStart, " ", totalTime, mhaStrings.mha_deliveredEnd);
        }

        return time.join("");
    }

    const dateRow = SummaryRow(
        "Date",
        mhaStrings.mha_creationTime,
        function (value) { return mhaDates.parseDate(value); },
        function (value) { return creationTime(value); });

    const archivedRow = SummaryRow(
        "Archived-At",
        mhaStrings.mha_archivedAt,
        null,
        null,
        function (value) { return mhaStrings.mapValueToURL(value); }
    );

    const summaryRows = [
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
        for (let i = 0; i < summaryRows.length; i++) {
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

        for (let i = 0; i < summaryRows.length; i++) {
            if (summaryRows[i].header.toUpperCase() === header.header.toUpperCase()) {
                summaryRows[i].value = header.value;
                return true;
            }
        }

        return false;
    }

    return {
        add: add,
        exists: exists,
        get summaryRows() { return summaryRows; },
        get totalTime() { return totalTime; },
        set totalTime(value) { totalTime = value; },
        toString: function () {
            if (!exists()) return "";
            const ret = ["Summary"];
            summaryRows.forEach(function (row) {
                if (row.value) { ret.push(row.toString()); }
            });
            return ret.join("\n");
        }
    };
});