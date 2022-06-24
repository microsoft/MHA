import { mhaStrings } from "./Strings";
import { mhaDates, date } from "./dates";

class SummaryRow {
    constructor(summary: Summary, header: string, label: string, onSet?: Function, onGet?: Function, onGetUrl?: Function) {
        this._value = "";
        this.summary = summary; // TODO: eliminate this
        this.header = header;
        this.label = label;
        this.url = mhaStrings.mapHeaderToURL(header, label);
        this.onSet = onSet;
        this.onGet = onGet;
        this.onGetUrl = onGetUrl;
    };

    private _value: string;
    summary: Summary;
    header: string;
    label: string;
    url: string;
    onSet?: Function;
    onGet?: Function;
    onGetUrl?: Function;

    set value(value: string) { this._value = this.onSet ? this.onSet(value) : value; };
    get value(): string { return this.onGet ? this.onGet(this.summary, this._value) : this._value; };
    get valueUrl(): string { return this.onGetUrl ? this.onGetUrl(this._value) : ""; };
    toString(): string { return this.label + ": " + this.value; };
};

export class Summary {
    private _totalTime: string = "";

    public creationTime(date: string): string {
        if (!date && !this.totalTime) {
            return null;
        }

        const time = [date || ""];

        if (this.totalTime) {
            time.push(" ", mhaStrings.mhaDeliveredStart, " ", this.totalTime, mhaStrings.mhaDeliveredEnd);
        }

        return time.join("");
    }

    private dateRow = new SummaryRow(
        this,
        "Date",
        mhaStrings.mhaCreationTime,
        function (value: string): date { return mhaDates.parseDate(value); },
        function (summary: Summary, value: string): string { return summary.creationTime(value); });

    private archivedRow = new SummaryRow(
        this,
        "Archived-At",
        mhaStrings.mhaArchivedAt,
        null,
        null,
        function (value: string): string { return mhaStrings.mapValueToURL(value); }
    );

    private summaryRows: SummaryRow[] = [
        new SummaryRow(this, "Subject", mhaStrings.mhaSubject),
        new SummaryRow(this, "Message-ID", mhaStrings.mhaMessageId),
        this.archivedRow,
        this.dateRow,
        new SummaryRow(this, "From", mhaStrings.mhaFrom),
        new SummaryRow(this, "Reply-To", mhaStrings.mhaReplyTo),
        new SummaryRow(this, "To", mhaStrings.mhaTo),
        new SummaryRow(this, "CC", mhaStrings.mhaCc)
    ];

    public exists(): boolean {
        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].value) {
                return true;
            }
        }

        return false;
    }

    public add(header) {
        if (!header) {
            return false;
        }

        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].header.toUpperCase() === header.header.toUpperCase()) {
                this.rows[i].value = header.value;
                return true;
            }
        }

        return false;
    }

    public get rows(): SummaryRow[] { return this.summaryRows; };
    public get totalTime(): string { return this._totalTime; };
    public set totalTime(value: string) { this._totalTime = value; };
    public toString(): string {
        if (!this.exists()) return "";
        const ret = ["Summary"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}