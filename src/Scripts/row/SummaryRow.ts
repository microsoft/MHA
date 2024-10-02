import { Row } from "./Row";
import { strings } from "../Strings";

export class SummaryRow extends Row {
    constructor(header: string, label: string) {
        super(header, label, "");
        this.url = strings.mapHeaderToURL(header, label);
    }
}
