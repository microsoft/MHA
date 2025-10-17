export class DateWithNum {
    constructor(dateNum: number, date: string) {
        this.dateNum = dateNum;
        this.date = date;
    }
    dateNum: number;
    date: string;
    public toString = (): string => { return this.date; };
}