/* global QUnit */

QUnit.assert.shallowEqual = function (value, expected, message) {
    var field;
    for (field in expected) {
        if (expected[field] === value[field].value) continue;
        if (expected[field] === value[field]) continue;
        this.pushResult({
            result: false,
            actual: field + " = " + value[field],
            expected: field + " = " + expected[field],
            message: message
        });
    }

    for (field in value) {
        if (expected[field] === undefined) {
            if (!value[field].toString()) continue;
            this.pushResult({
                result: false,
                actual: field + " = " + value[field],
                expected: field + " = " + expected[field],
                message: message
            });
        }
    }

    this.pushResult({
        result: true,
        actual: value,
        expected: expected,
        message: message
    });
};

QUnit.assert.arrayEqual = function (value, expected, message) {
    if (value.length !== expected.length) {
        this.pushResult({
            result: false,
            actual: "length = " + value.length,
            expected: "length = " + expected.length,
            message: message + " length"
        });
    }

    for (var i = 0; i < value.length; i++) {
        this.shallowEqual(value[i], expected[i], message + "[" + i + "]");
    }

    this.pushResult({
        result: true,
        actual: value,
        expected: expected,
        message: message
    });
};

QUnit.assert.datesEqual = function (value, expected, message) {
    return this.propEqual({ date: value.date.toString(), dateNum: value.dateNum.toString() }, expected, message);
};

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