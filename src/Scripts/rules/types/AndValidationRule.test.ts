import { AndValidationRule, andValidationRuleClassFunction } from "./AndValidationRule";
import { HeaderSection } from "./interfaces";
import { SimpleValidationRule } from "./SimpleValidationRule";

describe("AndValidationRule", () => {
    describe("constructor", () => {
        test("should create rule with single reporting section string", () => {
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

            const rule = new AndValidationRule(
                "Email filtered as spam but sent to inbox",
                "SFV",
                "error",
                [subRule1, subRule2]
            );

            expect(rule.errorMessage).toBe("Email filtered as spam but sent to inbox");
            expect(rule.errorReportingSection).toEqual(["SFV"]);
            expect(rule.severity).toBe("error");
            expect(rule.rulesToAndArray).toHaveLength(2);
            expect(rule.primaryRule).toBe(true);
            expect(rule.checkSection).toBe("");
            expect(rule.ruleNumber).toBe(0);
        });

        test("should create rule with array of reporting sections", () => {
            const subRule = new SimpleValidationRule("A", "p", "m", "A", "info");

            const rule = new AndValidationRule(
                "Complex rule",
                ["From", "To", "Subject"],
                "warning",
                [subRule]
            );

            expect(rule.errorReportingSection).toEqual(["From", "To", "Subject"]);
        });

        test("should mark sub-rules as non-primary", () => {
            const subRule1 = new SimpleValidationRule("A", "p1", "m1", "A", "info");
            const subRule2 = new SimpleValidationRule("B", "p2", "m2", "B", "info");

            expect(subRule1.primaryRule).toBe(true);
            expect(subRule2.primaryRule).toBe(true);

            new AndValidationRule("And rule", "A", "error", [subRule1, subRule2]);

            expect(subRule1.primaryRule).toBe(false);
            expect(subRule2.primaryRule).toBe(false);
        });

        test("should compose error pattern from sub-rules", () => {
            const subRule1 = new SimpleValidationRule("A", "pattern1", "m", "A", "info");
            const subRule2 = new SimpleValidationRule("B", "pattern2", "m", "B", "info");
            const subRule3 = new SimpleValidationRule("C", "pattern3", "m", "C", "info");

            const rule = new AndValidationRule(
                "Combined rule",
                "A",
                "error",
                [subRule1, subRule2, subRule3]
            );

            expect(rule.errorPattern).toBe("pattern1|pattern2|pattern3");
        });

        test("should handle single sub-rule", () => {
            const subRule = new SimpleValidationRule("A", "pattern", "m", "A", "info");

            const rule = new AndValidationRule("Single rule", "A", "error", [subRule]);

            expect(rule.errorPattern).toBe("pattern");
            expect(rule.rulesToAndArray).toHaveLength(1);
        });

        test("should handle empty sub-rules array", () => {
            const rule = new AndValidationRule("Empty rule", "A", "error", []);

            expect(rule.errorPattern).toBe("");
            expect(rule.rulesToAndArray).toHaveLength(0);
        });
    });

    describe("violatesComplexRule", () => {
        test("should return true when all sub-rules match", () => {
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

            const rule = new AndValidationRule(
                "Spam sent to inbox",
                "SFV",
                "error",
                [subRule1, subRule2]
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:SPM;CIP:1.2.3.4" }
                ],
                [
                    { header: "X-Microsoft-Antispam-Mailbox-Delivery", value: "dest:I;auth:1" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(true);
        });

        test("should return false when first sub-rule does not match", () => {
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

            const rule = new AndValidationRule(
                "Spam sent to inbox",
                "SFV",
                "error",
                [subRule1, subRule2]
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:NSPM;CIP:1.2.3.4" } // Not spam
                ],
                [
                    { header: "X-Microsoft-Antispam-Mailbox-Delivery", value: "dest:I;auth:1" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });

        test("should return false when second sub-rule does not match", () => {
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

            const rule = new AndValidationRule(
                "Spam sent to inbox",
                "SFV",
                "error",
                [subRule1, subRule2]
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:SPM;CIP:1.2.3.4" }
                ],
                [
                    { header: "X-Microsoft-Antispam-Mailbox-Delivery", value: "dest:J;auth:1" } // Not inbox
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });

        test("should return false when section to check is missing", () => {
            const subRule1 = new SimpleValidationRule(
                "X-Forefront-Antispam-Report",
                "SFV:SPM",
                "Spam",
                "SFV",
                "info"
            );
            const subRule2 = new SimpleValidationRule(
                "X-Missing-Header",
                "value",
                "Missing",
                "X-Missing-Header",
                "info"
            );

            const rule = new AndValidationRule(
                "Rule with missing section",
                "SFV",
                "error",
                [subRule1, subRule2]
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:SPM;CIP:1.2.3.4" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });

        test("should handle three sub-rules (all must match)", () => {
            const subRule1 = new SimpleValidationRule("A", "pattern1", "m1", "A", "info");
            const subRule2 = new SimpleValidationRule("B", "pattern2", "m2", "B", "info");
            const subRule3 = new SimpleValidationRule("C", "pattern3", "m3", "C", "info");

            const rule = new AndValidationRule("Triple AND", "A", "error", [subRule1, subRule2, subRule3]);

            const sections: HeaderSection[][] = [
                [
                    { header: "A", value: "contains pattern1 here" },
                    { header: "B", value: "contains pattern2 here" },
                    { header: "C", value: "contains pattern3 here" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(true);
        });

        test("should fail three sub-rules if one does not match", () => {
            const subRule1 = new SimpleValidationRule("A", "pattern1", "m1", "A", "info");
            const subRule2 = new SimpleValidationRule("B", "pattern2", "m2", "B", "info");
            const subRule3 = new SimpleValidationRule("C", "pattern3", "m3", "C", "info");

            const rule = new AndValidationRule("Triple AND", "A", "error", [subRule1, subRule2, subRule3]);

            const sections: HeaderSection[][] = [
                [
                    { header: "A", value: "contains pattern1 here" },
                    { header: "B", value: "no match here" }, // This one doesn't match
                    { header: "C", value: "contains pattern3 here" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });

        test("should handle sections across multiple arrays", () => {
            const subRule1 = new SimpleValidationRule("Subject", "urgent", "m1", "Subject", "info");
            const subRule2 = new SimpleValidationRule("From", "suspicious", "m2", "From", "info");

            const rule = new AndValidationRule("Urgent from suspicious", "Subject", "error", [subRule1, subRule2]);

            const sections: HeaderSection[][] = [
                [
                    { header: "Subject", value: "urgent: Please respond" } // lowercase to match pattern
                ],
                [
                    { header: "From", value: "suspicious@example.com" } // lowercase to match pattern
                ],
                [
                    { header: "To", value: "victim@example.com" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(true);
        });

        test("should handle empty sections array", () => {
            const subRule = new SimpleValidationRule("A", "pattern", "m", "A", "info");
            const rule = new AndValidationRule("Empty", "A", "error", [subRule]);

            const sections: HeaderSection[][] = [];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });

        test("should short-circuit on first false condition", () => {
            const subRule1 = new SimpleValidationRule("A", "pattern1", "m1", "A", "info");
            const subRule2 = new SimpleValidationRule("B", "pattern2", "m2", "B", "info");

            const rule = new AndValidationRule("Short circuit", "A", "error", [subRule1, subRule2]);

            const sections: HeaderSection[][] = [
                [
                    { header: "A", value: "no match" }, // First fails
                    { header: "B", value: "contains pattern2" }
                ]
            ];

            // Should return false immediately after first rule fails
            expect(rule.violatesComplexRule(sections)).toBe(false);
        });
    });

    describe("severity levels", () => {
        test("should support error severity", () => {
            const subRule = new SimpleValidationRule("A", "p", "m", "A", "info");
            const rule = new AndValidationRule("Rule", "A", "error", [subRule]);
            expect(rule.severity).toBe("error");
        });

        test("should support warning severity", () => {
            const subRule = new SimpleValidationRule("A", "p", "m", "A", "info");
            const rule = new AndValidationRule("Rule", "A", "warning", [subRule]);
            expect(rule.severity).toBe("warning");
        });

        test("should support info severity", () => {
            const subRule = new SimpleValidationRule("A", "p", "m", "A", "info");
            const rule = new AndValidationRule("Rule", "A", "info", [subRule]);
            expect(rule.severity).toBe("info");
        });
    });

    describe("real-world scenarios", () => {
        test("should detect spam delivered to inbox (from rules.json)", () => {
            const subRule1 = new SimpleValidationRule(
                "X-Forefront-Antispam-Report",
                "SFV:SPM",
                "Email Spam",
                ["X-Forefront-Antispam-Report"],
                "info"
            );
            const subRule2 = new SimpleValidationRule(
                "X-Microsoft-Antispam-Mailbox-Delivery",
                "dest:I",
                "Delivered to Inbox",
                ["X-Microsoft-Antispam-Mailbox-Delivery"],
                "info"
            );

            const rule = new AndValidationRule(
                "Email filtered as spam but sent to inbox",
                ["SFV"],
                "error",
                [subRule1, subRule2]
            );

            const spamToInbox: HeaderSection[][] = [
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:SPM;CIP:255.255.255.0" }
                ],
                [
                    { header: "X-Microsoft-Antispam-Mailbox-Delivery", value: "dest:I;auth:1;wl:0" }
                ]
            ];

            expect(rule.violatesComplexRule(spamToInbox)).toBe(true);

            const spamToJunk: HeaderSection[][] = [
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:SPM;CIP:255.255.255.0" }
                ],
                [
                    { header: "X-Microsoft-Antispam-Mailbox-Delivery", value: "dest:J;auth:1;wl:0" }
                ]
            ];

            expect(rule.violatesComplexRule(spamToJunk)).toBe(false);
        });
    });
});

describe("andValidationRuleClassFunction", () => {
    test("should create AndValidationRule instance", () => {
        const subRule = new SimpleValidationRule("A", "p", "m", "A", "info");

        const rule = andValidationRuleClassFunction("Message", "A", "error", [subRule]);

        expect(rule).toBeInstanceOf(AndValidationRule);
        expect(rule.errorMessage).toBe("Message");
    });
});
