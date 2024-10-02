import type { MatcherFunction, SyncExpectationResult } from "expect";
import { ReceivedRow } from "../../row/ReceivedRow";
import { expect } from "@jest/globals";
import { receivedEqual } from "./receivedEqual";

const arrayEqual: MatcherFunction<[expected: object[]]> =
    async function (_actual: unknown, expected: object[]) {
        const actual = _actual as ReceivedRow[];
        const messages: string[] = [];
        let passed = true;

        if (actual.length !== expected.length) {
            passed = false;
            messages.push("length = " + actual.length);
            messages.push("length = " + expected.length);
        }

        for (let i = 0; i < actual.length; i++) {
            const result: SyncExpectationResult = await receivedEqual.call(this, actual[i], expected[i]);
            if (!result.pass) {
                passed = false;
                messages.push("[" + i + "]");
                messages.push(result.message());
            }
        }

        return {
            message: () => messages.join("\n"),
            pass: passed
        };
    };

expect.extend({ arrayEqual, });

declare module "expect" {
    interface Matchers<R> {
        arrayEqual(expected: object[] ): R;
    }
}