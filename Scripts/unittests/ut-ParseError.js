/* global CleanStack */
/* global getErrorMessage */
/* global getErrorStack */
/* global isError */
/* global joinArray */
/* global Errors */
/* global QUnit */

QUnit.assert.errorsEqual = function (value, expectedValues, message) {
    var found = expectedValues.some(function (expected) {
        if (value === expected) {
            this.pushResult({
                result: true,
                actual: value,
                expected: expected,
                message: message
            });

            return true;
        }
    }, this);

    if (!found) {
        this.pushResult({
            result: false,
            actual: value,
            expected: expectedValues,
            message: message
        });
    }
};

QUnit.test("Errors.parse Tests", function (assert) {

    assert.expect(20); // Count of assert calls in the tests below
    var done = assert.async(10); // Count of asynchronous calls below

    Errors.parse("stringError", "message", function (eventName, stack) {
        assert.equal(eventName, "message : stringError", "Errors.parse 1 error");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ], "Errors.parse 1 stack");
        done();
    });

    try {
        document.notAFunction();
    }
    catch (error) {
        Errors.parse(error, "message", function (eventName, stack) {
            assert.errorsEqual(eventName, ["message : Object doesn't support property or method 'notAFunction'",
                "message : document.notAFunction is not a function"], "Try 1 error");
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ], "Try 1 stack");
            done();
        });
    }

    try {
        document.notAFunction();
    }
    catch (error) {
        Errors.parse(error, null, function (eventName, stack) {
            assert.errorsEqual(eventName, ["Object doesn't support property or method 'notAFunction'",
                "document.notAFunction is not a function"], "Try 2 error");
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ], "Try 2 stack");
            done();
        });
    }

    try {
        throw 42;
    }
    catch (error) {
        Errors.parse(error, "message", function (eventName, stack) {
            assert.equal(eventName, "message : 42", "Try 3 error");
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ], "Try 3 stack");
            done();
        });
    }

    try {
        throw { one: 1, two: 2, three: "three" };
    }
    catch (error) {
        Errors.parse(error, null, function (eventName, stack) {
            assert.equal(eventName, "{\n" +
                "  \"one\": 1,\n" +
                "  \"two\": 2,\n" +
                "  \"three\": \"three\"\n" +
                "}",
                "Try 4 error");
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
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
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ], "Try 5 stack");
            done();
        });
    }

    Errors.parse(null, "message", function (eventName, stack) {
        assert.equal(eventName, "message", "Errors.parse 2 error");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ], "Errors.parse 2 stack");
        done();
    });

    Errors.parse(null, null, function (eventName, stack) {
        assert.equal(eventName, "Unknown exception", "Errors.parse 3 error");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ], "Errors.parse 3 stack");
        done();
    });

    var brokenError = new Error();
    Errors.parse(brokenError, "message", function (eventName, stack) {
        assert.equal(eventName, "message", "brokenError event");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ], "brokenError stack");
        done();
    });

    Errors.parse(42, "message", function (eventName, stack) {
        assert.equal(eventName, "message : 42", "Errors.parse 4 error");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ], "Errors.parse 4 stack");
        done();
    });
});

QUnit.test("getError* Tests", function (assert) {
    try {
        document.notAFunction();
    }
    catch (error) {
        assert.errorsEqual(getErrorMessage(error), ["Object doesn't support property or method 'notAFunction'",
            "document.notAFunction is not a function"]);
        assert.ok(getErrorStack(error).length > 0);
    }

    try {
        throw "string";
    }
    catch (error) {
        assert.equal(getErrorMessage(error), "string");
        assert.equal(getErrorStack(error), "string thrown as error");
    }

    try {
        throw 42;
    }
    catch (error) {
        assert.equal(getErrorMessage(error), "42");
        assert.ok(getErrorStack(error).length === 0);
    }

    try {
        throw { one: 1, two: 2, three: "three" };
    }
    catch (error) {
        assert.equal(getErrorMessage(error), "{\n" +
            "  \"one\": 1,\n" +
            "  \"two\": 2,\n" +
            "  \"three\": \"three\"\n" +
            "}");
        assert.ok(getErrorStack(error).length == 0);
    }

    assert.equal(getErrorMessage(null), "");
    assert.equal(getErrorStack(null), "");

    assert.equal(getErrorMessage("stringError"), "stringError");
    assert.equal(getErrorStack("stringError"), "string thrown as error");

    assert.equal(getErrorMessage(42), "42");
    assert.equal(getErrorStack(42), "");
});

QUnit.test("joinArray Tests", function (assert) {
    assert.equal(joinArray(null, " : "), null);
    assert.equal(joinArray(["1"], " : "), "1");
    assert.equal(joinArray(["1", "2"], " : "), "1 : 2");
    assert.equal(joinArray([null, "2"], " : "), "2");
    assert.equal(joinArray(["1", null], " : "), "1");
    assert.equal(joinArray(["1", null, "3"], " : "), "1 : 3");
    assert.equal(joinArray([1, 2], " : "), "1 : 2");
});

QUnit.test("isError Tests", function (assert) {
    try { document.notAFunction(); } catch (error) { assert.ok(isError(error)); }
    try { throw null; } catch (error) { assert.notOk(isError(error)); }
    try { throw "string"; } catch (error) { assert.notOk(isError(error)); }
    try { throw 42; } catch (error) { assert.notOk(isError(error)); }
    assert.notOk(isError("string"));
    assert.notOk(isError(42));
    assert.notOk(isError(null));
});