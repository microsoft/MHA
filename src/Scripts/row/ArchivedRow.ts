import { strings } from "../Strings";
import { SummaryRow } from "./SummaryRow";

export class ArchivedRow extends SummaryRow {
    constructor(header: string, label: string) {
        super(header, label);
        this.url = strings.mapHeaderToURL(header, label);
    }
    override get valueUrl(): string { return strings.mapValueToURL(this._value); }
}
