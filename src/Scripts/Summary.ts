import { mhaStrings } from "./mhaStrings";
import { Header } from "./row/Header";
import { Row } from "./row/Row";
import { SummaryRow } from "./row/SummaryRow";
import { CreationRow } from "./row/CreationRow";
import { ArchivedRow } from "./row/ArchivedRow";

export class Summary {
    private _totalTime = "";

    private creationPostFix(totalTime: string): string {
        if (!totalTime) {
            return "";
        }

        return ` ${mhaStrings.mhaDeliveredStart} ${totalTime}${mhaStrings.mhaDeliveredEnd}`;
    }

    private dateRow = new CreationRow("Date", mhaStrings.mhaCreationTime);

    private archivedRow = new ArchivedRow("Archived-At", mhaStrings.mhaArchivedAt,);

    private summaryRows: SummaryRow[] = [
        new SummaryRow("Subject", mhaStrings.mhaSubject),
        new SummaryRow("Message-ID", mhaStrings.mhaMessageId),
        this.archivedRow,
        this.dateRow,
        new SummaryRow("From", mhaStrings.mhaFrom),
        new SummaryRow("Reply-To", mhaStrings.mhaReplyTo),
        new SummaryRow("To", mhaStrings.mhaTo),
        new SummaryRow("CC", mhaStrings.mhaCc)
    ];

    public exists(): boolean {
        let row: Row | undefined;
        this.rows.forEach((r: Row) => { if (!row && r.value) row = r; });
        return row !== undefined;
    }

    public add(header: Header) {
        if (!header) {
            return false;
        }

        let row: SummaryRow | undefined;
        this.rows.forEach((r: Row) => { if (!row && r.header.toUpperCase() === header.header.toUpperCase()) row = r; });
        if (row) {
            row.value = header.value;
            return true;
        }

        return false;
    }

    public get rows(): SummaryRow[] { return this.summaryRows; }
    public get totalTime(): string { return this._totalTime; }
    public set totalTime(value: string) {
        this._totalTime = value;
        this.dateRow.postFix = this.creationPostFix(value);
    }

    public toString(): string {
        if (!this.exists()) return "";
        const ret = ["Summary"];
        this.rows.forEach(function (row) {
            if (row.value) { ret.push(row.toString()); }
        });
        return ret.join("\n");
    }
}
