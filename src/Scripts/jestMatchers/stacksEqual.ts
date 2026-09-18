import { expect } from "@jest/globals";
import type { MatcherFunction } from "expect";

// Normalize Windows source paths in stack frames.
// This includes CI frames that combine a relative src path with an absolute path.
function normalizeWindowsSourcePath(item: string): string {
    const drivePathMatch = /[A-Z]:\\/.exec(item);
    // Preserve the previous non-drive Windows normalization for stacktrace-js output.
    if (!drivePathMatch) return item.replace(/MHA\\src/, "src");

    const beforeDrivePath = item.slice(0, drivePathMatch.index);
    const drivePath = item.slice(drivePathMatch.index);
    // Use the final \src\ segment from the absolute path as the canonical project-relative path.
    const sourcePathIndex = drivePath.lastIndexOf("\\src\\");
    if (sourcePathIndex === -1) return item;

    // Windows CI runners can prepend the working directory-relative src path before the absolute test path.
    const beforeSourcePath = beforeDrivePath.replace(/src\\(?:[^\\]+\\)*$/, "");
    return beforeSourcePath + drivePath.slice(sourcePathIndex + 1);
}

// Strip stack of rows with jest.
// Used to normalize cross environment differences strictly for testing purposes
// Real stacks sent up will contain cross browser quirks
function cleanStack(stack: string[]): string[] | null {
    if (!stack) return null;
    return stack.map(function (item: string): string {
        return normalizeWindowsSourcePath(item)
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