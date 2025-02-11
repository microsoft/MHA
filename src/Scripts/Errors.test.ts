import  "./jestMatchers/stacksEqual";
import { expect } from "@jest/globals";

import { Errors } from "./Errors";
import { Stack } from "./stacks";

function testParse(done: jest.DoneCallback, exception: unknown, message: string | null, expectedEventName: string, expectedStack: string[]) {
    Stack.parse(exception, message, function (eventName, stack) {
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
    beforeAll(() => { Stack.options.offline = true; });

    test("stringError", done => {
        testParse(done, "stringError", "message", "message : stringError", [
            "testParse (src\\Scripts\\Errors.test.ts)",
            "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]);
    });

    test("notAFunction", done => {
        try {
            // @ts-expect-error Intentional error to test error handling
            document.notAFunction();
        }
        catch (error) {
            testParse(done, error, null, "document.notAFunction is not a function",
                [
                    "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
                    "processTicksAndRejections (node:internal/process/task_queues)"
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
                    "testParse (src\\Scripts\\Errors.test.ts)",
                    "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
                    "processTicksAndRejections (node:internal/process/task_queues)"
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
                    "testParse (src\\Scripts\\Errors.test.ts)",
                    "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
                    "processTicksAndRejections (node:internal/process/task_queues)"
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
                    "testParse (src\\Scripts\\Errors.test.ts)",
                    "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
                    "processTicksAndRejections (node:internal/process/task_queues)"
                ]);
        }
    });

    test("null error and string message", done => {
        testParse(done, null, "message", "message", [
            "testParse (src\\Scripts\\Errors.test.ts)",
            "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]);
    });

    test("null error and null message", done => {
        testParse(done, null, null, "Unknown exception", [
            "testParse (src\\Scripts\\Errors.test.ts)",
            "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]);
    });

    test("new Error()", done => {
        const brokenError = new Error();
        testParse(done, brokenError, null, "Unknown exception", [
            "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]);
    });

    test("integer error and string message", done => {
        testParse(done, 42, "message", "message : 42", [
            "testParse (src\\Scripts\\Errors.test.ts)",
            "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]);
    });
});

describe("getError* Tests", () => {
    test("notAFunction error", () => {
        try {
            // @ts-expect-error Intentional error to test error handling
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
    // @ts-expect-error Intentional error to test error handling
    try { document.notAFunction(); } catch (error) { expect(Errors.isError(error)).toBeTruthy(); }
    try { throw null; } catch (error) { expect(Errors.isError(error)).toBeFalsy(); }
    try { throw "string"; } catch (error) { expect(Errors.isError(error)).toBeFalsy(); }
    try { throw 42; } catch (error) { expect(Errors.isError(error)).toBeFalsy(); }

    expect(Errors.isError("string")).toBeFalsy();
    expect(Errors.isError(42)).toBeFalsy();
    expect(Errors.isError(null)).toBeFalsy();
});
