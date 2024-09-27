import type { MatcherFunction } from "expect";
import { ReceivedRow } from "../Received";
import { expect } from "@jest/globals";

export const receivedEqual: MatcherFunction<[expected: unknown]> =
    function (_actual: unknown, _expected: unknown) {
        const actual = _actual as ReceivedRow;
        const expected = _expected as { [index: string]: any };
        let passed = true;
        const messages: string[] = [];

        try {
            if (typeof actual !== "object" || actual == null) {
                return {
                    message: () => "Actual is not an object",
                    pass: false,
                };
            }

            if (typeof expected !== "object" || expected == null) {
                return {
                    message: () => "Expected is not an object",
                    pass: false,
                };
            }

            for (const [field, value] of Object.entries(expected)) {
                if (field === "date") continue;
                if (field === "postFix") continue;
                if (field === "_value") continue;
                if (value === actual[field]) continue;
                // if (actual[field] && value === actual[field].value) continue;
                if (actual[field] && value === actual[field].toString()) continue;
                messages.push("actual: " + field + " = " + actual[field]);
                messages.push("expected: " + field + " = " + value);
                passed = false;
            }

            for (const field in actual) {
                if (field === "date") continue;
                if (field === "onGetUrl") continue;
                if (field === "setField") continue;
                if (field === "postFix") continue;
                if (field === "_value") continue;
                // If a field in value is non-null/empty there must also be a field in expected
                if (actual[field] && actual[field].toString() && expected[field] === undefined) {
                    messages.push("actual: " + field + " = " + actual[field]);
                    messages.push("expected: " + field + " = " + expected[field]);
                    passed = false;
                }
            }
        }
        catch (e: any) {
            console.log(e);
        }

        if (messages.length === 0) { messages.push("Received rows are equal"); }

        return {
            message: () => messages.join("\n"),
            pass: passed
        };
    };

expect.extend({ receivedEqual, });

declare module "expect" {
    interface Matchers<R> {
        receivedEqual(expected: { [index: string]: any }): R;
    }
}