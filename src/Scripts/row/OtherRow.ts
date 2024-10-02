import { strings } from "../Strings";
import { Row } from "./Row";

export class OtherRow extends Row {
    constructor(number: number, header: string, value: string) {
        super(header, "", "");
        this.number = number;
        this.value = value;
        this.url = strings.mapHeaderToURL(header);
    }

    number: number;
    override toString() { return this.header + ": " + this.value; }
}
