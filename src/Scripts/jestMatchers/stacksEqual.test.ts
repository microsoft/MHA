import { expect } from "@jest/globals";

import "./stacksEqual";

describe("stacksEqual", () => {
    test("normalizes duplicated source paths", () => {
        expect([
            "testParse (src\\Scripts\\src\\Scripts\\Errors.test.ts:11:27)",
            "Object.<anonymous> (src\\Scripts\\src\\Scripts\\Errors.test.ts:11:27)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]).stacksEqual([
            "testParse (src\\Scripts\\Errors.test.ts)",
            "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]);
    });
});
