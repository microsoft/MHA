export class Match {
    public readonly fieldName: string;
    public readonly iToken: number;

    constructor(fieldName: string, iToken: number) {
        this.fieldName = fieldName;
        this.iToken = iToken;

        // Make properties non-writable
        Object.defineProperty(this, "fieldName", { writable: false });
        Object.defineProperty(this, "iToken", { writable: false });
    }
}
