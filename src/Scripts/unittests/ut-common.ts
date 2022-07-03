import * as QUnit from "qunit";
import { ReceivedRow } from "../Received"

declare global {
    interface Assert {
        receivedEqual(actual: { [index: string]: any } | undefined, expected: { [index: string]: any } | undefined, message: string): void;
        arrayEqual(actual: object[], expected: object[], message: string): void;
        datesEqual(actual: ReceivedRow, expected: object, message: string): void;
        errorsEqual(actual: string, expectedValues: string[], message: string): void;
    }
}

QUnit.assert.receivedEqual = function (actual: { [index: string]: any } | undefined, expected: { [index: string]: any } | undefined, message: string): void {
    try {
        if (!actual && !expected) return;
        if (!expected || !actual) {
            this.pushResult({ result: false, actual: actual, expected: expected, message: message });
            return;
        }

        for (const [field, value] of Object.entries(expected)) {
            if (field === "date") continue;
            if (field === "postFix") continue;
            if (field === "_value") continue;
            if (value === actual[field]) continue;
            if (actual[field] && value === actual[field].value) continue;
            if (actual[field] && value === actual[field].toString()) continue;
            this.pushResult({
                result: false,
                actual: field + " = " + actual[field],
                expected: field + " = " + value,
                message: message + "" + field
            });
        }

        for (let field in actual) {
            if (field === "date") continue;
            if (field === "onGetUrl") continue;
            if (field === "setField") continue;
            if (field === "postFix") continue;
            if (field === "_value") continue;
            // If a field in value is non-null/empty there must also be a field in expected
            if (actual[field] && actual[field].toString() && expected[field] === undefined) {
                this.pushResult({
                    result: false,
                    actual: field + " = " + actual[field],
                    expected: field + " = " + expected[field],
                    message: message + "" + field
                });
            }
        }
    }
    catch (e: any) {
        console.log(e);
    }

    this.pushResult({
        result: true,
        actual: actual,
        expected: expected,
        message: message
    });
};

QUnit.assert.arrayEqual = function (actual: object[], expected: object[], message: string): void {
    if (actual.length !== expected.length) {
        this.pushResult({
            result: false,
            actual: "length = " + actual.length,
            expected: "length = " + expected.length,
            message: message + " length"
        });
    }

    for (var i = 0; i < actual.length; i++) {
        this.receivedEqual(actual[i], expected[i], message + "[" + i + "]");
    }

    this.pushResult({
        result: true,
        actual: actual,
        expected: expected,
        message: message
    });
};

QUnit.assert.datesEqual = function (actual: ReceivedRow, expected: object, message: string): void {
    return this.propEqual({ date: (new Date(actual.date.value)).toLocaleString("en-US", { timeZone: "America/New_York" }), dateNum: actual.dateNum.toString() }, expected, message);
};

QUnit.assert.errorsEqual = function (actual: string, expectedValues: string[], message: string): void {
    var found = expectedValues.some((expected: string): boolean => {
        if (actual === expected) {
            this.pushResult({
                result: true,
                actual: actual,
                expected: expected,
                message: message
            });

            return true;
        }

        return false;
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