import { mhaStrings } from "../mhaStrings";
import { ReceivedField } from "./ReceivedField";

export class ReceivedRow {
    constructor(receivedHeader: string | null) {
        this.sourceHeader = new ReceivedField("", receivedHeader);
        this.hop = new ReceivedField(mhaStrings.mhaReceivedHop);
        this.from = new ReceivedField(mhaStrings.mhaReceivedFrom);
        this.by = new ReceivedField(mhaStrings.mhaReceivedBy);
        this.with = new ReceivedField(mhaStrings.mhaReceivedWith);
        this.id = new ReceivedField(mhaStrings.mhaReceivedId);
        this.for = new ReceivedField(mhaStrings.mhaReceivedFor);
        this.via = new ReceivedField(mhaStrings.mhaReceivedVia);
        this.date = new ReceivedField(mhaStrings.mhaReceivedDate);
        this.delay = new ReceivedField(mhaStrings.mhaReceivedDelay);
        this.percent = new ReceivedField(mhaStrings.mhaReceivedPercent, 0);
        this.delaySort = new ReceivedField("", -1);
        this.dateNum = new ReceivedField("");
    }
    [index: string]: ReceivedField | ((fieldName: string, fieldValue: string) => void) | (() => string);
    sourceHeader: ReceivedField;
    hop: ReceivedField;
    from: ReceivedField;
    by: ReceivedField;
    with: ReceivedField;
    id: ReceivedField;
    for: ReceivedField;
    via: ReceivedField;
    date: ReceivedField;
    delay: ReceivedField;
    percent: ReceivedField;
    delaySort: ReceivedField;
    dateNum: ReceivedField;

    setField(fieldName: string, fieldValue: string) {
        if (!fieldName || !fieldValue) {
            return;
        }

        const field = this[fieldName.toLowerCase()] as unknown as ReceivedField;
        if (!field) return;

        if (field.value) { field.value += "; " + fieldValue; }
        else { field.value = fieldValue; }
    }

    toString(): string {
        const str: string[] = [];
        for (const key in this) {
            const field = this[key] as ReceivedField;
            if (field && field.label && field.toString()) {
                str.push(field.label + ": " + field.toString());
            }
        }

        return str.join("\n");
    }
}
