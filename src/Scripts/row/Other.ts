﻿import { mapHeaderToURL } from "../table/Headers";

export const OtherRow = function () {
};

OtherRow.prototype.number = 0;
OtherRow.prototype.header = "";
OtherRow.prototype.url = "";
OtherRow.prototype.value = "";

export const Other = function () {
    this.otherRows = [];
};

Other.prototype.tableName = "otherHeaders";
Other.prototype.otherRows = [];
Other.prototype.sortColumn = "number";
Other.prototype.sortOrder = 1;

Other.prototype.exists = function () {
    return this.otherRows.length > 0;
};

Other.prototype.doSort = function (col) {
    const that = this;
    if (this.sortColumn === col) {
        this.sortOrder *= -1;
    } else {
        this.sortColumn = col;
        this.sortOrder = 1;
    }

    if (this.sortColumn + "Sort" in this.otherRows[0]) {
        col = col + "Sort";
    }

    this.otherRows.sort(function (a, b) {
        return that.sortOrder * (a[col] < b[col] ? -1 : 1);
    });
};

Other.prototype.init = function (otherHeader) {
    const row = new OtherRow();

    row.number = this.otherRows.length + 1;
    row.header = otherHeader.header;
    row.url = mapHeaderToURL(otherHeader.header, null);
    row.value = otherHeader.value;

    this.otherRows.push(row);
};