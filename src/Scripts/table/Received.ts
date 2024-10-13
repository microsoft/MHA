import { ITable } from "./itable";
import { DateWithNum } from "../DateWithNum";
import { MHADates } from "../MHADates";
import { mhaStrings } from "../mhaStrings";
import { Header } from "../row/Header";
import { Match } from "../row/Match";
import { ReceivedRow } from "../row/ReceivedRow";

export class Received extends ITable {
    private receivedRows: ReceivedRow[] = [];
    protected sortColumnInternal = "hop";
    protected sortOrderInternal = 1;
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
                const parsedDate: DateWithNum = MHADates.parseDate(dateField);

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
            const headerMatches: Match[] = [];

            let fieldName: string;
            for (fieldName in receivedFields) {
                tokens.some(function (token, iToken) {
                    if (fieldName.toLowerCase() === token.toLowerCase()) {
                        headerMatches.push(<Match>{ fieldName: fieldName, iToken: iToken });
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
            this.sortOrderInternal *= -1;
        } else {
            this.sortColumnInternal = col;
            this.sortOrderInternal = 1;
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
            const dateNum: number = typeof row.dateNum.value === "number" ? row.dateNum.value : NaN;
            if (!isNaN(dateNum)) {
                if (!isNaN(iLastTime) && iLastTime < dateNum) {
                    iDelta += dateNum - iLastTime;
                }

                iStartTime = iStartTime || dateNum;
                iEndTime = dateNum;
                iLastTime = dateNum;
            }
        });

        iLastTime = NaN;

        this.rows.forEach(function (row: ReceivedRow, index: number) {
            row.hop.value = index + 1;
            const dateNum: number = typeof row.dateNum.value === "number" ? row.dateNum.value : NaN;
            row.delay.value = Received.computeTime(dateNum, iLastTime);

            if (!isNaN(dateNum) && !isNaN(iLastTime) && iDelta !== 0) {
                row.delaySort.value = dateNum - iLastTime;

                // Only positive delays will get percentage bars. Negative delays will be color coded at render time.
                if (row.delaySort.value > 0) {
                    row.percent.value = 100 * row.delaySort.value / iDelta;
                }
            }

            if (!isNaN(dateNum)) {
                iLastTime = dateNum;
            }
        });

        // Total time is still last minus first, even if negative.
        return iEndTime !== iStartTime ? Received.computeTime(iEndTime, iStartTime) : "";
    }

    public get rows(): ReceivedRow[] { return this.receivedRows; }
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
