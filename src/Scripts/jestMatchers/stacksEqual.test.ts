import { expect } from "@jest/globals";

import "./stacksEqual";

describe("stacksEqual", () => {
    test("normalizes Windows CI relative and absolute source path overlap", () => {
        expect([
            "testParse (src\\Scripts\\D:\\a\\MHA\\MHA\\src\\Scripts\\Errors.test.ts:11:27)",
            "Object.<anonymous> (src\\Scripts\\D:\\a\\MHA\\MHA\\src\\Scripts\\Errors.test.ts:11:27)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]).stacksEqual([
            "testParse (src\\Scripts\\Errors.test.ts)",
            "Object.<anonymous> (src\\Scripts\\Errors.test.ts)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]);
    });
});
