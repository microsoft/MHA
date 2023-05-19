﻿import * as QUnit from "qunit";
import { Errors } from "../Errors";
import { strings } from "../Strings";

// Strip stack of rows with unittests.html.
// Used to normalize cross browser differences strictly for testing purposes
// Real stacks sent up will contain cross browser quirks
function cleanStack(stack: string[]) {
    if (!stack) return null;
    return stack.map(function (item: string): string {
        return item
            .replace(/.*localhost.*/, "") // test stacks don't have files from the site
            .replace(/.*azurewebsites.*/, "") // test stacks don't have files from the site
            //.replace(/.*qunit.*/, "") // test stacks don't mention QUnit
            .replace(/.*\.\.\/Scripts\/.*/, "")
            .replace(/\n+/, "\n") // collapse extra linefeeds
            .replace(/^.*?\.(.*) \(http/, "$1 (http") // Remove namespace scopes that only appear in some browsers
            .replace(/^.*?\/< \((http.*)\)/, "$1") // Firefox has this odd /< notation - remove it
            .replace(/^Anonymous function \((http.*)\)/, "$1") // IE still has Anonymous function - remove it
            .replace(/^Object\.parse.*unittests\.js.*/, "") // Remove Object.parse lines
            .replace(/^Object\.<anonymous>.*unittests\.js.*/, "") // Remove Object.anonymous lines
            .replace(/(js):\d+:\d*/, "$1"); // remove column and line # since they may vary by browser
    }).filter(function (item: string): boolean {
        return !!item;
    });
}

function compareStacks(assert: Assert, stack1: string[], stack2: string[], name: string) {
    assert.deepEqual(cleanStack(stack1), cleanStack(stack2), name);
}

QUnit.test("Errors.parse Tests", function (assert: Assert) {
    assert.expect(20); // Count of assert calls in the tests below
    const done = assert.async(10); // Count of asynchronous calls below

    Errors.parse("stringError", "message", function (eventName, stack) {
        assert.equal(eventName, "message : stringError", "Errors.parse 1 error");
        compareStacks(assert, stack, [
            "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
            "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
            "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
        ], "Errors.parse 1 stack");
        done();
    });

    try {
        // @ts-ignore Intentional error to test error handling
        document.notAFunction();
    }
    catch (error) {
        Errors.parse(error, "message", function (eventName, stack) {
            assert.errorsEqual(eventName, ["message : Object doesn't support property or method 'notAFunction'",
                "message : document.notAFunction is not a function"], "Try 1 error");
            compareStacks(assert, stack, [
                "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
                "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
                "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
            ], "Try 1 stack");
            done();
        });
    }

    try {
        // @ts-ignore Intentional error to test error handling
        document.notAFunction();
    }
    catch (error) {
        Errors.parse(error, null, function (eventName, stack) {
            assert.errorsEqual(eventName, ["Object doesn't support property or method 'notAFunction'",
                "document.notAFunction is not a function"], "Try 2 error");
            compareStacks(assert, stack, [
                "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
                "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
                "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"], "Try 2 stack");
            done();
        });
    }

    try {
        throw 42;
    }
    catch (error) {
        Errors.parse(error, "message", function (eventName, stack) {
            assert.equal(eventName, "message : 42", "Try 3 error");
            compareStacks(assert, stack, [
                "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
                "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
                "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
            ], "Try 3 stack");
            done();
        });
    }

    try {
        throw { one: 1, two: 2, three: "three" };
    }
    catch (error) {
        Errors.parse(error, null, function (eventName, stack) {
            assert.equal(eventName,
                "{\n" +
                "  \"one\": 1,\n" +
                "  \"two\": 2,\n" +
                "  \"three\": \"three\"\n" +
                "}",
                "Try 4 error");
            compareStacks(assert, stack, [
                "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
                "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
                "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
            ], "Try 4 stack");
            done();
        });
    }

    try {
        throw null;
    }
    catch (error) {
        Errors.parse(error, null, function (eventName, stack) {
            assert.equal(eventName, "Unknown exception", "Try 5 error");
            compareStacks(assert, stack, [
                "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
                "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
                "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
                "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
            ], "Try 5 stack");
            done();
        });
    }

    Errors.parse(null, "message", function (eventName, stack) {
        assert.equal(eventName, "message", "Errors.parse 2 error");
        compareStacks(assert, stack, [
            "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
            "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
            "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
        ], "Errors.parse 2 stack");
        done();
    });

    Errors.parse(null, null, function (eventName, stack) {
        assert.equal(eventName, "Unknown exception", "Errors.parse 3 error");
        compareStacks(assert, stack, [
            "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
            "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
            "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
        ], "Errors.parse 3 stack");
        done();
    });

    const brokenError = new Error();
    Errors.parse(brokenError, "message", function (eventName, stack) {
        assert.equal(eventName, "message", "brokenError event");
        compareStacks(assert, stack, [
            "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
            "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
            "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
        ], "brokenError stack");
        done();
    });

    Errors.parse(42, "message", function (eventName, stack) {
        assert.equal(eventName, "message : 42", "Errors.parse 4 error");
        compareStacks(assert, stack, [
            "runTest (webpack://mha/node_modules/qunit/qunit/qunit.js:2983:)",
            "run (webpack://mha/node_modules/qunit/qunit/qunit.js:2966:)",
            "_toConsumableArray(test.hooks (webpack://mha/node_modules/qunit/qunit/qunit.js:3259:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2525:)",
            "_Promise.resolve(task()).then(function (webpack://mha/node_modules/qunit/qunit/qunit.js:2529:)"
        ], "Errors.parse 4 stack");
        done();
    });
});

QUnit.test("getError* Tests", function (assert: Assert) {
    try {
        // @ts-ignore Intentional error to test error handling
        document.notAFunction();
    }
    catch (error) {
        assert.errorsEqual(Errors.getErrorMessage(error), ["Object doesn't support property or method 'notAFunction'",
            "document.notAFunction is not a function"], "notAFunction error");
        assert.ok(Errors.getErrorStack(error).length > 0);
    }

    try {
        throw "string";
    }
    catch (error) {
        assert.equal(Errors.getErrorMessage(error), "string");
        assert.equal(Errors.getErrorStack(error), "string thrown as error");
    }

    try {
        throw 42;
    }
    catch (error) {
        assert.equal(Errors.getErrorMessage(error), "42");
        assert.equal(Errors.getErrorStack(error), "number thrown as error");
    }

    try {
        throw { one: 1, two: 2, three: "three" };
    }
    catch (error) {
        assert.equal(Errors.getErrorMessage(error), "{\n" +
            "  \"one\": 1,\n" +
            "  \"two\": 2,\n" +
            "  \"three\": \"three\"\n" +
            "}");
        assert.ok(Errors.getErrorStack(error).length == 0);
    }

    assert.equal(Errors.getErrorMessage(null), "");
    assert.equal(Errors.getErrorStack(null), "");

    assert.equal(Errors.getErrorMessage("stringError"), "stringError");
    assert.equal(Errors.getErrorStack("stringError"), "string thrown as error");

    assert.equal(Errors.getErrorMessage(42), "42");
    assert.equal(Errors.getErrorStack(42), "number thrown as error");
});

QUnit.test("joinArray Tests", function (assert: Assert) {
    assert.equal(strings.joinArray(null, " : "), "");
    assert.equal(strings.joinArray(["1"], " : "), "1");
    assert.equal(strings.joinArray(["1", "2"], " : "), "1 : 2");
    assert.equal(strings.joinArray([null, "2"], " : "), "2");
    assert.equal(strings.joinArray(["1", null], " : "), "1");
    assert.equal(strings.joinArray(["1", null, "3"], " : "), "1 : 3");
    assert.equal(strings.joinArray([1, 2], " : "), "1 : 2");
});

QUnit.test("isError Tests", function (assert) {
    // @ts-ignore Intentional error to test error handling
    try { document.notAFunction(); } catch (error) { assert.ok(Errors.isError(error)); }
    try { throw null; } catch (error) { assert.notOk(Errors.isError(error)); }
    try { throw "string"; } catch (error) { assert.notOk(Errors.isError(error)); }
    try { throw 42; } catch (error) { assert.notOk(Errors.isError(error)); }
    assert.notOk(Errors.isError("string"));
    assert.notOk(Errors.isError(42));
    assert.notOk(Errors.isError(null));
});