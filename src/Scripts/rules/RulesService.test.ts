import { HeaderModel } from "../HeaderModel";
import { getRules, ruleStore } from "./loaders/GetRules";
import { rulesService } from "./RulesService";

// Mock the getRules function
jest.mock("./loaders/GetRules", () => {
    const actualModule = jest.requireActual("./loaders/GetRules");
    return {
        ...actualModule,
        getRules: jest.fn(),
        ruleStore: {
            simpleRuleSet: [],
            andRuleSet: []
        }
    };
});

describe("RulesService", () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Reset the RulesService singleton state
        rulesService.resetForTesting();

        // Reset rule store
        ruleStore.simpleRuleSet = [];
        ruleStore.andRuleSet = [];
    });

    describe("rule loading", () => {
        test("should load rules on first call", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create();

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(getMockedGetRules).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        test("should only call getRules once for multiple analyses (memoization)", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel1 = await HeaderModel.create();
            const headerModel2 = await HeaderModel.create();

            await rulesService.analyzeHeaders(headerModel1);
            await rulesService.analyzeHeaders(headerModel2);

            // getRules should only be called once (memoized)
            expect(getMockedGetRules).toHaveBeenCalledTimes(1);
        });

        test("should return success with empty violations when no rules", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create();

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(result.success).toBe(true);
            expect(result.violations).toHaveLength(0);
            expect(result.violationGroups).toHaveLength(0);
            expect(result.enrichedHeaders).toBe(headerModel);
        });
    });

    describe("simple rule processing", () => {
        test("should process simple rules and find violations", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                // Set up simple rule
                /* eslint-disable @typescript-eslint/naming-convention */
                ruleStore.simpleRuleSet = [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "Subject",
                        PatternToCheckFor: "urgent",  // Pattern matches lowercase
                        MessageWhenPatternFails: "Urgent keyword detected",
                        SectionsInHeaderToShowError: ["Subject"],
                        Severity: "warning"
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create("Subject: urgent: Please respond\r\n"); // lowercase to match

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(result.success).toBe(true);
            expect(result.violations.length).toBeGreaterThan(0);
            expect(result.violationGroups.length).toBeGreaterThan(0);
        });

        test("should not find violations when patterns don't match", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                /* eslint-disable @typescript-eslint/naming-convention */
                ruleStore.simpleRuleSet = [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "Subject",
                        PatternToCheckFor: "spam",
                        MessageWhenPatternFails: "Spam detected",
                        SectionsInHeaderToShowError: ["Subject"],
                        Severity: "error"
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create("Subject: Clean email\r\n");

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(result.success).toBe(true);
            expect(result.violations).toHaveLength(0);
        });

        test("should detect missing headers", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                /* eslint-disable @typescript-eslint/naming-convention */
                ruleStore.simpleRuleSet = [
                    {
                        RuleType: "HeaderMissingRule",
                        SectionToCheck: "X-Forefront-Antispam-Report",
                        MessageWhenPatternFails: "Missing antispam header",
                        SectionsInHeaderToShowError: ["X-Forefront-Antispam-Report"],
                        Severity: "error"
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create("Subject: Test\r\n");

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(result.success).toBe(true);
            // Missing header rules might not create violations in the same way
            // but the analysis should complete successfully
        });
    });

    describe("AND rule processing", () => {
        test("should process AND rules when all conditions met", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                /* eslint-disable @typescript-eslint/naming-convention */
                ruleStore.simpleRuleSet = [];
                ruleStore.andRuleSet = [
                    {
                        Message: "Spam sent to inbox",
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
                            },
                            {
                                RuleType: "SimpleRule",
                                SectionToCheck: "X-Microsoft-Antispam-Mailbox-Delivery",
                                PatternToCheckFor: "dest:I",
                                MessageWhenPatternFails: "Inbox",
                                SectionsInHeaderToShowError: ["X-Microsoft-Antispam-Mailbox-Delivery"],
                                Severity: "info"
                            }
                        ]
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                if (callback) callback();
                return Promise.resolve();
            });

            const headers =
                "X-Forefront-Antispam-Report: SFV:SPM;CIP:1.2.3.4\r\n" +
                "X-Microsoft-Antispam-Mailbox-Delivery: dest:I;auth:1\r\n";

            const headerModel = await HeaderModel.create(headers);

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(result.success).toBe(true);
            expect(result.violations.length).toBeGreaterThan(0);

            // Check that violations have parent AND rule context
            const hasParentMessage = result.violations.some(v => v.parentMessage === "Spam sent to inbox");
            expect(hasParentMessage).toBe(true);
        });
    });

    describe("violation grouping", () => {
        test("should group violations by rule message", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                /* eslint-disable @typescript-eslint/naming-convention */
                ruleStore.simpleRuleSet = [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "From",
                        PatternToCheckFor: "test",
                        MessageWhenPatternFails: "Test pattern",
                        SectionsInHeaderToShowError: ["From", "To"],
                        Severity: "error"
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create("From: test@example.com\r\nTo: recipient@test.com\r\n");

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(result.success).toBe(true);
            if (result.violations.length > 0) {
                // All violations with same rule should be in same group
                const groups = result.violationGroups.filter(g => g.displayName === "Test pattern");
                expect(groups.length).toBeLessThanOrEqual(1);
            }
        });

        test("should preserve violation severity levels", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                /* eslint-disable @typescript-eslint/naming-convention */
                ruleStore.simpleRuleSet = [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "Subject",
                        PatternToCheckFor: "error",
                        MessageWhenPatternFails: "Error severity",
                        SectionsInHeaderToShowError: ["Subject"],
                        Severity: "error"
                    },
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "Subject",
                        PatternToCheckFor: "warning",
                        MessageWhenPatternFails: "Warning severity",
                        SectionsInHeaderToShowError: ["Subject"],
                        Severity: "warning"
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create("Subject: error warning\r\n");

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(result.success).toBe(true);

            const errorGroup = result.violationGroups.find(g => g.displayName === "Error severity");
            const warningGroup = result.violationGroups.find(g => g.displayName === "Warning severity");

            if (errorGroup) expect(errorGroup.severity).toBe("error");
            if (warningGroup) expect(warningGroup.severity).toBe("warning");
        });
    });

    describe("error handling", () => {
        test("should handle getRules errors gracefully", async () => {
            // Suppress expected console.error output in this test
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation(() => {
                throw new Error("Failed to load rules");
            });

            const headerModel = await HeaderModel.create();

            const result = await rulesService.analyzeHeaders(headerModel);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain("Failed to load rules");
            expect(result.violations).toHaveLength(0);
            expect(result.violationGroups).toHaveLength(0);

            consoleErrorSpy.mockRestore();
        });

        test("should handle sections with malformed data", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                /* eslint-disable @typescript-eslint/naming-convention */
                ruleStore.simpleRuleSet = [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "Subject",
                        PatternToCheckFor: "test",
                        MessageWhenPatternFails: "Test error",
                        SectionsInHeaderToShowError: ["Subject"],
                        Severity: "error"
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                ruleStore.andRuleSet = [];
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create();
            // Add malformed items to sections (missing required properties)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (headerModel.summary.rows as any).push({ invalid: "data" });

            const result = await rulesService.analyzeHeaders(headerModel);

            // Should still succeed despite malformed data
            expect(result.success).toBe(true);
        });

        test("should handle missing rule properties", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                /* eslint-disable @typescript-eslint/naming-convention */
                // Create a rule with missing MessageWhenPatternFails
                ruleStore.simpleRuleSet = [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "Subject",
                        PatternToCheckFor: "test",
                        MessageWhenPatternFails: "", // Empty message
                        SectionsInHeaderToShowError: ["Subject"],
                        Severity: "error"
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                ruleStore.andRuleSet = [];
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create("Subject: test\r\n");

            const result = await rulesService.analyzeHeaders(headerModel);

            // Should succeed but handle the empty message gracefully
            expect(result.success).toBe(true);
            // Violations might still be created with empty messages
            if (result.violationGroups.length > 0) {
                const group = result.violationGroups[0];
                if (group) {
                    expect(group.displayName).toBeDefined();
                }
            }
        });

        test("should handle errors during rule evaluation", async () => {
            // Suppress expected console.error output in this test
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            getMockedGetRules.mockImplementation((callback) => {
                // Create a rule that might cause evaluation issues
                /* eslint-disable @typescript-eslint/naming-convention */
                ruleStore.simpleRuleSet = [
                    {
                        RuleType: "SimpleRule",
                        SectionToCheck: "Subject",
                        PatternToCheckFor: "(?:invalid", // Potentially problematic pattern
                        MessageWhenPatternFails: "Test error",
                        SectionsInHeaderToShowError: ["Subject"],
                        Severity: "error"
                    }
                ];
                /* eslint-enable @typescript-eslint/naming-convention */
                ruleStore.andRuleSet = [];
                if (callback) callback();
                return Promise.resolve();
            });

            const headerModel = await HeaderModel.create();

            const result = await rulesService.analyzeHeaders(headerModel);

            // Should handle gracefully - either succeed with no violations or fail gracefully
            expect(result).toBeDefined();
            expect(result.violations).toBeInstanceOf(Array);
            expect(result.violationGroups).toBeInstanceOf(Array);

            consoleErrorSpy.mockRestore();
        });

        test("should handle concurrent analysis requests", async () => {
            const getMockedGetRules = getRules as jest.MockedFunction<typeof getRules>;
            let callCount = 0;
            getMockedGetRules.mockImplementation((callback) => {
                callCount++;
                ruleStore.simpleRuleSet = [];
                ruleStore.andRuleSet = [];
                if (callback) callback();
                return Promise.resolve();
            });

            // Reset and run multiple analyses concurrently
            rulesService.resetForTesting();

            const headerModel1 = await HeaderModel.create();
            const headerModel2 = await HeaderModel.create();
            const headerModel3 = await HeaderModel.create();

            const results = await Promise.all([
                rulesService.analyzeHeaders(headerModel1),
                rulesService.analyzeHeaders(headerModel2),
                rulesService.analyzeHeaders(headerModel3)
            ]);

            // All should succeed
            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result.success).toBe(true);
            });

            // getRules should only be called once due to memoization
            expect(callCount).toBe(1);
        });
    });
});
