export class Row {
    constructor(header: string, label: string, headerName: string) {
        this.header = header;
        this.label = label;
        this.headerName = headerName;
        this.url = "";
        this.valueInternal = "";
    }

    [index: string]: unknown;
    protected valueInternal: string;
    header: string;
    label: string;
    headerName: string;
    url: string;
    onGetUrl?: (headerName: string, value: string) => string;

    public set value(value: string) { this.valueInternal = value; }
    get value(): string { return this.valueInternal; }
    get valueUrl(): string { return this.onGetUrl ? this.onGetUrl(this.headerName, this.valueInternal) : ""; }
    get id(): string { return this.header + "_id"; }

    toString(): string { return this.label + ": " + this.value; }
}
