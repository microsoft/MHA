import { iTable } from "./itable";
import { mhaStrings } from "./mhaStrings";
import { mhaDates, DateWithNum } from "./dates";
import { Header } from "./Headers";

class ReceivedField {
    constructor(label: string, value?: string | number | null) {
        this.label = label;
        this.value = value !== undefined ? value : "";
    }
    label: string;
    value: any;
    toString(): string { return this.value; }
}

export class ReceivedRow {
    constructor(receivedHeader: string | null) {
        this.sourceHeader = new ReceivedField("", receivedHeader);
        this.hop = new ReceivedField(mhaStrings.mhaReceivedHop);
        this.from = new ReceivedField(mhaStrings.mhaReceivedFrom);
        this.by = new ReceivedField(mhaStrings.mhaReceivedBy);
        this.with = new ReceivedField(mhaStrings.mhaReceivedWith);
        this.id = new ReceivedField(mhaStrings.mhaReceivedId);
        this.for = new ReceivedField(mhaStrings.mhaReceivedFor);
        this.via = new ReceivedField(mhaStrings.mhaReceivedVia);
        this.date = new ReceivedField(mhaStrings.mhaReceivedDate);
        this.delay = new ReceivedField(mhaStrings.mhaReceivedDelay);
        this.percent = new ReceivedField(mhaStrings.mhaReceivedPercent, 0);
        this.delaySort = new ReceivedField("", -1);
        this.dateNum = new ReceivedField("");
    }
    [index: string]: ReceivedField | ((fieldName: string, fieldValue: string) => boolean) | (() => string);
    sourceHeader: ReceivedField;
    hop: ReceivedField;
    from: ReceivedField;
    by: ReceivedField;
    with: ReceivedField;
    id: ReceivedField;
    for: ReceivedField;
    via: ReceivedField;
    date: ReceivedField;
    delay: ReceivedField;
    percent: ReceivedField;
    delaySort: ReceivedField;
    dateNum: ReceivedField;

    setField(fieldName: string, fieldValue: string): boolean {
        if (!fieldName || !fieldValue) {
            return false;
        }

        const field = this[fieldName.toLowerCase()] as unknown as ReceivedField;
        if (!field) return false;

        if (field.value) { field.value += "; " + fieldValue; }
        else { field.value = fieldValue; }

        return false;
    }

    toString(): string {
        const str: string[] = [];
        for (const key in this) {
            const field = this[key] as ReceivedField;
            if (field && field.label && field.toString()) {
                str.push(field.label + ": " + field.toString());
            }
        }

        return str.join("\n");
    }
}

export class Received extends iTable {
    private _receivedRows: ReceivedRow[] = [];
    protected _sortColumn = "hop";
    protected _sortOrder = 1;
    public readonly tableName: string = "receivedHeaders";

    // Builds array of values for each header in receivedHeaderNames.
    // This algorithm should work regardless of the order of the headers, given:
    //  - The date, if present, is always at the end, separated by a ";".
    // Values not attached to a header will not be reflected in output.
    public parseHeader(receivedHeader: string | null): ReceivedRow {
        const receivedFields: ReceivedRow = new ReceivedRow(receivedHeader);

        if (receivedHeader) {
            // Strip linefeeds first
            receivedHeader = receivedHeader.replace(/\r|\n|\r\n/g, " ");

            // Some bad dates don't wrap UTC in paren - fix that first
            receivedHeader = receivedHeader.replace(/UTC|\(UTC\)/gi, "(UTC)");

            // Read out the date first, then clear it from the string
            let iDate = receivedHeader.lastIndexOf(";");

            // No semicolon means no date - or maybe there's one there?
            // Sendgrid is bad about this
            if (iDate === -1) {
                // First try to find a day of the week
                receivedHeader = receivedHeader.replace(/\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/g, "; $1");
                iDate = receivedHeader.lastIndexOf(";");
            }

            if (iDate === -1) {
                // Next we look for year-month-day, 4-1/2-1/2
                receivedHeader = receivedHeader.replace(/\s*(\d{4}-\d{1,2}-\d{1,2})/g, "; $1");
                iDate = receivedHeader.lastIndexOf(";");
            }

            if (iDate !== -1 && receivedHeader.length !== iDate + 1) {
                const dateField = receivedHeader.substring(iDate + 1);
                receivedHeader = receivedHeader.substring(0, iDate);
                const parsedDate: DateWithNum = mhaDates.parseDate(dateField);

                if (parsedDate) {
                    receivedFields["date"].value = parsedDate.date;
                    receivedFields["dateNum"].value = parsedDate.dateNum;
                }
            }

            // Scan for malformed postFix headers
            // Received: by example.com (Postfix, from userid 1001)
            //   id 1234ABCD; Thu, 21 Aug 2014 12:12:48 +0200 (CEST)
            const postFix = receivedHeader.match(/(.*)by (.*? \(Postfix, from userid .*?\))(.*)/mi);
            if (postFix) {
                receivedFields.setField("by", postFix[2] ?? "");
                receivedHeader = `${postFix[1] ?? ""}${postFix[3] ?? ""}`;
            }

            // Scan for malformed qmail headers
            // Received: (qmail 10876 invoked from network); 24 Aug 2014 16:13:38 -0000
            const qmail = receivedHeader.match(/(.*)\((qmail .*? invoked from .*?)\)(.*)/mi);
            if (qmail) {
                receivedFields.setField("by", qmail[2] ?? "");
                receivedHeader = `${qmail[1] ?? ""}${qmail[3] ?? ""}`;
            }

            // Split up the string now so we can look for our headers
            const tokens = receivedHeader.split(/\s+/);

            // Build array of header locations
            class match { fieldName = ""; iToken = 0; }
            const headerMatches: match[] = [];

            let fieldName: string;
            for (fieldName in receivedFields) {
                tokens.some(function (token, iToken) {
                    if (fieldName.toLowerCase() === token.toLowerCase()) {
                        headerMatches.push(<match>{ fieldName: fieldName, iToken: iToken });
                        // We don't return true so we can match any duplicate headers
                        // In doing this, we risk failing to parse a string where a header
                        // keyword appears as the value for another header
                        // Both situations are invalid input
                        // We're just picking which one we'd prefer to handle
                    }
                });
            }

            // Next bit assumes headerMatches[fieldName,iToken] is increasing on iToken.
            // Sort it so it is.
            headerMatches.sort(function (a, b) { return a.iToken - b.iToken; });

            headerMatches.forEach(function (headerMatch, iMatch) {
                let iNextTokenHeader;
                if (iMatch + 1 < headerMatches.length) {
                    iNextTokenHeader = headerMatches[iMatch + 1]?.iToken;
                } else {
                    iNextTokenHeader = tokens.length;
                }

                receivedFields.setField(headerMatch.fieldName, tokens.slice(headerMatch.iToken + 1, iNextTokenHeader).join(" ").trim());
            });
        }

        return receivedFields;
    }

