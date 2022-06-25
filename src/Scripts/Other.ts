import { mhaStrings } from "./Strings";

class row {
    constructor(number: number, header: string, value: any) {
        this.number = number;
        this.header = header;
        this.value = value;
    }

    number: number;
    header: string;
    value: any;
    public get url(): string { return mhaStrings.mapHeaderToURL(this.header, null); };
    toString() { return this.header + ": " + this.value; }
}

export const Other = (function () {
    const otherRows: row[] = [];
    let sortColumn = "number";
    let sortOrder = 1;

    function doSort(col: string): void {
        if (sortColumn === col) {
            sortOrder *= -1;
        } else {
            sortColumn = col;
            sortOrder = 1;
        }

        if (sortColumn + "Sort" in otherRows[0]) {
            col = col + "Sort";
        }

        otherRows.sort((a: row, b: row) => {
            return this.sortOrder * (a[col] < b[col] ? -1 : 1);
        });
    }

    function add(otherHeader): void {
        otherRows.push(new row(
            otherRows.length + 1,
            otherHeader.header,
            otherHeader.value));
    }

    function exists() { return otherRows.length > 0; }

    return {
        tableName: "otherHeaders",
        add: add,
        exists: exists,
        get otherRows() { return otherRows; },
        doSort: doSort,
        get sortColumn() { return sortColumn; },
        get sortOrder() { return sortOrder; },
        toString: function () {
            if (!exists()) return "";
            const ret: string[] = ["Other"];
            otherRows.forEach(function (row) {
                if (row.value) { ret.push(row.value); }
            });
            return ret.join("\n");
        }
    }
});