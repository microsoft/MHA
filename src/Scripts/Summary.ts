import { mhaStrings } from "./mhaStrings";
import { strings } from "./Strings";
import { Header } from "./Headers";

export class Row {
    constructor(header: string, label: string, headerName: string) {
        this.header = header;
        this.label = label;
        this.headerName = headerName;
        this.url = "";
        this._value = "";
    }

    [index: string]: any;
    protected _value: string;
    header: string;
    label: string;
    headerName: string;
    url: string;
    onGetUrl?: Function;

    public set value(value: string) { this._value = value; };
    get value(): string { return this._value; };
    get valueUrl(): string { return this.onGetUrl ? this.onGetUrl(this.headerName, this._value) : ""; };

    toString(): string { return this.label + ": " + this.value; };
};

export class SummaryRow extends Row {
    constructor(header: string, label: string) {
        super(header, label, "");
        this.url = strings.mapHeaderToURL(header, label);
    };
};

export class CreationRow extends SummaryRow {
    constructor(header: string, label: string) {
        super(header, label);
        this.url = strings.mapHeaderToURL(header, label);
        this.postFix = "";
    };
    postFix: string;
    override get value(): string { return this._value + this.postFix; };
    override set value(value: string) { this._value = value; };
};

export class ArchivedRow extends SummaryRow {
    constructor(header: string, label: string) {
        super(header, label);
        this.url = strings.mapHeaderToURL(header, label);
    };
    override get valueUrl(): string { return strings.mapValueToURL(this._value); };
};

export class Summary {
    private _totalTime: string = "";

    private creationPostFix(totalTime: string): string {
        if (!totalTime) {
            return "";
        }

        return ` ${mhaStrings.mhaDeliveredStart} ${totalTime}${mhaStrings.mhaDeliveredEnd}`;
    }

    private dateRow = new CreationRow("Date", mhaStrings.mhaCreationTime);

    private archivedRow = new ArchivedRow("Archived-At", mhaStrings.mhaArchivedAt,);

    private summaryRows: SummaryRow[] = [
        new SummaryRow("Subject", mhaStrings.mhaSubject),
        new SummaryRow("Message-ID", mhaStrings.mhaMessageId),
        this.archivedRow,
        this.dateRow,
        new SummaryRow("From", mhaStrings.mhaFrom),
        new SummaryRow("Reply-To", mhaStrings.mhaReplyTo),
        new SummaryRow("To", mhaStrings.mhaTo),
        new SummaryRow("CC", mhaStrings.mhaCc)
    ];

    public exists(): boolean {
        return this.rows.find((row: Row) => { return row.value; }) !== undefined;
    }

    public add(header: Header) {
        if (!header) {
            return false;
        }

        let row: SummaryRow | undefined = this.rows.find((row: Row) => { return row.header.toUpperCase() === header.header.toUpperCase(); })
        if (row) {
            row.value = header.value;
            return true;
        }

        return false;
    }

    public get rows(): SummaryRow[] { return this.summaryRows; };
    public get totalTime(): string { return this._totalTime; };
    public set totalTime(value: string) {
        this._totalTime = value;
        this.dateRow.postFix = this.creationPostFix(value);
    };

    public toString(): string {
        if (!this.exists()) return "";
        const ret = ["Summary"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}