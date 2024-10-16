import { expect } from "@jest/globals";
import type { MatcherFunction } from "expect";

import { ReceivedRow } from "../row/ReceivedRow";

export const receivedEqual: MatcherFunction<[expected: { [index: string]: string | number | null }]> =
    function (actualUnknown: unknown, expected: { [index: string]: string | number | null }) {
        const actual = actualUnknown as ReceivedRow;
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
                if (field === "valueInternal") continue;
                if (value === null && actual[field]?.toString() === "null") continue;
                if (typeof value === "number" && value.toString() === actual[field]?.toString()) continue;
                if (typeof value === "string" && value === actual[field]?.toString()) continue;

                messages.push("actual: " + field + " = " + actual[field]);
                messages.push("expected: " + field + " = " + value);
                passed = false;
            }

            for (const field in actual) {
                if (field === "date") continue;
                if (field === "onGetUrl") continue;
                if (field === "setField") continue;
                if (field === "postFix") continue;
                if (field === "valueInternal") continue;
                // If a field in value is non-null/empty there must also be a field in expected
                if (actual[field] && actual[field].toString() && expected[field] === undefined) {
                    messages.push("actual: " + field + " = " + actual[field]);
                    messages.push("expected: " + field + " = " + expected[field]);
                    passed = false;
                }
            }
        }
        catch (e: unknown) {
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
        receivedEqual(expected: { [index: string]: string | number | null }): R;
    }
}