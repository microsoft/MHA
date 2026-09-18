import { expect } from "@jest/globals";

import "./stacksEqual";

describe("stacksEqual", () => {
    test("normalizes Windows absolute source paths", () => {
        expect([
            "testParse (D:\\a\\MHA\\MHA\\src\\Scripts\\Errors.test.ts:11:27)"
        ]).stacksEqual([
            "testParse (src\\Scripts\\Errors.test.ts)"
        ]);
    });

    test("normalizes repository root source paths", () => {
        expect([
            "testParse (MHA\\src\\Scripts\\Errors.test.ts:11:27)"
        ]).stacksEqual([
            "testParse (src\\Scripts\\Errors.test.ts)"
        ]);
    });

    test("normalizes Windows CI relative and absolute source path overlap", () => {
        expect([
            "testParse (src\\Foo\\Bar\\D:\\a\\MHA\\MHA\\src\\Foo\\Bar\\Errors.test.ts:11:27)",
            "Object.<anonymous> (src\\Foo\\Bar\\D:\\a\\MHA\\MHA\\src\\Foo\\Bar\\Errors.test.ts:11:27)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]).stacksEqual([
            "testParse (src\\Foo\\Bar\\Errors.test.ts)",
            "Object.<anonymous> (src\\Foo\\Bar\\Errors.test.ts)",
            "processTicksAndRejections (node:internal/process/task_queues)"
        ]);
    });
});
