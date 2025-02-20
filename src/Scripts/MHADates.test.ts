import { DateWithNum } from "./DateWithNum";
import { MHADates } from "./MHADates";

describe("MHADates.parseDate", () => {
    it("should parse date in YYYY-MM-DD format", () => {
        const dateStr = "2018-01-28";
        const result = MHADates.parseDate(dateStr);
        expect(result).toBeInstanceOf(DateWithNum);
        expect(result.dateNum).toBe(new Date("01/28/2018 00:00:00 +0000").valueOf());
    });

    it("should parse date in MM-DD-YYYY format", () => {
        const dateStr = "01-28-2018";
        const result = MHADates.parseDate(dateStr);
        expect(result).toBeInstanceOf(DateWithNum);
        expect(result.dateNum).toBe(new Date("01/28/2018 00:00:00 +0000").valueOf());
    });

    it("should handle date with time and milliseconds", () => {
        const dateStr = "2018-01-28 12:34:56.789";
        const result = MHADates.parseDate(dateStr);
        expect(result).toBeInstanceOf(DateWithNum);
        expect(result.dateNum).toBe(new Date("01/28/2018 12:34:56 +0000").valueOf() + 789);
    });

    it("should handle date without timezone offset", () => {
        const dateStr = "2018-01-28 12:34:56";
        const result = MHADates.parseDate(dateStr);
        expect(result).toBeInstanceOf(DateWithNum);
        expect(result.dateNum).toBe(new Date("01/28/2018 12:34:56 +0000").valueOf());
    });

    // TODO: Figure out how to mock a failure to load dayjs
});