    public exists(): boolean { return this.rows.length > 0; }

    public doSort(col: string): void {
        if (this.sortColumn === col) {
            this._sortOrder *= -1;
        } else {
            this._sortColumn = col;
            this._sortOrder = 1;
        }

        if (this.rows[0] && this.sortColumn + "Sort" in this.rows[0]) {
            col = col + "Sort";
        }

        this.rows.sort((a: ReceivedRow, b: ReceivedRow) => {
            const acol = a[col];
            if (!acol) return 1;
            const bcol = b[col];
            if (!bcol) return -1;
            return this.sortOrder * (acol < bcol ? -1 : 1);
        });
    }

    public addInternal(receivedHeader: string): void { this.rows.push(this.parseHeader(receivedHeader)); }
    public add(header: Header): boolean {
        if (header.header.toUpperCase() === "Received".toUpperCase()) {
            this.rows.push(this.parseHeader(header.value));
            return true;
        }

        return false;
    }

    // Computes min/sec from the diff of current and last.
    // Returns nothing if last or current is NaN.
    public static computeTime(current: number, last: number): string {
        const time: string[] = [];

        if (isNaN(current) || isNaN(last)) { return ""; }
        let diff = current - last;
        let iDelay;
        let printedMinutes = false;

        if (Math.abs(diff) < 1000) {
            return "0 " + mhaStrings.mhaSeconds;
        }

        if (diff < 0) {
            time.push(mhaStrings.mhaNegative);
            diff = -diff;
        }

        if (diff >= 1000 * 60) {
            iDelay = Math.floor(diff / 1000 / 60);
            time.push(iDelay.toString(), " ");
            if (iDelay === 1) {
                time.push(mhaStrings.mhaMinute);
            } else {
                time.push(mhaStrings.mhaMinutes);
            }

            diff -= iDelay * 1000 * 60;
            printedMinutes = true;
        }

        if (printedMinutes && diff) {
            time.push(" ");
        }

        if (!printedMinutes || diff) {
            iDelay = Math.floor(diff / 1000);
            time.push(iDelay.toString(), " ");
            if (iDelay === 1) {
                time.push(mhaStrings.mhaSecond);
            } else {
                time.push(mhaStrings.mhaSeconds);
            }
        }

        return time.join("");
    }

    public computeDeltas(): string {
        // Process received headers in reverse order
        this.rows.reverse();

        // Parse rows and compute values needed for the "Delay" column
        let iStartTime = 0;
        let iEndTime = 0;
        let iLastTime = NaN;
        let iDelta = 0; // This will be the sum of our positive deltas

        this.rows.forEach(function (row: ReceivedRow) {
            if (!isNaN(row.dateNum.value)) {
                if (!isNaN(iLastTime) && iLastTime < row.dateNum.value) {
                    iDelta += row.dateNum.value - iLastTime;
                }

                iStartTime = iStartTime || row.dateNum.value;
                iEndTime = row.dateNum.value;
                iLastTime = row.dateNum.value;
            }
        });

        iLastTime = NaN;

        this.rows.forEach(function (row: ReceivedRow, index: number) {
            row.hop.value = index + 1;
            row.delay.value = Received.computeTime(row.dateNum.value, iLastTime);

            if (!isNaN(row.dateNum.value) && !isNaN(iLastTime) && iDelta !== 0) {
                row.delaySort.value = row.dateNum.value - iLastTime;

                // Only positive delays will get percentage bars. Negative delays will be color coded at render time.
                if (row.delaySort.value > 0) {
                    row.percent.value = 100 * row.delaySort.value / iDelta;
                }
            }

            if (!isNaN(row.dateNum.value)) {
                iLastTime = row.dateNum.value;
            }
        });

        // Total time is still last minus first, even if negative.
        return iEndTime !== iStartTime ? Received.computeTime(iEndTime, iStartTime) : "";
    }

    public get rows(): ReceivedRow[] { return this._receivedRows; }
    public toString(): string {
        if (!this.exists()) return "";
        const ret: string[] = ["Received"];
        const rows: ReceivedRow[] = [];
        this.rows.forEach(function (row: ReceivedRow): void {
            rows.push(row);
        });
        if (rows.length) ret.push(rows.join("\n\n"));
        return ret.join("\n");
    }
}
