import { Row } from "./Row";
import { Strings } from "../Strings";

export class SummaryRow extends Row {
    constructor(header: string, label: string) {
        super(header, label, "");
        this.url = Strings.mapHeaderToURL(header, label);
    }
}