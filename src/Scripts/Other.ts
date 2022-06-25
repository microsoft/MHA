import { mhaStrings } from "./Strings";
import { header } from "./Headers";

class row {
    constructor(number: number, header: string, value: any) {
        this.number = number;
        this.header = header;
        this.value = value;
    }

    [index: string]: any;
    number: number;
    header: string;
    value: any;
    public get url(): string { return mhaStrings.mapHeaderToURL(this.header, null); };
    toString() { return this.header + ": " + this.value; }
}

export class Other {
    private _otherRows: row[] = [];
    private _sortColumn: string = "number";
    private _sortOrder: number = 1;
    public readonly tableName: string = "otherHeaders";

    public doSort(col: string): void {
        if (this.sortColumn === col) {
            this._sortOrder *= -1;
        } else {
            this._sortColumn = col;
            this._sortOrder = 1;
        }

        if (this.sortColumn + "Sort" in this.otherRows[0]) {
            col = col + "Sort";
        }

        this.otherRows.sort((a: row, b: row) => {
            return this.sortOrder * (a[col] < b[col] ? -1 : 1);
        });
    }

    public add(otherHeader: header): void {
        this.otherRows.push(new row(
            this.otherRows.length + 1,
            otherHeader.header,
            otherHeader.value));
    }

    public exists() { return this.otherRows.length > 0; }

    public get otherRows(): row[] { return this._otherRows; };
    public get sortColumn(): string { return this._sortColumn; };
    public get sortOrder(): number { return this._sortOrder; };
    public toString() {
        if (!this.exists()) return "";
        const ret: string[] = ["Other"];
        this.otherRows.forEach(function (row) {
            if (row.value) { ret.push(row.value); }
        });
        return ret.join("\n");
    }
}