import { expect } from "@jest/globals";
import type { MatcherFunction, SyncExpectationResult } from "expect";

import { receivedEqual } from "./receivedEqual";
import { ReceivedRow } from "../row/ReceivedRow";

const arrayEqual: MatcherFunction<[expected: { [index: string]: string }[]]> =
    async function (actualUnknown: unknown, expected: { [index: string]: string }[]) {
        const actual = actualUnknown as ReceivedRow[];
        const messages: string[] = [];
        let passed = true;

        if (actual.length !== expected.length) {
            passed = false;
            messages.push("length = " + actual.length);
            messages.push("length = " + expected.length);
        }

        for (let i = 0; i < actual.length; i++) {
            const expectedValue = expected[i] as { [index: string]: string };
            const result: SyncExpectationResult = await receivedEqual.call(this, actual[i], expectedValue);
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
        arrayEqual(expected: { [index: string]: string }[] ): R;
    }
}