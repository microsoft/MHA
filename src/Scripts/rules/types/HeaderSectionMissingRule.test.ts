import { HeaderSectionMissingRule } from "./HeaderSectionMissingRule";
import { HeaderSection } from "./interfaces";

describe("HeaderSectionMissingRule", () => {
    describe("constructor", () => {
        test("should create rule with single reporting section string", () => {
            const rule = new HeaderSectionMissingRule(
                "X-Forefront-Antispam-Report",
                "Section missing from header",
                "X-Forefront-Antispam-Report",
                "error"
            );

            expect(rule.checkSection).toBe("X-Forefront-Antispam-Report");
            expect(rule.errorMessage).toBe("Section missing from header");
            expect(rule.errorReportingSection).toEqual(["X-Forefront-Antispam-Report"]);
            expect(rule.severity).toBe("error");
            expect(rule.primaryRule).toBe(true);
            expect(rule.ruleNumber).toBeGreaterThan(0);
            expect(rule.errorPattern).toBe("");
        });

        test("should create rule with array of reporting sections", () => {
            const rule = new HeaderSectionMissingRule(
                "Authentication-Results",
                "Auth section missing",
                ["From", "Authentication-Results"],
                "warning"
            );

            expect(rule.errorReportingSection).toEqual(["From", "Authentication-Results"]);
            expect(rule.severity).toBe("warning");
        });

        test("should handle empty error message", () => {
            const rule = new HeaderSectionMissingRule(
                "Subject",
                "",
                "Subject",
                "info"
            );

            expect(rule.errorMessage).toBe("");
        });

        test("should handle empty reporting section", () => {
            const rule = new HeaderSectionMissingRule(
                "Subject",
                "Missing",
                "",
                "error"
            );

            expect(rule.errorReportingSection).toEqual([]);
        });

        test("should assign unique rule numbers", () => {
            const rule1 = new HeaderSectionMissingRule("A", "m", "A", "error");
            const rule2 = new HeaderSectionMissingRule("B", "m", "B", "error");
            const rule3 = new HeaderSectionMissingRule("C", "m", "C", "error");

            expect(rule1.ruleNumber).not.toBe(rule2.ruleNumber);
            expect(rule2.ruleNumber).not.toBe(rule3.ruleNumber);
            expect(rule1.ruleNumber).not.toBe(rule3.ruleNumber);
        });
    });

    describe("violatesComplexRule", () => {
        test("should return true when section is missing", () => {
            const rule = new HeaderSectionMissingRule(
                "X-Forefront-Antispam-Report",
                "Missing antispam header",
                "X-Forefront-Antispam-Report",
                "error"
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "Subject", value: "Test" },
                    { header: "From", value: "test@example.com" }
                ],
                [
                    { header: "To", value: "recipient@example.com" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(true);
        });

        test("should return false when section is present", () => {
            const rule = new HeaderSectionMissingRule(
                "X-Forefront-Antispam-Report",
                "Missing antispam header",
                "X-Forefront-Antispam-Report",
                "error"
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "Subject", value: "Test" },
                    { header: "X-Forefront-Antispam-Report", value: "SFV:NSPM" }
                ],
                [
                    { header: "From", value: "test@example.com" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });

        test("should return false when section appears multiple times", () => {
            const rule = new HeaderSectionMissingRule(
                "Received",
                "Missing received header",
                "Received",
                "error"
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "Received", value: "by server1" },
                    { header: "Received", value: "by server2" },
                    { header: "Subject", value: "Test" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });

        test("should check across all section arrays", () => {
            const rule = new HeaderSectionMissingRule(
                "X-Custom-Header",
                "Missing custom header",
                "X-Custom-Header",
                "warning"
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "Subject", value: "Test" }
                ],
                [
                    { header: "From", value: "test@example.com" }
                ],
                [
                    { header: "X-Custom-Header", value: "CustomValue" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });

        test("should handle empty sections array", () => {
            const rule = new HeaderSectionMissingRule(
                "Subject",
                "Missing subject",
                "Subject",
                "error"
            );

            const sections: HeaderSection[][] = [];

            expect(rule.violatesComplexRule(sections)).toBe(true);
        });

        test("should handle sections with empty sub-arrays", () => {
            const rule = new HeaderSectionMissingRule(
                "Subject",
                "Missing subject",
                "Subject",
                "error"
            );

            const sections: HeaderSection[][] = [[], [], []];

            expect(rule.violatesComplexRule(sections)).toBe(true);
        });

        test("should be case-sensitive for section names", () => {
            const rule = new HeaderSectionMissingRule(
                "Subject",
                "Missing subject",
                "Subject",
                "error"
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "subject", value: "Test" }, // lowercase
                    { header: "SUBJECT", value: "Test" }  // uppercase
                ]
            ];

            // Should not find "Subject" (exact case)
            expect(rule.violatesComplexRule(sections)).toBe(true);
        });

        test("should handle sections with additional properties", () => {
            const rule = new HeaderSectionMissingRule(
                "From",
                "Missing from",
                "From",
                "error"
            );

            const sections: HeaderSection[][] = [
                [
                    {
                        header: "From",
                        value: "test@example.com",
                        label: "From",
                        url: "mailto:test@example.com"
                    }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });
    });

    describe("severity levels", () => {
        test("should support error severity", () => {
            const rule = new HeaderSectionMissingRule("A", "m", "A", "error");
            expect(rule.severity).toBe("error");
        });

        test("should support warning severity", () => {
            const rule = new HeaderSectionMissingRule("A", "m", "A", "warning");
            expect(rule.severity).toBe("warning");
        });

        test("should support info severity", () => {
            const rule = new HeaderSectionMissingRule("A", "m", "A", "info");
            expect(rule.severity).toBe("info");
        });
    });

    describe("real-world scenarios", () => {
        test("should detect missing X-Microsoft-Antispam-Mailbox-Delivery", () => {
            const rule = new HeaderSectionMissingRule(
                "X-Microsoft-Antispam-Mailbox-Delivery",
                "Section 'X-Microsoft-Antispam-Mailbox-Delivery' missing from email header",
                ["X-Microsoft-Antispam-Mailbox-Delivery"],
                "error"
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "Subject", value: "Test Email" },
                    { header: "From", value: "sender@example.com" }
                ],
                [
                    { header: "X-Forefront-Antispam-Report", value: "SFV:NSPM" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(true);
        });

        test("should pass when X-Microsoft-Antispam-Mailbox-Delivery is present", () => {
            const rule = new HeaderSectionMissingRule(
                "X-Microsoft-Antispam-Mailbox-Delivery",
                "Section 'X-Microsoft-Antispam-Mailbox-Delivery' missing from email header",
                ["X-Microsoft-Antispam-Mailbox-Delivery"],
                "error"
            );

            const sections: HeaderSection[][] = [
                [
                    { header: "Subject", value: "Test Email" }
                ],
                [
                    { header: "X-Microsoft-Antispam-Mailbox-Delivery", value: "abwl:0;wl:0;" }
                ]
            ];

            expect(rule.violatesComplexRule(sections)).toBe(false);
        });
    });
});
