/* global CleanStack */
/* global getErrorMessage */
/* global getErrorStack */
/* global isError */
/* global joinArray */
/* global parseError */
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

QUnit.test("parseError Tests", function (assert) {

    assert.expect(20); // Count of assert calls in the tests below
    var done = assert.async(10); // Count of asynchronous calls below

    parseError("stringError", "message", function (eventName, stack) {
        assert.equal(eventName, "message : stringError");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ]);
        done();
    });

    try {
        document.notAFunction();
    }
    catch (error) {
        parseError(error, "message", function (eventName, stack) {
            assert.errorsEqual(eventName, ["message : Object doesn't support property or method 'notAFunction'",
                "message : document.notAFunction is not a function"]);
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ]);
            done();
        });
    }

    try {
        document.notAFunction();
    }
    catch (error) {
        parseError(error, null, function (eventName, stack) {
            assert.errorsEqual(eventName, ["Object doesn't support property or method 'notAFunction'",
                "document.notAFunction is not a function"]);
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ]);
            done();
        });
    }

    try {
        throw 42;
    }
    catch (error) {
        parseError(error, "message", function (eventName, stack) {
            assert.equal(eventName, "message : 42");
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ]);
            done();
        });
    }

    try {
        throw { one: 1, two: 2, three: "three" };
    }
    catch (error) {
        parseError(error, null, function (eventName, stack) {
            assert.equal(eventName, "{\n" +
                "  \"one\": 1,\n" +
                "  \"two\": 2,\n" +
                "  \"three\": \"three\"\n" +
                "}");
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ]);
            done();
        });
    }

    try {
        throw null;
    }
    catch (error) {
        parseError(error, null, function (eventName, stack) {
            assert.equal(eventName, "Unknown exception");
            assert.deepEqual(CleanStack(stack), [
                "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
                "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
                "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
                "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
                "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
            ]);
            done();
        });
    }

    parseError(null, "message", function (eventName, stack) {
        assert.equal(eventName, "message");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ]);
        done();
    });

    parseError(null, null, function (eventName, stack) {
        assert.equal(eventName, "Unknown exception");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ]);
        done();
    });

    var brokenError = new Error();
    parseError(brokenError, "message", function (eventName, stack) {
        assert.equal(eventName, "message : {}");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ]);
        done();
    });

    parseError(42, "message", function (eventName, stack) {
        assert.equal(eventName, "message : 42");
        assert.deepEqual(CleanStack(stack), [
            "runTest()@https://code.jquery.com/qunit/qunit-2.4.0.js:1471",
            "run()@https://code.jquery.com/qunit/qunit-2.4.0.js:1457",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:1663",
            "advance()@https://code.jquery.com/qunit/qunit-2.4.0.js:1116",
            "begin()@https://code.jquery.com/qunit/qunit-2.4.0.js:2928",
            "Anonymous function()@https://code.jquery.com/qunit/qunit-2.4.0.js:2888"
        ]);
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