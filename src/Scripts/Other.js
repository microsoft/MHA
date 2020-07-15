/* global mhaStrings */
/* exported Other */

var Other = (function () {
    var row = function (number, header, url, value) {
        return {
            number: number,
            header: header,
            url: url,
            value: value
        }
    };

    var otherRows = [];
    var sortColumn = "number";
    var sortOrder = 1;

    function doSort(col) {
        if (sortColumn === col) {
            sortOrder *= -1;
        } else {
            sortColumn = col;
            sortOrder = 1;
        }

        if (sortColumn + "Sort" in otherRows[0]) {
            col = col + "Sort";
        }

        var that = this;
        otherRows.sort(function (a, b) {
            return that.sortOrder * (a[col] < b[col] ? -1 : 1);
        });
    }

    function init(otherHeader) {
        otherRows.push(new row(
            otherRows.length + 1,
            otherHeader.header,
            mhaStrings.mapHeaderToURL(otherHeader.header, null),
            row.value = otherHeader.value));
    }

    function exists() { return otherRows.length > 0; }

    return {
        init: init,
        exists: exists,
        get otherRows() { return otherRows; },
        doSort: doSort,
        get sortColumn() { return sortColumn; },
        get sortOrder() { return sortOrder; }
    }
});