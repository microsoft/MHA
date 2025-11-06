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
            getRules(completionCallback);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

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
            getRules(completionCallback);

            await new Promise(resolve => setTimeout(resolve, 100));

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

            getRules(); // No callback provided

            await new Promise(resolve => setTimeout(resolve, 100));

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

            getRules();

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(ruleStore.simpleRuleSet).toHaveLength(1);
            expect(ruleStore.simpleRuleSet[0]!.SectionToCheck).toBe("New");
        });

        test("should handle multiple calls (memoization)", async () => {
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

            // First call
            getRules(callback1);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Second call (should use cached rules)
            getRules(callback2);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Fetch should only be called once
            expect(mockFetch).toHaveBeenCalledTimes(1);
            // Both callbacks should be called
            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });
    });
});
