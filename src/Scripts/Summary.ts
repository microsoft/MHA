import { mhaStrings } from "./Strings";
import { mhaDates, date } from "./dates";

export const Summary = (function () {
    class SummaryRow {
        constructor(header: string, label: string, onSet?: Function, onGet?: Function, onGetUrl?: Function) {
            this._value = "";
            this.header = header;
            this.label = label;
            this.url = mhaStrings.mapHeaderToURL(header, label);
            this.onSet = onSet;
            this.onGet = onGet;
            this.onGetUrl = onGetUrl;
        };

        private _value: string;
        header: string;
        label: string;
        url: string;
        onSet?: Function;
        onGet?: Function;
        onGetUrl?: Function;

        set value(value: string) { this._value = this.onSet ? this.onSet(value) : value; };
        get value(): string { return this.onGet ? this.onGet(this._value) : this._value; };
        get valueUrl(): string { return this.onGetUrl ? this.onGetUrl(this._value) : ""; };
        toString(): string { return this.label + ": " + this.value; };
    };

    let totalTime = "";
    function creationTime(date: string): string {
        if (!date && !totalTime) {
            return null;
        }

        const time = [date || ""];

        if (totalTime) {
            time.push(" ", mhaStrings.mhaDeliveredStart, " ", totalTime, mhaStrings.mhaDeliveredEnd);
        }

        return time.join("");
    }

    const dateRow = new SummaryRow(
        "Date",
        mhaStrings.mhaCreationTime,
        function (value: string): date { return mhaDates.parseDate(value); },
        function (value: string): string { return creationTime(value); });

    const archivedRow = new SummaryRow(
        "Archived-At",
        mhaStrings.mhaArchivedAt,
        null,
        null,
        function (value: string): string { return mhaStrings.mapValueToURL(value); }
    );

    const summaryRows: SummaryRow[] = [
        new SummaryRow("Subject", mhaStrings.mhaSubject),
        new SummaryRow("Message-ID", mhaStrings.mhaMessageId),
        archivedRow,
        dateRow,
        new SummaryRow("From", mhaStrings.mhaFrom),
        new SummaryRow("Reply-To", mhaStrings.mhaReplyTo),
        new SummaryRow("To", mhaStrings.mhaTo),
        new SummaryRow("CC", mhaStrings.mhaCc)
    ];

    function exists(): boolean {
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
        get summaryRows(): SummaryRow[] { return summaryRows; },
        get totalTime(): string { return totalTime; },
        set totalTime(value: string) { totalTime = value; },
        toString: function (): string {
            if (!exists()) return "";
            const ret = ["Summary"];
            summaryRows.forEach(function (row) {
                if (row.value) { ret.push(row.toString()); }
            });
            return ret.join("\n");
        }
    };
});