/// <reference path="Table.js" />
/// <reference path="Strings.js" />

var SummaryRow = function (header, label, set, get) {
    this.header = header;
    this.label = label;
    this.value = "";
    this.set = set || this.set;
    this.get = get || this.get;
};

SummaryRow.prototype.header = "";
SummaryRow.prototype.label = "";
SummaryRow.prototype.value = "";
SummaryRow.prototype.set = function (_value) { this.value = _value; };
SummaryRow.prototype.get = function () { return this.value; };

var Summary = function () {
    var that = this;
    var dateRow = new SummaryRow(
        "Date",
        ImportedStrings.mha_creationTime,
        function (value) {
            if (value) {
                this.value = new Date(value).toLocaleString();
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

    this.totalTime = "";
};

Summary.prototype.summaryRows = [];
Summary.prototype.totalTime = "";

Summary.prototype.exists = function () {
    for (var i = 0; i < this.summaryRows.length; i++) {
        if (this.summaryRows[i].get()) {
            return true;
        }
    }

    return false;
};

Summary.prototype.init = function (header) {
    if (!header) {
        return;
    }

    for (var i = 0; i < this.summaryRows.length; i++) {
        if (this.summaryRows[i].header === header.header) {
            this.summaryRows[i].set(header.value);
            return;
        }
    }
};

Summary.prototype.creationTime = function (date) {
    if (!date && !this.totalTime) {
        return null;
    }

    var time = [date || ""];

    if (this.totalTime) {
        time.push(" ", ImportedStrings.mha_deliveredStart, " ", this.totalTime, ImportedStrings.mha_deliveredEnd);
    }

    return time.join("");
};