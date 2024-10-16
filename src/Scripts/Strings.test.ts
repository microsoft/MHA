import { Strings } from "./Strings";

describe("joinArray Tests", () => {
    test("null", () => { expect(Strings.joinArray(null, " : ")).toBe(""); });
    test("[\"1\"]", () => { expect(Strings.joinArray(["1"], " : ")).toBe("1"); });
    test("[\"1\", \"2\"]", () => { expect(Strings.joinArray(["1", "2"], " : ")).toBe("1 : 2"); });
    test("[null, \"2\"]", () => { expect(Strings.joinArray([null, "2"], " : ")).toBe("2"); });
    test("[\"1\", null]", () => { expect(Strings.joinArray(["1", null], " : ")).toBe("1"); });
    test("[\"1\", null, \"3\"]", () => { expect(Strings.joinArray(["1", null, "3"], " : ")).toBe("1 : 3"); });
    test("[1 : 2]", () => { expect(Strings.joinArray([1, 2], " : ")).toBe("1 : 2"); });
});
