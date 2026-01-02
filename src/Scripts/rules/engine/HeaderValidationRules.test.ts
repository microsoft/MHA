import { HeaderValidationRulesEngine, findSectionSubSection } from "./HeaderValidationRules";
import { AndValidationRule } from "../types/AndValidationRule";
import { HeaderSectionMissingRule } from "../types/HeaderSectionMissingRule";
import { HeaderSection } from "../types/interfaces";
import { SimpleValidationRule } from "../types/SimpleValidationRule";

describe("HeaderValidationRulesEngine", () => {
    let engine: HeaderValidationRulesEngine;

    beforeEach(() => {
        engine = new HeaderValidationRulesEngine();
    });

    describe("addRule", () => {
        test("should add simple validation rule", () => {
            const rule = new SimpleValidationRule("Subject", "spam", "Spam detected", "Subject", "error");
            engine.addRule(rule);

            const violations = engine.findViolations({ header: "Subject", value: "This is spam" });
            expect(violations).toHaveLength(1);
            expect(violations[0]).toBe(rule);
        });

        test("should add multiple rules", () => {
            const rule1 = new SimpleValidationRule("Subject", "spam", "Spam", "Subject", "error");
            const rule2 = new SimpleValidationRule("Subject", "urgent", "Urgent", "Subject", "warning");

            engine.addRule(rule1);
            engine.addRule(rule2);

            const violations = engine.findViolations({ header: "Subject", value: "spam urgent" });
            expect(violations).toHaveLength(2);
        });

        test("should add complex validation rule", () => {
            const rule = new HeaderSectionMissingRule("X-Custom", "Missing", "X-Custom", "error");
            engine.addRule(rule);

            const sections: HeaderSection[][] = [[{ header: "Subject", value: "Test" }]];
            engine.findComplexViolations(sections);
            // Complex rule added successfully (no error thrown)
        });
    });

    describe("findViolations", () => {
        test("should find violation when pattern matches", () => {
            const rule = new SimpleValidationRule(
                "Authentication-Results",
                "spf=fail",
                "SPF failed",
                "From",
                "error"
            );
            engine.addRule(rule);

            const violations = engine.findViolations({
                header: "Authentication-Results",
                value: "spf=fail action=quarantine"
            });

            expect(violations).toHaveLength(1);
            expect(violations[0]).toBe(rule);
        });

        test("should return empty array when no violations", () => {
            const rule = new SimpleValidationRule("Subject", "spam", "Spam", "Subject", "error");
            engine.addRule(rule);

            const violations = engine.findViolations({ header: "Subject", value: "Clean email" });
            expect(violations).toHaveLength(0);
        });

        test("should find multiple violations in same section", () => {
            const rule1 = new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:SPM", "Spam", "SFV", "error");
            const rule2 = new SimpleValidationRule("X-Forefront-Antispam-Report", "CTRY:NG", "Nigeria", "X-Forefront-Antispam-Report", "error");

            engine.addRule(rule1);
            engine.addRule(rule2);

            const violations = engine.findViolations({
                header: "X-Forefront-Antispam-Report",
                value: "SFV:SPM;CTRY:NG;CIP:1.2.3.4"
            });

            expect(violations).toHaveLength(2);
        });

        test("should only check simple rules, not complex rules", () => {
            const simpleRule = new SimpleValidationRule("Subject", "test", "Test", "Subject", "error");
            const complexRule = new HeaderSectionMissingRule("X-Custom", "Missing", "X-Custom", "error");

            engine.addRule(simpleRule);
            engine.addRule(complexRule);

            const violations = engine.findViolations({ header: "Subject", value: "test content" });
            expect(violations).toHaveLength(1);
            expect(violations[0]).toBe(simpleRule);
        });

        test("should not find violations for wrong section", () => {
            const rule = new SimpleValidationRule("Subject", "pattern", "Error", "Subject", "error");
            engine.addRule(rule);

            const violations = engine.findViolations({ header: "From", value: "pattern" });
            expect(violations).toHaveLength(0);
        });
    });

    describe("flagAllRowsWithViolations", () => {
        test("should flag sections that violate rules", () => {
            // TODO: Fix - engine state issue, rule not matching even though pattern should work
            const rule = new SimpleValidationRule(
                "Subject",
                "urgent",
                "Urgent keyword detected",
                "Subject",
                "warning"
            );
            engine.addRule(rule);

            const tabData: HeaderSection[] = [
                { header: "Subject", value: "urgent: Please read" }, // lowercase to match pattern
                { header: "From", value: "test@example.com" }
            ];
            const allSections: HeaderSection[][] = [tabData];

            engine.flagAllRowsWithViolations(tabData, allSections);

            expect(tabData[0]!.rulesFlagged).toBeDefined();
            expect(tabData[0]!.rulesFlagged).toHaveLength(1);
            expect(tabData[0]!.rulesFlagged![0]).toBe(rule);
            expect(tabData[1]!.rulesFlagged).toBeUndefined();
        });

        test("should flag multiple sections for one rule", () => {
            const rule = new SimpleValidationRule(
                "Authentication-Results",
                "spf=fail",
                "SPF failed",
                ["From", "Authentication-Results"],
                "error"
            );
            engine.addRule(rule);

            const tabData: HeaderSection[] = [
                { header: "Authentication-Results", value: "spf=fail" },
                { header: "From", value: "sender@example.com" }
            ];
            const allSections: HeaderSection[][] = [tabData];

            engine.flagAllRowsWithViolations(tabData, allSections);

            // Both sections should be flagged
            expect(tabData[0]!.rulesFlagged).toBeDefined();
            expect(tabData[1]!.rulesFlagged).toBeDefined();
            expect(tabData[0]!.rulesFlagged![0]).toBe(rule);
            expect(tabData[1]!.rulesFlagged![0]).toBe(rule);
        });

        test("should not flag sections that don't violate rules", () => {
            const rule = new SimpleValidationRule("Subject", "spam", "Spam", "Subject", "error");
            engine.addRule(rule);

            const tabData: HeaderSection[] = [
                { header: "Subject", value: "Clean email" }
            ];
            const allSections: HeaderSection[][] = [tabData];

            engine.flagAllRowsWithViolations(tabData, allSections);

            expect(tabData[0]!.rulesFlagged).toBeUndefined();
        });

        test("should flag sections across different tab arrays", () => {
            const rule = new SimpleValidationRule(
                "X-Forefront-Antispam-Report",
                "SFV:SPM",
                "Spam",
                ["SFV", "X-Forefront-Antispam-Report"],
                "error"
            );
            engine.addRule(rule);

            const tab1: HeaderSection[] = [
                { header: "X-Forefront-Antispam-Report", value: "SFV:SPM" }
            ];
            const tab2: HeaderSection[] = [
                { header: "SFV", value: "SPM" }
            ];
            const allSections: HeaderSection[][] = [tab1, tab2];

            engine.flagAllRowsWithViolations(tab1, allSections);

            expect(tab1[0]!.rulesFlagged).toBeDefined();
            expect(tab2[0]!.rulesFlagged).toBeDefined();
        });

        test("should handle multiple rules flagging same section", () => {
            const rule1 = new SimpleValidationRule("Subject", "urgent", "Urgent", "Subject", "warning");
            const rule2 = new SimpleValidationRule("Subject", "immediate", "Immediate", "Subject", "error");

            engine.addRule(rule1);
            engine.addRule(rule2);

            const tabData: HeaderSection[] = [
                { header: "Subject", value: "urgent immediate action required" }
            ];
            const allSections: HeaderSection[][] = [tabData];

            engine.flagAllRowsWithViolations(tabData, allSections);

            expect(tabData[0]!.rulesFlagged).toHaveLength(2);
        });

        test("should not add duplicate rules to rulesFlagged", () => {
            const rule = new SimpleValidationRule("Subject", "test", "Test", "Subject", "error");
            engine.addRule(rule);

            const tabData: HeaderSection[] = [
                { header: "Subject", value: "test" }
            ];
            const allSections: HeaderSection[][] = [tabData];

            // Flag twice
            engine.flagAllRowsWithViolations(tabData, allSections);
            engine.flagAllRowsWithViolations(tabData, allSections);

            // Should still only have one instance
            expect(tabData[0]!.rulesFlagged).toHaveLength(1);
        });
    });

    describe("findComplexViolations", () => {
        test("should detect missing header section", () => {
            const rule = new HeaderSectionMissingRule(
                "X-Forefront-Antispam-Report",
                "Missing antispam header",
                "X-Forefront-Antispam-Report",
                "error"
            );
            engine.addRule(rule);

            const sections: HeaderSection[][] = [
                [
                    { header: "Subject", value: "Test" },
                    { header: "From", value: "test@example.com" }
                ]
            ];

            // The X-Forefront-Antispam-Report section is missing
            engine.findComplexViolations(sections);

            // After processing, a placeholder section should be created with the violation flagged
            // The placeholder is added to the last section array
            const lastSection = sections[sections.length - 1];
            const placeholderSection = lastSection?.find(s => s.header === "X-Forefront-Antispam-Report");

            expect(placeholderSection).toBeDefined();
            expect(placeholderSection?.value).toBe("(missing)");
            expect(placeholderSection?.rulesFlagged).toBeDefined();
            expect(placeholderSection?.rulesFlagged).toHaveLength(1);
            expect(placeholderSection?.rulesFlagged?.[0]).toBe(rule);
        });

        test("should detect AND rule violations", () => {
            const subRule1 = new SimpleValidationRule(
                "X-Forefront-Antispam-Report",
                "SFV:SPM",
                "Spam",
                "SFV",
                "info"
            );
            const subRule2 = new SimpleValidationRule(
                "X-Microsoft-Antispam-Mailbox-Delivery",
                "dest:I",
                "Inbox",
                "X-Microsoft-Antispam-Mailbox-Delivery",
                "info"
            );
            const andRule = new AndValidationRule(
                "Spam to inbox",
                "SFV",
                "error",
                [subRule1, subRule2]
            );

            engine.addRule(andRule);

            const sections: HeaderSection[][] = [
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:SPM" },
                    { header: "SFV", value: "SPM" }
                ],
                [
                    { header: "X-Microsoft-Antispam-Mailbox-Delivery", value: "dest:I" }
                ]
            ];

            engine.findComplexViolations(sections);

            // SFV section should be flagged with sub-rules
            const sfvSection = sections[0]![1];
            expect(sfvSection!.rulesFlagged).toBeDefined();
            expect(sfvSection!.rulesFlagged!.length).toBeGreaterThan(0);

            // Check that sub-rules have parent AND rule information
            const flaggedRule = sfvSection!.rulesFlagged![0];
            expect(flaggedRule!.parentAndRule).toBeDefined();
            expect(flaggedRule!.parentAndRule!.message).toBe("Spam to inbox");
        });

        test("should not flag AND rule when conditions not met", () => {
            const subRule1 = new SimpleValidationRule(
                "X-Forefront-Antispam-Report",
                "SFV:SPM",
                "Spam",
                "SFV",
                "info"
            );
            const subRule2 = new SimpleValidationRule(
                "X-Microsoft-Antispam-Mailbox-Delivery",
                "dest:I",
                "Inbox",
                "X-Microsoft-Antispam-Mailbox-Delivery",
                "info"
            );
            const andRule = new AndValidationRule(
                "Spam to inbox",
                "SFV",
                "error",
                [subRule1, subRule2]
            );

            engine.addRule(andRule);

            const sections: HeaderSection[][] = [
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:NSPM" }, // Not spam
                    { header: "SFV", value: "NSPM" }
                ],
                [
                    { header: "X-Microsoft-Antispam-Mailbox-Delivery", value: "dest:I" }
                ]
            ];

            engine.findComplexViolations(sections);

            // SFV section should not be flagged
            expect(sections[0]![1]!.rulesFlagged).toBeUndefined();
        });

        test("should skip AND sub-rules with empty messages", () => {
            const subRule1 = new SimpleValidationRule("A", "p1", "", "A", "info"); // Empty message
            const subRule2 = new SimpleValidationRule("B", "p2", "Message 2", "B", "info");
            const andRule = new AndValidationRule("AND Rule", "A", "error", [subRule1, subRule2]);

            engine.addRule(andRule);

            const sections: HeaderSection[][] = [
                [
                    { header: "A", value: "contains p1" },
                    { header: "B", value: "contains p2" }
                ]
            ];

            engine.findComplexViolations(sections);

            // Only subRule2 should be flagged (subRule1 has empty message)
            expect(sections[0]![1]!.rulesFlagged).toBeDefined();
            expect(sections[0]![0]!.rulesFlagged).toBeUndefined();
        });
    });

    describe("setRules", () => {
        /* eslint-disable @typescript-eslint/naming-convention */
        test("should set rules from JSON data - SimpleRule", () => {
            const simpleRuleData = [
                {
                    RuleType: "SimpleRule" as const,
                    SectionToCheck: "Subject",
                    PatternToCheckFor: "spam",
                    MessageWhenPatternFails: "Spam detected",
                    SectionsInHeaderToShowError: ["Subject"],
                    Severity: "error" as const
                }
            ];

            engine.setRules(simpleRuleData, []);

            const violations = engine.findViolations({ header: "Subject", value: "This is spam" });
            expect(violations).toHaveLength(1);
            expect(violations[0]!.errorMessage).toBe("Spam detected");
        });

        test("should set rules from JSON data - HeaderMissingRule", () => {
            const missingRuleData = [
                {
                    RuleType: "HeaderMissingRule" as const,
                    SectionToCheck: "X-Custom-Header",
                    MessageWhenPatternFails: "Header missing",
                    SectionsInHeaderToShowError: ["X-Custom-Header"],
                    Severity: "warning" as const
                }
            ];

            engine.setRules(missingRuleData, []);

            const sections: HeaderSection[][] = [[{ header: "Subject", value: "Test" }]];
            engine.findComplexViolations(sections);
            // No error - rule loaded successfully
        });

        test("should set AND rules from JSON data", () => {
            const andRuleData = [
                {
                    Message: "Combined condition",
                    SectionsInHeaderToShowError: ["A"],
                    Severity: "error" as const,
                    RulesToAnd: [
                        {
                            RuleType: "SimpleRule" as const,
                            SectionToCheck: "A",
                            PatternToCheckFor: "p1",
                            MessageWhenPatternFails: "M1",
                            SectionsInHeaderToShowError: ["A"],
                            Severity: "info" as const
                        },
                        {
                            RuleType: "SimpleRule" as const,
                            SectionToCheck: "B",
                            PatternToCheckFor: "p2",
                            MessageWhenPatternFails: "M2",
                            SectionsInHeaderToShowError: ["B"],
                            Severity: "info" as const
                        }
                    ]
                }
            ];

            engine.setRules([], andRuleData);

            const sections: HeaderSection[][] = [
                [
                    { header: "A", value: "contains p1 text" },
                    { header: "B", value: "contains p2 text" }
                ]
            ];

            engine.findComplexViolations(sections);

            // Section A should be flagged with the sub-rules since both conditions are met
            const sectionA = sections[0]![0];
            expect(sectionA!.rulesFlagged).toBeDefined();
            expect(sectionA!.rulesFlagged!.length).toBeGreaterThan(0);

            // Check that sub-rule has parent AND rule information
            const flaggedRule = sectionA!.rulesFlagged![0];
            expect(flaggedRule!.parentAndRule).toBeDefined();
            expect(flaggedRule!.parentAndRule!.message).toBe("Combined condition");
        });

        test("should clear existing rules before setting new ones", () => {
            const rule1 = new SimpleValidationRule("A", "p", "m", "A", "error");
            engine.addRule(rule1);

            const newRuleData = [
                {
                    RuleType: "SimpleRule" as const,
                    SectionToCheck: "B",
                    PatternToCheckFor: "q",
                    MessageWhenPatternFails: "New rule",
                    SectionsInHeaderToShowError: ["B"],
                    Severity: "warning" as const
                }
            ];

            engine.setRules(newRuleData, []);

            // Old rule should be gone
            const violations1 = engine.findViolations({ header: "A", value: "p" });
            expect(violations1).toHaveLength(0);

            // New rule should work
            const violations2 = engine.findViolations({ header: "B", value: "q" });
            expect(violations2).toHaveLength(1);
        });

        test("should handle undefined simple rules", () => {
            engine.setRules(undefined, []);
            // Should not throw error
        });

        test("should handle undefined AND rules", () => {
            engine.setRules([], undefined);
            // Should not throw error
        });

        test("should handle PatternToCheckFor being undefined", () => {
            const ruleData = [
                {
                    RuleType: "SimpleRule" as const,
                    SectionToCheck: "Subject",
                    MessageWhenPatternFails: "Error",
                    SectionsInHeaderToShowError: ["Subject"],
                    Severity: "error" as const
                }
            ];

            engine.setRules(ruleData, []);
            // Should create rule with empty pattern
        });

        test("should skip invalid rule types", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ruleData: any[] = [
                {
                    RuleType: "InvalidType",
                    SectionToCheck: "Subject",
                    PatternToCheckFor: "pattern",
                    MessageWhenPatternFails: "Error",
                    SectionsInHeaderToShowError: ["Subject"],
                    Severity: "error" as const
                }
            ];

            engine.setRules(ruleData, []);

            const violations = engine.findViolations({ header: "Subject", value: "pattern" });
            expect(violations).toHaveLength(0);
        });
        /* eslint-enable @typescript-eslint/naming-convention */
    });
});

