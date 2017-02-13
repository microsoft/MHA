/// <reference path="Table.js" />
/// <reference path="Strings.js" />
/// <reference path="Headers.js" />

var OtherRow = function () {
};

OtherRow.prototype.number = 0;
OtherRow.prototype.header = "";
OtherRow.prototype.url = "";
OtherRow.prototype.value = "";

var Other = function () {
    var that = this;
    makeResizableTable(this.tableName, ImportedStrings.mha_otherHeaders, function () { return that.otherRows.length; });

    var columns = [
        new Column("number", ImportedStrings.mha_number, null),
        new Column("header", ImportedStrings.mha_header, null),
        new Column("value", ImportedStrings.mha_value, null)
    ];

    addColumns(this.tableName, columns);

    setArrows(this.tableName, "number", 1);
};

Other.prototype.tableName = "otherHeaders";
Other.prototype.otherRows = [];
Other.prototype.sortColumn = "number";
Other.prototype.sortOrder = 1;

Other.prototype.reset = function () {
    this.otherRows = [];
    setArrows(this.tableName, "number", 1);
};

Other.prototype.exists = function () {
    return this.otherRows.length > 0;
};

Other.prototype.doSort = function (col) {
    var that = this;
    if (this.sortColumn === col) {
        this.sortOrder *= -1;
    } else {
        this.sortColumn = col;
        this.sortOrder = 1;
    }

    setArrows(this.tableName, this.sortColumn, this.sortOrder);

    if ((this.sortColumn + "Sort") in this.otherRows[0]) {
        col = col + "Sort";
    }

    this.otherRows.sort(function (a, b) {
        return that.sortOrder * (a[col] < b[col] ? -1 : 1);
    });

    rebuildSections();
};

Other.prototype.populateTable = function () {
    var i;
    var row;
    restoreTable(this.tableName);
    for (i = 0 ; i < this.otherRows.length ; i++) {
        row = document.createElement("tr");
        $("#" + this.tableName).append(row); // Must happen before we append cells to appease IE7
        appendCell(row, this.otherRows[i].number, null, null);
        appendCell(row, this.otherRows[i].header, this.otherRows[i].url, null);
        appendCell(row, this.otherRows[i].value, null, "allowBreak");
    }

    $("#" + this.tableName + " tbody tr:odd").addClass("oddRow");
};

Other.prototype.init = function (otherHeader) {
    var row = new OtherRow();

    row.number = this.otherRows.length + 1;
    row.header = otherHeader.header;
    row.url = mapHeaderToURL(otherHeader.header, null);
    row.value = otherHeader.value;

    this.otherRows.push(row);
};