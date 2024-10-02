import { strings } from "../Strings";
import { SummaryRow } from "./SummaryRow";

export class CreationRow extends SummaryRow {
    constructor(header: string, label: string) {
        super(header, label);
        this.url = strings.mapHeaderToURL(header, label);
        this.postFix = "";
    }
    postFix: string;
    override get value(): string { return this._value + this.postFix; }
    override set value(value: string) { this._value = value; }
}
