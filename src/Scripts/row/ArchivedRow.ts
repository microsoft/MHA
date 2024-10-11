import { Strings } from "../Strings";
import { SummaryRow } from "./SummaryRow";

export class ArchivedRow extends SummaryRow {
    constructor(header: string, label: string) {
        super(header, label);
        this.url = Strings.mapHeaderToURL(header, label);
    }
    override get valueUrl(): string { return Strings.mapValueToURL(this.valueInternal); }
}
