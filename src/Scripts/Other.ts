import { iTable } from "./itable";
import { strings } from "./Strings";
import { header } from "./Headers";

export class otherRow {
    constructor(number: number, header: string, value: any) {
        this.number = number;
        this.header = header;
        this.value = value;
    }

    [index: string]: any;
    number: number;
    header: string;
    value: any;
    public get url(): string { return strings.mapHeaderToURL(this.header); };
    toString() { return this.header + ": " + this.value; }
}

export class Other extends iTable {
    private _otherRows: otherRow[] = [];
    protected _sortColumn: string = "number";
    protected _sortOrder: number = 1;
    public readonly tableName: string = "otherHeaders";

    public doSort(col: string): void {
        if (this.sortColumn === col) {
            this._sortOrder *= -1;
        } else {
            this._sortColumn = col;
            this._sortOrder = 1;
        }

        if (this.sortColumn + "Sort" in this.rows[0]) {
            col = col + "Sort";
        }

        this.rows.sort((a: otherRow, b: otherRow) => {
            return this.sortOrder * (a[col] < b[col] ? -1 : 1);
        });
    }

    public add(otherHeader: header): void {
        this.rows.push(new otherRow(
            this.rows.length + 1,
            otherHeader.header,
            otherHeader.value));
    }

    public exists() { return this.rows.length > 0; }

    public get rows(): otherRow[] { return this._otherRows; };
    public toString() {
        if (!this.exists()) return "";
        const ret: string[] = ["Other"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.value); }
        });
        return ret.join("\n");
    }
}