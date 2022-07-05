import { iTable } from "./itable";
import { strings } from "./Strings";
import { Header } from "./Headers";
import { Row } from "./Summary";

export class OtherRow extends Row {
    constructor(number: number, header: string, value: any) {
        super(header, "", "");
        this.number = number;
        this.value = value;
        this.url = strings.mapHeaderToURL(header);
    }

    [index: string]: any;
    number: number;
    override toString() { return this.header + ": " + this.value; }
}

export class Other extends iTable {
    private _otherRows: OtherRow[] = [];
    protected _sortColumn: string = "number";
    protected _sortOrder: number = 1;
    public readonly tableName: string = "otherHeaders";

    public doSort(col: string): void {
        if (this._sortColumn === col) {
            this._sortOrder *= -1;
        } else {
            this._sortColumn = col;
            this._sortOrder = 1;
        }

        if (this.rows[0] && this._sortColumn + "Sort" in this.rows[0]) {
            col = col + "Sort";
        }

        this.rows.sort((a: OtherRow, b: OtherRow) => {
            return this._sortOrder * (a[col] < b[col] ? -1 : 1);
        });
    }

    public add(header: Header): boolean {
        if (header.header || header.value) {
            this.rows.push(new OtherRow(
                this.rows.length + 1,
                header.header,
                header.value));
            return true;
        }

        return false;
    }

    public exists() { return this.rows.length > 0; }

    public get rows(): OtherRow[] { return this._otherRows; };
    public toString() {
        if (!this.exists()) return "";
        const ret: string[] = ["Other"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.value); }
        });
        return ret.join("\n");
    }
}