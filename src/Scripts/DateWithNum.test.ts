import { DateWithNum } from "./DateWithNum";

describe("DateWithNum", () => {
    it("should create an instance with the correct dateNum and date", () => {
        const dateNum = 1;
        const date = "2023-10-01";
        const dateWithNum = new DateWithNum(dateNum, date);

        expect(dateWithNum.dateNum).toBe(dateNum);
        expect(dateWithNum.date).toBe(date);
    });

    it("should return the correct date string when toString is called", () => {
        const dateNum = 1;
        const date = "2023-10-01";
        const dateWithNum = new DateWithNum(dateNum, date);

        expect(dateWithNum.toString()).toBe(date);
    });
});