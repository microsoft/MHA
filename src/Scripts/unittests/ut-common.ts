/* global QUnit */

QUnit.assert.shallowEqual = function (actual, expected, message) {
    var field;
    for (field in expected) {
        if (expected[field] === actual[field]) continue;
        if (actual[field] && expected[field] === actual[field].value) continue;
        this.pushResult({
            result: false,
            actual: field + " = " + actual[field],
            expected: field + " = " + expected[field],
            message: message
        });
    }

    for (field in actual) {
        // If a field in value is non-null/empty there must also be a field in expected
        if (actual[field].toString() && expected[field] === undefined) {
            this.pushResult({
                result: false,
                actual: field + " = " + actual[field],
                expected: field + " = " + expected[field],
                message: message
            });
        }
    }

    this.pushResult({
        result: true,
        actual: actual,
        expected: expected,
        message: message
    });
};

QUnit.assert.arrayEqual = function (actual, expected, message) {
    if (actual.length !== expected.length) {
        this.pushResult({
            result: false,
            actual: "length = " + actual.length,
            expected: "length = " + expected.length,
            message: message + " length"
        });
    }

    for (var i = 0; i < actual.length; i++) {
        this.shallowEqual(actual[i], expected[i], message + "[" + i + "]");
    }

    this.pushResult({
        result: true,
        actual: actual,
        expected: expected,
        message: message
    });
};

QUnit.assert.datesEqual = function (actual, expected, message) {
    return this.propEqual({ date: actual.date.toString(), dateNum: actual.dateNum.toString() }, expected, message);
};

QUnit.assert.errorsEqual = function (actual, expectedValues, message) {
    var found = expectedValues.some(function (expected) {
        if (actual === expected) {
            this.pushResult({
                result: true,
                actual: actual,
                expected: expected,
                message: message
            });

            return true;
        }
    }, this);

    if (!found) {
        this.pushResult({
            result: false,
            actual: actual,
            expected: expectedValues,
            message: message
        });
    }
};