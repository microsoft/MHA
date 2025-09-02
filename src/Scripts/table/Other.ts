import { DataTable } from "./DataTable";
import { mhaStrings } from "../mhaStrings";
import { Header } from "../row/Header";
import { OtherRow } from "../row/OtherRow";

export class Other extends DataTable {
    private otherRows: OtherRow[] = [];
    protected sortColumnInternal = "number";
    protected sortOrderInternal = 1;
    public readonly tableName: string = "otherHeaders";
    public readonly displayName: string = mhaStrings.mhaOtherHeaders;

    public get rows(): OtherRow[] { return this.otherRows; }

    public override doSort(col: string): void {
        if (this.sortColumnInternal === col) {
            this.sortOrderInternal *= -1;
        } else {
            this.sortColumnInternal = col;
            this.sortOrderInternal = 1;
        }

        if (this.rows[0] && this.sortColumnInternal + "Sort" in this.rows[0]) {
            col = col + "Sort";
        }

        this.rows.sort((a: OtherRow, b: OtherRow) => {
            return this.sortOrderInternal * ((a[col] as string | number) < (b[col] as string | number) ? -1 : 1);
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

    public override exists() { return this.rows.length > 0; }

    public override toString() {
        if (!this.exists()) return "";
        const ret: string[] = ["Other"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.value); }
        });
        return ret.join("\n");
    }
}
