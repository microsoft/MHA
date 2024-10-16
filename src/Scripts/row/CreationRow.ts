import { Strings } from "../Strings";
import { SummaryRow } from "./SummaryRow";

export class CreationRow extends SummaryRow {
    constructor(header: string, label: string) {
        super(header, label);
        this.url = Strings.mapHeaderToURL(header, label);
        this.postFix = "";
    }
    postFix: string;
    override get value(): string { return this.valueInternal + this.postFix; }
    override set value(value: string) { this.valueInternal = value; }
}
