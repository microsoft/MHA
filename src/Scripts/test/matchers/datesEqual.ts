import type { MatcherFunction } from "expect";
import { ReceivedRow } from "../../row/ReceivedRow";
import { expect } from "@jest/globals";

export const datesEqual: MatcherFunction<[expected: unknown]> =
    function (_actual: unknown, _expected: unknown) {
        const actual = _actual as ReceivedRow;
        const expected = _expected as { [index: string]: any };
        let passed = true;
        const messages: string[] = [];

        if (actual.date === undefined) {
            passed = false;
            messages.push("date is undefined");
        } else {
            const date = new Date(actual.date.value ?? "");
            const dateStr = date.toLocaleString("en-US", { timeZone: "America/New_York" });
            if (dateStr !== expected["date"]) {
                passed = false;
                messages.push(`date: ${dateStr} !== ${expected["date"]}`);
            }

            const dateNum = actual.dateNum.toString();
            if (dateNum !== expected["dateNum"].toString()) {
                passed = false;
                messages.push(`dateNum: ${dateNum} !== ${expected["dateNum"]}`);
            }
        }

        return {
            pass: passed,
            message: () => messages.join("; "),
        };
    };

expect.extend({ datesEqual, });

declare module "expect" {
    interface Matchers<R> {
        datesEqual(expected: { [index: string]: any }): R;
    }
}