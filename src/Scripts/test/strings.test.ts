import { strings } from "../Strings";

describe("joinArray Tests", () => {
    test("null", () => { expect(strings.joinArray(null, " : ")).toBe(""); });
    test("[\"1\"]", () => { expect(strings.joinArray(["1"], " : ")).toBe("1"); });
    test("[\"1\", \"2\"]", () => { expect(strings.joinArray(["1", "2"], " : ")).toBe("1 : 2"); });
    test("[null, \"2\"]", () => { expect(strings.joinArray([null, "2"], " : ")).toBe("2"); });
    test("[\"1\", null]", () => { expect(strings.joinArray(["1", null], " : ")).toBe("1"); });
    test("[\"1\", null, \"3\"]", () => { expect(strings.joinArray(["1", null, "3"], " : ")).toBe("1 : 3"); });
    test("[1 : 2]", () => { expect(strings.joinArray([1, 2], " : ")).toBe("1 : 2"); });
});
