/// <reference path="Table.js" />
/// <reference path="Strings.js" />

var SummaryRow = function (header, label, set, get) {
    this.header = header;
    this.label = label;

    var that = this;

    this.set = set || function (_value) { that.value = _value; };
    this.get = get || function () { return that.value; };
};

SummaryRow.prototype.header = "";
SummaryRow.prototype.label = "";
SummaryRow.prototype.value = "";
SummaryRow.prototype.set = function (_value) { };
SummaryRow.prototype.get = function () { };

var Summary = function () {
    var that = this;
    var dateRow = new SummaryRow(
        "Date",
        ImportedStrings.mha_creationTime,
        function (_value) {
            if (_value) {
                this.value = new Date(_value).toLocaleString();
            } else {
                this.value = "";
            }
        },
        function () {
            return that.creationTime(dateRow.value);
        });

    this.summaryRows = [
        new SummaryRow("Subject", ImportedStrings.mha_subject),
        new SummaryRow("Message-ID", ImportedStrings.mha_messageId),
        dateRow,
        new SummaryRow("From", ImportedStrings.mha_from),
        new SummaryRow("To", ImportedStrings.mha_to),
        new SummaryRow("CC", ImportedStrings.mha_cc)
    ];

    makeResizablePane("summary", ImportedStrings.mha_summary, function () { return that.exists(); });
    makeSummaryTable("#summary", this.summaryRows, "SUM");
};

Summary.prototype.summaryRows = [];
Summary.prototype.totalTime = 0;

Summary.prototype.reset = function () {
    for (var i = 0 ; i < this.summaryRows.length ; i++) {
        this.summaryRows[i].set("");
    }

    this.totalTime = 0;
};

Summary.prototype.exists = function () {
    for (var i = 0 ; i < this.summaryRows.length ; i++) {
        if (this.summaryRows[i].get()) {
            return true;
        }
    }

    return false;
};

Summary.prototype.populateTable = function () {
    for (var i = 0 ; i < this.summaryRows.length ; i++) {
        var headerVal = $("#" + this.summaryRows[i].header + "SUMVal");
        if (headerVal) {
            headerVal.text(this.summaryRows[i].get());
        }
    }
};

Summary.prototype.init = function (_header) {
    if (!_header) {
        return;
    }

    for (var i = 0 ; i < this.summaryRows.length ; i++) {
        if (this.summaryRows[i].header === _header.header) {
            this.summaryRows[i].set(_header.value);
            return;
        }
    }
};

Summary.prototype.creationTime = function (date) {
    if (!date && this.totalTime === 0) {
        return null;
    }

    var time = [date || ""];

    if (this.totalTime !== 0) {
        time.push(" ", ImportedStrings.mha_deliveredStart, " ", this.totalTime, ImportedStrings.mha_deliveredEnd);
    }

    return time.join("");
};