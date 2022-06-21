import { mhaStrings } from "./Strings";
import { mhaDates } from "./dates";

export const Summary = (function () {
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
            time.push(" ", mhaStrings.mhaDeliveredStart, " ", totalTime, mhaStrings.mhaDeliveredEnd);
        }

        return time.join("");
    }

    const dateRow = SummaryRow(
        "Date",
        mhaStrings.mhaCreationTime,
        function (value) { return mhaDates.parseDate(value); },
        function (value) { return creationTime(value); });

    const archivedRow = SummaryRow(
        "Archived-At",
        mhaStrings.mhaArchivedAt,
        null,
        null,
        function (value) { return mhaStrings.mapValueToURL(value); }
    );

    const summaryRows = [
        SummaryRow("Subject", mhaStrings.mhaSubject),
        SummaryRow("Message-ID", mhaStrings.mhaMessageId),
        archivedRow,
        dateRow,
        SummaryRow("From", mhaStrings.mhaFrom),
        SummaryRow("Reply-To", mhaStrings.mhaReplyTo),
        SummaryRow("To", mhaStrings.mhaTo),
        SummaryRow("CC", mhaStrings.mhaCc)
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