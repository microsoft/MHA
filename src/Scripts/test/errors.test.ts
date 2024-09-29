import { Errors } from "../Errors";
import "./matchers/stacksEqual";
import { expect } from "@jest/globals";

function testParse(done: jest.DoneCallback, exception: any, message: string | null, expectedEventName: string, expectedStack: string[]) {
    Errors.parse(exception, message, function (eventName, stack) {
        try {
            expect(eventName).toBe(expectedEventName);
            expect(stack).stacksEqual(expectedStack);
            done();
        } catch (error) {
            done(error);
        }
    });
}

describe("Errors.parse Tests", () => {
    test("stringError", done => {
        testParse(done, "stringError", "message", "message : stringError", [
            "Function.parse (C:\\src\\MHA\\src\\Scripts\\Errors.ts:123:24)",
            "testParse (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:6:12)",
            "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:19:9)",
            "processTicksAndRejections (node:internal/process/task_queues:95:5)"
        ]);
    });

    test("notAFunction", done => {
        try {
            // @ts-ignore Intentional error to test error handling
            document.notAFunction();
        }
        catch (error) {
            testParse(done, error, null, "document.notAFunction is not a function",
                [
                    "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:30:22)",
                    "processTicksAndRejections (node:internal/process/task_queues:95:5)"
                ]);
        }
    });

    test("Throw integer", done => {
        try {
            throw 42;
        }
        catch (error) {
            testParse(done, error, "message", "message : 42",
                [
                    "Function.parse (C:\\src\\MHA\\src\\Scripts\\Errors.ts:123:24)",
                    "testParse (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:6:12)",
                    "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:46:13)",
                    "processTicksAndRejections (node:internal/process/task_queues:95:5)"
                ]);
        }
    });

    test("Throw array", done => {
        try {
            throw { one: 1, two: 2, three: "three" };
        }
        catch (error) {
            testParse(done, error, null,
                "{\n" +
                "  \"one\": 1,\n" +
                "  \"two\": 2,\n" +
                "  \"three\": \"three\"\n" +
                "}",
                [
                    "Function.parse (C:\\src\\MHA\\src\\Scripts\\Errors.ts:123:24)",
                    "testParse (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:6:12)",
                    "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:61:13)",
                    "processTicksAndRejections (node:internal/process/task_queues:95:5)"
                ]);
        }
    });

    test("Throw null", done => {
        try {
            throw null;
        }
        catch (error) {
            testParse(done, error, null, "Unknown exception",
                [
                    "Function.parse (C:\\src\\MHA\\src\\Scripts\\Errors.ts:123:24)",
                    "testParse (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:6:12)",
                    "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:81:13)",
                    "processTicksAndRejections (node:internal/process/task_queues:95:5)"
                ]);
        }
    });

    test("null error and string message", done => {
        testParse(done, null, "message", "message", [
            "Function.parse (C:\\src\\MHA\\src\\Scripts\\Errors.ts:123:24)",
            "testParse (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:6:12)",
            "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:92:9)",
            "processTicksAndRejections (node:internal/process/task_queues:95:5)"
        ]);
    });

    test("null error and null message", done => {
        testParse(done, null, null, "Unknown exception", [
            "Function.parse (C:\\src\\MHA\\src\\Scripts\\Errors.ts:123:24)",
            "testParse (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:6:12)",
            "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:101:9)",
            "processTicksAndRejections (node:internal/process/task_queues:95:5)"
        ]);
    });

    test("new Error()", done => {
        const brokenError = new Error();
        testParse(done, brokenError, null, "Unknown exception", [
            "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:110:29)",
            "processTicksAndRejections (node:internal/process/task_queues:95:5)"
        ]);
    });

    test("integer error and string message", done => {
        testParse(done, 42, "message", "message : 42", [
            "Function.parse (C:\\src\\MHA\\src\\Scripts\\Errors.ts:123:24)",
            "testParse (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:6:12)",
            "Object.<anonymous> (C:\\src\\MHA\\src\\Scripts\\test\\errors.test.ts:118:9)",
            "processTicksAndRejections (node:internal/process/task_queues:95:5)"
        ]);
    });
});

describe("getError* Tests", () => {
    test("notAFunction error", () => {
        try {
            // @ts-ignore Intentional error to test error handling
            document.notAFunction();
        }
        catch (error) {
            expect(Errors.getErrorMessage(error)).toEqual("document.notAFunction is not a function");
            expect(Errors.getErrorStack(error).length).toBeGreaterThan(0);
        }
    });

    test("string thrown as error", () => {
        try {
            throw "string";
        }
        catch (error) {
            expect(Errors.getErrorMessage(error)).toEqual("string");
            expect(Errors.getErrorStack(error)).toEqual("string thrown as error");
        }
    });

    test("number thrown as error", () => {
        try {
            throw 42;
        }
        catch (error) {
            expect(Errors.getErrorMessage(error)).toEqual("42");
            expect(Errors.getErrorStack(error)).toEqual("number thrown as error");
        }
    });

    test("object thrown as error", () => {
        try {
            throw { one: 1, two: 2, three: "three" };
        }
        catch (error) {
            expect(Errors.getErrorMessage(error)).toEqual("{\n" +
                "  \"one\": 1,\n" +
                "  \"two\": 2,\n" +
                "  \"three\": \"three\"\n" +
                "}");
            expect(Errors.getErrorStack(error).length).toBe(0);
        }
    });

    test("null error message", () => { expect(Errors.getErrorMessage(null)).toBe(""); });
    test("null errorstack", () => { expect(Errors.getErrorStack(null)).toBe(""); });

    test("string error message", () => { expect(Errors.getErrorMessage("stringError")).toBe("stringError"); });
    test("string errorstack", () => { expect(Errors.getErrorStack("stringError")).toBe("string thrown as error"); });

    test("42 error message", () => { expect(Errors.getErrorMessage(42)).toBe("42"); });
    test("42 errorstack", () => { expect(Errors.getErrorStack(42)).toBe("number thrown as error"); });
});

describe("isError Tests", () => {
    // @ts-ignore Intentional error to test error handling
    try { document.notAFunction(); } catch (error) { expect(Errors.isError(error)).toBeTruthy(); }
    try { throw null; } catch (error) { expect(Errors.isError(error)).toBeFalsy(); }
    try { throw "string"; } catch (error) { expect(Errors.isError(error)).toBeFalsy(); }
    try { throw 42; } catch (error) { expect(Errors.isError(error)).toBeFalsy(); }

    expect(Errors.isError("string")).toBeFalsy();
    expect(Errors.isError(42)).toBeFalsy();
    expect(Errors.isError(null)).toBeFalsy();
});
