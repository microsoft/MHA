import { Match } from "./Match";

describe("Match", () => {
    it("should create an instance with the given fieldName and iToken", () => {
        const fieldName = "testField";
        const iToken = 123;
        const match = new Match(fieldName, iToken);

        expect(match.fieldName).toBe(fieldName);
        expect(match.iToken).toBe(iToken);
    });

    it("should have readonly properties", () => {
        const match = new Match("testField", 123);

        expect(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (match as any).fieldName = "newField";
        }).toThrow();

        expect(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (match as any).iToken = 456;
        }).toThrow();
    });
});