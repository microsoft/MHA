import { ReceivedField } from "./ReceivedField";

describe("ReceivedField", () => {
    it("should initialize with given label and value", () => {
        const field = new ReceivedField("Test Label", "Test Value");
        expect(field.label).toBe("Test Label");
        expect(field.value).toBe("Test Value");
    });

    it("should initialize with given label and default value when value is undefined", () => {
        const field = new ReceivedField("Test Label");
        expect(field.label).toBe("Test Label");
        expect(field.value).toBe("");
    });

    it("should initialize with given label and null value", () => {
        const field = new ReceivedField("Test Label", null);
        expect(field.label).toBe("Test Label");
        expect(field.value).toBeNull();
    });

    it("should return value as string when value is a string", () => {
        const field = new ReceivedField("Test Label", "Test Value");
        expect(field.toString()).toBe("Test Value");
    });

    it("should return value as string when value is a number", () => {
        const field = new ReceivedField("Test Label", 123);
        expect(field.toString()).toBe("123");
    });

    it("should return \"null\" when value is null", () => {
        const field = new ReceivedField("Test Label", null);
        expect(field.toString()).toBe("null");
    });
});