import { expect } from "@jest/globals";
import type { MatcherFunction } from "expect";

// Strip stack of rows with jest.
// Used to normalize cross environment differences strictly for testing purposes
// Real stacks sent up will contain cross browser quirks
function cleanStack(stack: string[]) {
    if (!stack) return null;
    return stack.map(function (item: string): string {
        return item
            .replace(/(\()[A-Z]:\\.*?\\MHA\\/, "$1") // Remove drive prefix after the stack frame's opening parenthesis
            .replace(/MHA\\src/, "src") // Remove path prefix that start MHA\\src
            // Windows CI can report src\...\D:\a\MHA\MHA\src\...\File.ts.
            .replace(/(?:src\\(?:[^\\]+\\)*)?[A-Z]:\\.*?\\.*\\src\\/, "src\\") // Normalize Windows absolute src prefixes
            .replace(/Function\.get \[as parse\]/, "Function.parse") // normalize function name
            .replace(/.*jest.*/, "") // Don't care about jest internals
            .replace(/:\d+:\d*\)/, ")") // remove column and line # since they may vary
        ;
    }).filter(function (item: string): boolean {
        return !!item;
    });
}

export const stacksEqual: MatcherFunction<[expected: string[]]> =
    function (actualUnknown: unknown, expected: string[]) {
        const actual = actualUnknown as string[];
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
        stacksEqual(expected: string[]): R;
    }
}