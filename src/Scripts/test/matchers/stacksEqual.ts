import type { MatcherFunction } from "expect";
import { expect } from "@jest/globals";

// Strip stack of rows with jest.
// Used to normalize cross browser differences strictly for testing purposes
// Real stacks sent up will contain cross browser quirks
function cleanStack(stack: string[]) {
    if (!stack) return null;
    return stack.map(function (item: string): string {
        return item
            .replace(/[A-Z]:\\.*?\\MHA\\/, "") // Remove path prefix that start <drive letter>:\src\MHA
            // .replace(/.*node_modules.*/, "") // remove node_modules
            // .replace(/.*localhost.*/, "") // test stacks don't have files from the site
            // .replace(/.*azurewebsites.*/, "") // test stacks don't have files from the site
            .replace(/.*jest.*/, "") // Don't care about jest internals
        // .replace(/.*\.\.\/Scripts\/.*/, "")
        // .replace(/\n+/, "\n") // collapse extra linefeeds
        // .replace(/^.*?\.(.*) \(http/, "$1 (http") // Remove namespace scopes that only appear in some browsers
        // .replace(/^.*?\/< \((http.*)\)/, "$1") // Firefox has this odd /< notation - remove it
        // .replace(/^Anonymous function \((http.*)\)/, "$1") // IE still has Anonymous function - remove it
        // .replace(/(js):\d+:\d*/, "$1") // remove column and line # since they may vary by browser
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