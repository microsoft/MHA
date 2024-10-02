import { strings } from "../Strings";
import { Row } from "./Row";

export class OtherRow extends Row {
    constructor(number: number, header: string, value: any) {
        super(header, "", "");
        this.number = number;
        this.value = value;
        this.url = strings.mapHeaderToURL(header);
    }

    [index: string]: any;
    number: number;
    override toString() { return this.header + ": " + this.value; }
}
