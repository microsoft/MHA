import { getRules, resetRulesState, ruleStore } from "./GetRules";

// Mock fetch globally
global.fetch = jest.fn();

/* eslint-disable @typescript-eslint/naming-convention */
describe("GetRules", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the singleton state before each test
        resetRulesState();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getRules", () => {
        test("should load rules from JSON file successfully", async () => {
            const mockRulesResponse = {
                IsError: false,
                Message: "Rules loaded successfully",
                SimpleRules: [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "Subject",
                        PatternToCheckFor: "spam",
                        MessageWhenPatternFails: "Spam detected",
                        SectionsInHeaderToShowError: ["Subject"],
                        Severity: "error"
                    }
                ],
                AndRules: []
            };

            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRulesResponse,
            } as Response);

            const completionCallback = jest.fn();
            await getRules(completionCallback);

            expect(mockFetch).toHaveBeenCalledWith("/Pages/data/rules.json");
            expect(ruleStore.simpleRuleSet).toHaveLength(1);
            expect(ruleStore.simpleRuleSet[0]!.SectionToCheck).toBe("Subject");
            expect(completionCallback).toHaveBeenCalled();
        });

        test("should load AND rules from JSON file", async () => {
            const mockRulesResponse = {
                IsError: false,
                Message: "Rules loaded successfully",
                SimpleRules: [],
                AndRules: [
                    {
                        Message: "Spam to inbox",
                        SectionsInHeaderToShowError: ["SFV"],
                        Severity: "error",
                        RulesToAnd: [
                            {
                                RuleType: "SimpleRule",
                                SectionToCheck: "X-Forefront-Antispam-Report",
                                PatternToCheckFor: "SFV:SPM",
                                MessageWhenPatternFails: "Spam",
                                SectionsInHeaderToShowError: ["SFV"],
                                Severity: "info"
                            }
                        ]
                    }
                ]
            };

            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRulesResponse,
            } as Response);

            const completionCallback = jest.fn();
            await getRules(completionCallback);

            expect(ruleStore.andRuleSet).toHaveLength(1);
            expect(ruleStore.andRuleSet[0]!.Message).toBe("Spam to inbox");
            expect(completionCallback).toHaveBeenCalled();
        });

        test("should not call completion callback when not provided", async () => {
            const mockRulesResponse = {
                IsError: false,
                Message: "Success",
                SimpleRules: [],
                AndRules: []
            };

            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRulesResponse,
            } as Response);

            await getRules(); // No callback provided

            // Should not throw error
        });

        test("should clear existing rules before loading new ones", async () => {
            // Pre-populate with existing rules
            /* eslint-disable @typescript-eslint/naming-convention */
            ruleStore.simpleRuleSet.push({
                RuleType: "SimpleRule",
                SectionToCheck: "Old",
                PatternToCheckFor: "old",
                MessageWhenPatternFails: "Old rule",
                SectionsInHeaderToShowError: ["Old"],
                Severity: "error"
            });

            const mockRulesResponse = {
                IsError: false,
                Message: "Success",
                SimpleRules: [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "New",
                        PatternToCheckFor: "new",
                        MessageWhenPatternFails: "New rule",
                        SectionsInHeaderToShowError: ["New"],
                        Severity: "error"
                    }
                ],
                AndRules: []
            };
            /* eslint-enable @typescript-eslint/naming-convention */

            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRulesResponse,
            } as Response);

            await getRules();

            expect(ruleStore.simpleRuleSet).toHaveLength(1);
            expect(ruleStore.simpleRuleSet[0]!.SectionToCheck).toBe("New");
        });

        test("should handle multiple calls (memoization)", async () => {
            // This test verifies the singleton pattern: getRules() loads from the server
            // only once, then subsequent calls reuse the cached rules without re-fetching.
            // This is critical for performance - we don't want to reload rules.json on every
            // header analysis.

            /* eslint-disable @typescript-eslint/naming-convention */
            const mockRulesResponse = {
                IsError: false,
                Message: "Success",
                SimpleRules: [],
                AndRules: []
            };
            /* eslint-enable @typescript-eslint/naming-convention */

            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRulesResponse,
            } as Response);

            const callback1 = jest.fn();
            const callback2 = jest.fn();

            // First call - should load from server
            await getRules(callback1);

            // Second call - should NOT reload, uses cached rules
            await getRules(callback2);

            // Verify memoization: fetch called only once (not twice)
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith("/Pages/data/rules.json");

            // Both callbacks should still be invoked (even on cached path)
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);

            // Verify the rules are available in the singleton store
            expect(ruleStore.simpleRuleSet).toBeDefined();
            expect(ruleStore.andRuleSet).toBeDefined();
        });
    });

    describe("error handling", () => {
        test("should handle network fetch failures gracefully", async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            const completionCallback = jest.fn();

            await getRules(completionCallback);

            // Callback should still be invoked (graceful degradation)
            expect(completionCallback).toHaveBeenCalled();

            // Rules should remain empty after error
            expect(ruleStore.simpleRuleSet).toHaveLength(0);
            expect(ruleStore.andRuleSet).toHaveLength(0);
        });

        test("should handle HTTP error responses (404, 500, etc.)", async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: "Not Found"
            } as Response);

            const completionCallback = jest.fn();

            await getRules(completionCallback);

            // Callback should still be invoked
            expect(completionCallback).toHaveBeenCalled();

            // Rules should remain empty
            expect(ruleStore.simpleRuleSet).toHaveLength(0);
            expect(ruleStore.andRuleSet).toHaveLength(0);
        });

        test("should handle invalid JSON responses", async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error("Unexpected token < in JSON at position 0");
                }
            } as unknown as Response);

            const completionCallback = jest.fn();

            await getRules(completionCallback);

            // Callback should still be invoked
            expect(completionCallback).toHaveBeenCalled();

            // Rules should remain empty
            expect(ruleStore.simpleRuleSet).toHaveLength(0);
            expect(ruleStore.andRuleSet).toHaveLength(0);
        });

        test("should handle IsError response from server", async () => {
            /* eslint-disable @typescript-eslint/naming-convention */
            const mockErrorResponse = {
                IsError: true,
                Message: "Server-side validation failed",
                SimpleRules: [],
                AndRules: []
            };
            /* eslint-enable @typescript-eslint/naming-convention */

            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockErrorResponse,
            } as Response);

            const completionCallback = jest.fn();

            await getRules(completionCallback);

            // Callback should still be invoked (graceful degradation)
            expect(completionCallback).toHaveBeenCalled();

            // Rules should NOT be loaded when IsError is true
            expect(ruleStore.simpleRuleSet).toHaveLength(0);
            expect(ruleStore.andRuleSet).toHaveLength(0);
        });

        test("should handle missing Message field in error response", async () => {
            /* eslint-disable @typescript-eslint/naming-convention */
            const mockErrorResponse = {
                IsError: true,
                // Message field is missing
                SimpleRules: [],
                AndRules: []
            };
            /* eslint-enable @typescript-eslint/naming-convention */

            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockErrorResponse,
            } as Response);

            const completionCallback = jest.fn();

            await getRules(completionCallback);

            // Callback should still be invoked
            expect(completionCallback).toHaveBeenCalled();

            // Rules should remain empty
            expect(ruleStore.simpleRuleSet).toHaveLength(0);
            expect(ruleStore.andRuleSet).toHaveLength(0);
        });
    });
});
