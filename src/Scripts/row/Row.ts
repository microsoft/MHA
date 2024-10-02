export class Row {
    constructor(header: string, label: string, headerName: string) {
        this.header = header;
        this.label = label;
        this.headerName = headerName;
        this.url = "";
        this._value = "";
    }

    [index: string]: unknown;
    protected _value: string;
    header: string;
    label: string;
    headerName: string;
    url: string;
    onGetUrl?: (headerName: string, value: string) => string;

    public set value(value: string) { this._value = value; }
    get value(): string { return this._value; }
    get valueUrl(): string { return this.onGetUrl ? this.onGetUrl(this.headerName, this._value) : ""; }
    get id(): string { return this.header + "_id"; }

    toString(): string { return this.label + ": " + this.value; }
}
