import type { MatcherFunction } from "expect";
import { expect } from "@jest/globals";

// Strip stack of rows with jest.
// Used to normalize cross environment differences strictly for testing purposes
// Real stacks sent up will contain cross browser quirks
function cleanStack(stack: string[]) {
    if (!stack) return null;
    return stack.map(function (item: string): string {
        return item
            .replace(/[A-Z]:\\.*?\\MHA\\/, "") // Remove path prefix that start <drive letter>:\src\MHA
            .replace(/MHA\\src/, "src") // Remove path prefix that start MHA\\src
            .replace(/Function\.get \[as parse\]/, "Function.parse") // normalize function name
            .replace(/.*jest.*/, "") // Don't care about jest internals
            .replace(/:\d+:\d*\)/, ")") // remove column and line # since they may vary
        ;
    }).filter(function (item: string): boolean {
        return !!item;
    });
}

export const stacksEqual: MatcherFunction<[expected: unknown]> =
    function (_actual: unknown, _expected: unknown) {
        const actual = _actual as string[];
        const expected = _expected as string[];
        let passed = true;
        const messages: string[] = [];

        const actualStack = cleanStack(actual);
        const expectedStack = cleanStack(expected);

        if (actualStack === undefined || actualStack === null) {
            passed = false;
            messages.push("actual is undefined");
        } else if (expectedStack === undefined || expectedStack === null) {
            passed = false;
            messages.push("expected is undefined");
        }
        else {
            passed = this.equals(actualStack, expectedStack);
            if (!passed) {
                messages.push("Stacks do not match");
                messages.push("Actual stack:");
                actualStack.forEach((actualItem) => { messages.push("\t" + actualItem); });
                messages.push("Expected stack:");
                expectedStack.forEach((expectedItem) => { messages.push("\t" + expectedItem); });
            }
        }

        return {
            pass: passed,
            message: () => messages.join("\n"),
        };
    };

expect.extend({ stacksEqual, });

declare module "expect" {
    interface Matchers<R> {
        stacksEqual(expected: { [index: string]: any }): R;
    }
}