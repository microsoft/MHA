import { SimpleValidationRule } from "./SimpleValidationRule";

describe("SimpleValidationRule", () => {
    describe("constructor", () => {
        test("should create rule with single reporting section string", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "test.*pattern",
                "Error message",
                "Subject",
                "error"
            );

            expect(rule.checkSection).toBe("Subject");
            expect(rule.errorPattern).toBe("test.*pattern");
            expect(rule.errorMessage).toBe("Error message");
            expect(rule.errorReportingSection).toEqual(["Subject"]);
            expect(rule.severity).toBe("error");
            expect(rule.primaryRule).toBe(true);
            expect(rule.ruleNumber).toBeGreaterThan(0);
        });

        test("should create rule with array of reporting sections", () => {
            const rule = new SimpleValidationRule(
                "From",
                "pattern",
                "Error",
                ["From", "To", "Subject"],
                "warning"
            );

            expect(rule.errorReportingSection).toEqual(["From", "To", "Subject"]);
            expect(rule.severity).toBe("warning");
        });

        test("should handle empty error message", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "pattern",
                "",
                "Subject",
                "info"
            );

            expect(rule.errorMessage).toBe("");
        });

        test("should handle empty reporting section", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "pattern",
                "Error",
                "",
                "error"
            );

            expect(rule.errorReportingSection).toEqual([]);
        });

        test("should assign unique rule numbers", () => {
            const rule1 = new SimpleValidationRule("A", "p", "m", "A", "error");
            const rule2 = new SimpleValidationRule("B", "p", "m", "B", "error");
            const rule3 = new SimpleValidationRule("C", "p", "m", "C", "error");

            expect(rule1.ruleNumber).not.toBe(rule2.ruleNumber);
            expect(rule2.ruleNumber).not.toBe(rule3.ruleNumber);
            expect(rule1.ruleNumber).not.toBe(rule3.ruleNumber);
        });
    });

    describe("violatesRule", () => {
        test("should return match when section and pattern match", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "spam|phishing",
                "Suspicious content",
                "Subject",
                "error"
            );

            const result = rule.violatesRule({ header: "Subject", value: "This is a spam email" });
            expect(result).toBe("spam");
        });

        test("should return match with regex pattern", () => {
            const rule = new SimpleValidationRule(
                "Authentication-Results",
                "spf=fail",
                "SPF failed",
                "From",
                "error"
            );

            const result = rule.violatesRule({
                header: "Authentication-Results",
                value: "spf=fail action=quarantine"
            });
            expect(result).toBe("spf=fail");
        });

        test("should return null when section does not match", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "spam",
                "Error",
                "Subject",
                "error"
            );

            const result = rule.violatesRule({ header: "From", value: "This contains spam" });
            expect(result).toBeNull();
        });

        test("should return null when pattern does not match", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "spam",
                "Error",
                "Subject",
                "error"
            );

            const result = rule.violatesRule({ header: "Subject", value: "This is a clean email" });
            expect(result).toBeNull();
        });

        test("should handle complex regex patterns", () => {
            const rule = new SimpleValidationRule(
                "X-Microsoft-Antispam",
                "BCL:[6-9]",
                "Bad BCL",
                "BCL",
                "error"
            );

            expect(rule.violatesRule({ header: "X-Microsoft-Antispam", value: "BCL:7" })).toBe("BCL:7");
            expect(rule.violatesRule({ header: "X-Microsoft-Antispam", value: "BCL:9" })).toBe("BCL:9");
            expect(rule.violatesRule({ header: "X-Microsoft-Antispam", value: "BCL:5" })).toBeNull();
        });

        test("should handle alternation patterns", () => {
            const rule = new SimpleValidationRule(
                "X-Forefront-Antispam-Report",
                "SFV:SPM|SFV:BLK|SFV:SKI",
                "Special SFV value",
                "SFV",
                "info"
            );

            expect(rule.violatesRule({ header: "X-Forefront-Antispam-Report", value: "SFV:SPM;other:data" })).toBe("SFV:SPM");
            expect(rule.violatesRule({ header: "X-Forefront-Antispam-Report", value: "SFV:BLK;other:data" })).toBe("SFV:BLK");
            expect(rule.violatesRule({ header: "X-Forefront-Antispam-Report", value: "SFV:SKI;other:data" })).toBe("SFV:SKI");
            expect(rule.violatesRule({ header: "X-Forefront-Antispam-Report", value: "SFV:NSPM" })).toBeNull();
        });

        test("should handle wildcard patterns", () => {
            const rule = new SimpleValidationRule(
                "Authentication-Results",
                "dkim=fail.*",
                "DKIM failed",
                "From",
                "error"
            );

            const result = rule.violatesRule({
                header: "Authentication-Results",
                value: "dkim=fail reason=signature_invalid"
            });
            expect(result).toBeTruthy();
            expect(result).toContain("dkim=fail");
        });

        test("should handle empty pattern", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "",
                "Error",
                "Subject",
                "error"
            );

            // Empty pattern should match empty string
            expect(rule.violatesRule({ header: "Subject", value: "" })).toBe("");
        });

        test("should be case-sensitive by default", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "SPAM",
                "Error",
                "Subject",
                "error"
            );

            // Default regex is case-sensitive
            expect(rule.violatesRule({ header: "Subject", value: "spam" })).toBeNull();
            expect(rule.violatesRule({ header: "Subject", value: "SPAM" })).toBe("SPAM");
        });

        test("should handle country code patterns", () => {
            const rule = new SimpleValidationRule(
                "X-Forefront-Antispam-Report",
                "CTRY:NG",
                "Nigeria origin",
                "X-Forefront-Antispam-Report",
                "error"
            );

            expect(rule.violatesRule({
                header: "X-Forefront-Antispam-Report",
                value: "CIP:255.255.255.0;CTRY:NG;LANG:en"
            })).toBe("CTRY:NG");
        });

        test("should return first match of pattern", () => {
            const rule = new SimpleValidationRule(
                "Subject",
                "test",
                "Error",
                "Subject",
                "error"
            );

            const result = rule.violatesRule({ header: "Subject", value: "test test test" });
            expect(result).toBe("test");
        });

        test("should match by headerName when header doesn't match", () => {
            const rule = new SimpleValidationRule(
                "X-Forefront-Antispam-Report",
                "SFV:SPM",
                "Spam detected",
                "SFV",
                "error"
            );

            // Row with header="source" but headerName="X-Forefront-Antispam-Report"
            const result = rule.violatesRule({
                header: "source",
                value: "SFV:SPM;CIP:1.2.3.4",
                headerName: "X-Forefront-Antispam-Report"
            });
            expect(result).toBe("SFV:SPM");
        });
    });

    describe("severity levels", () => {
        test("should support error severity", () => {
            const rule = new SimpleValidationRule("A", "p", "m", "A", "error");
            expect(rule.severity).toBe("error");
        });

        test("should support warning severity", () => {
            const rule = new SimpleValidationRule("A", "p", "m", "A", "warning");
            expect(rule.severity).toBe("warning");
        });

        test("should support info severity", () => {
            const rule = new SimpleValidationRule("A", "p", "m", "A", "info");
            expect(rule.severity).toBe("info");
        });
    });
});