describe("findSectionSubSection", () => {
    test("should find section by header name", () => {
        const sections: HeaderSection[][] = [
            [
                { header: "Subject", value: "Test" },
                { header: "From", value: "test@example.com" }
            ],
            [
                { header: "To", value: "recipient@example.com" }
            ]
        ];

        const results = findSectionSubSection(sections, "From");
        expect(results).toHaveLength(1);
        expect(results[0]!.header).toBe("From");
        expect(results[0]!.value).toBe("test@example.com");
    });

    test("should find multiple sections with same header", () => {
        const sections: HeaderSection[][] = [
            [
                { header: "Received", value: "by server1" },
                { header: "Received", value: "by server2" }
            ],
            [
                { header: "Received", value: "by server3" }
            ]
        ];

        const results = findSectionSubSection(sections, "Received");
        expect(results).toHaveLength(3);
        expect(results[0]!.value).toBe("by server1");
        expect(results[1]!.value).toBe("by server2");
        expect(results[2]!.value).toBe("by server3");
    });

    test("should return empty array when section not found", () => {
        const sections: HeaderSection[][] = [
            [{ header: "Subject", value: "Test" }]
        ];

        const results = findSectionSubSection(sections, "NonExistent");
        expect(results).toHaveLength(0);
    });

    test("should handle empty sections array", () => {
        const sections: HeaderSection[][] = [];
        const results = findSectionSubSection(sections, "Subject");
        expect(results).toHaveLength(0);
    });

    test("should handle sections with empty sub-arrays", () => {
        const sections: HeaderSection[][] = [[], []];
        const results = findSectionSubSection(sections, "Subject");
        expect(results).toHaveLength(0);
    });

    test("should be case-sensitive", () => {
        const sections: HeaderSection[][] = [
            [
                { header: "Subject", value: "Test" },
                { header: "subject", value: "test" }
            ]
        ];

        const results = findSectionSubSection(sections, "Subject");
        expect(results).toHaveLength(1);
        expect(results[0]!.value).toBe("Test");
    });
});
