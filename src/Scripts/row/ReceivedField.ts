export class ReceivedField {
    constructor(label: string, value?: string | number | null) {
        this.label = label;
        this.value = value !== undefined ? value : "";
    }
    label: string;
    value: string | number | null;
    toString(): string { return this.value !== null ? this.value.toString() : "null"; }
}