import { RuleViolation, ViolationGroup } from "./types/AnalysisTypes";
import { HeaderSection } from "./types/interfaces";
import { SimpleValidationRule } from "./types/SimpleValidationRule";
import { escapeAndHighlight, getViolationsForRow, highlightHtml } from "./ViolationUtils";

describe("escapeAndHighlight", () => {
    test("should return original content when no violation groups", () => {
        const content = "This is test content";
        const result = escapeAndHighlight(content, []);
        expect(result).toBe(content);
    });

    test("should return original content when content is empty", () => {
        const result = escapeAndHighlight("", []);
        expect(result).toBe("");
    });

    test("should return original content when violationGroups is undefined", () => {
        const content = "Test content";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = escapeAndHighlight(content, undefined as any);
        expect(result).toBe(content);
    });

    test("should highlight single pattern match", () => {
        const rule = new SimpleValidationRule("Subject", "spam", "Spam", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "spam"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Spam detected",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const content = "This is spam email";
        const result = escapeAndHighlight(content, [group]);

        expect(result).toContain("<span class=\"highlight-violation\">spam</span>");
        expect(result).toBe("This is <span class=\"highlight-violation\">spam</span> email");
    });

    test("should highlight multiple occurrences of same pattern", () => {
        const rule = new SimpleValidationRule("Subject", "test", "Test", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "test"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Test",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const content = "test test test";
        const result = escapeAndHighlight(content, [group]);

        const matches = result.match(/<span class="highlight-violation">test<\/span>/g);
        expect(matches).toHaveLength(3);
    });

    test("should highlight multiple patterns with pipe separator", () => {
        const rule = new SimpleValidationRule("X-Forefront", "SFV:SPM|SFV:BLK", "SFV", "SFV", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "SFV:SPM|SFV:BLK"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "SFV violation",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const content1 = "SFV:SPM;CIP:1.2.3.4";
        const result1 = escapeAndHighlight(content1, [group]);
        expect(result1).toContain("<span class=\"highlight-violation\">SFV:SPM</span>");

        const content2 = "SFV:BLK;CIP:1.2.3.4";
        const result2 = escapeAndHighlight(content2, [group]);
        expect(result2).toContain("<span class=\"highlight-violation\">SFV:BLK</span>");
    });

    test("should be case-insensitive", () => {
        const rule = new SimpleValidationRule("Subject", "spam", "Spam", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "spam"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Spam",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const content = "This is SPAM email with Spam and spam";
        const result = escapeAndHighlight(content, [group]);

        expect(result).toContain("<span class=\"highlight-violation\">SPAM</span>");
        expect(result).toContain("<span class=\"highlight-violation\">Spam</span>");
        expect(result).toContain("<span class=\"highlight-violation\">spam</span>");
    });

    test("should handle empty highlight pattern", () => {
        const rule = new SimpleValidationRule("Subject", "", "Empty", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: ""
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Empty",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const content = "Test content";
        const result = escapeAndHighlight(content, [group]);
        expect(result).toBe(content);
    });

    test("should handle pattern with whitespace", () => {
        const rule = new SimpleValidationRule("Subject", "  test  ", "Test", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "  test  "
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Test",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const content = "This is test content";
        const result = escapeAndHighlight(content, [group]);
        expect(result).toContain("<span class=\"highlight-violation\">test</span>");
    });

    test("should handle invalid regex patterns gracefully", () => {
        const rule = new SimpleValidationRule("Subject", "[invalid", "Invalid", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "[invalid"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Invalid",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const content = "Test content";
        const result = escapeAndHighlight(content, [group]);
        // Should not throw error, just skip invalid pattern
        expect(result).toBe(content);
    });

    test("should handle multiple violation groups", () => {
        const rule1 = new SimpleValidationRule("A", "error", "Error", "A", "error");
        const rule2 = new SimpleValidationRule("B", "warning", "Warning", "B", "warning");

        const violation1: RuleViolation = {
            rule: rule1,
            affectedSections: [],
            highlightPattern: "error"
        };
        const violation2: RuleViolation = {
            rule: rule2,
            affectedSections: [],
            highlightPattern: "warning"
        };

        const group1: ViolationGroup = {
            groupId: "group-1",
            displayName: "Error",
            severity: "error",
            isAndRule: false,
            violations: [violation1]
        };
        const group2: ViolationGroup = {
            groupId: "group-2",
            displayName: "Warning",
            severity: "warning",
            isAndRule: false,
            violations: [violation2]
        };

        const content = "This has error and warning";
        const result = escapeAndHighlight(content, [group1, group2]);

        expect(result).toContain("<span class=\"highlight-violation\">error</span>");
        expect(result).toContain("<span class=\"highlight-violation\">warning</span>");
    });

    test("should escape special regex characters", () => {
        const rule = new SimpleValidationRule("A", "test.", "Test", "A", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "test."
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Test",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const content = "test. versus testing";
        const result = escapeAndHighlight(content, [group]);

        // Should only match "test." literally, not "test" followed by any character
        expect(result).toContain("<span class=\"highlight-violation\">test.</span>");
        expect(result).not.toContain("<span class=\"highlight-violation\">testing</span>");
    });

    test("should prevent nested spans when patterns match already-highlighted content", () => {
        // This test demonstrates the bug: if first pattern adds "<span class='highlight-violation'>test</span>"
        // and second pattern matches "class", it will corrupt the HTML by matching inside the span tag
        const rule1 = new SimpleValidationRule("Subject", "test", "Test", "Subject", "error");
        const rule2 = new SimpleValidationRule("Subject", "class", "Class", "Subject", "error");

        const violation1: RuleViolation = {
            rule: rule1,
            affectedSections: [],
            highlightPattern: "test"
        };
        const violation2: RuleViolation = {
            rule: rule2,
            affectedSections: [],
            highlightPattern: "class"
        };

        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Multiple patterns",
            severity: "error",
            isAndRule: false,
            violations: [violation1, violation2]
        };

        const content = "This is a test message";
        const result = escapeAndHighlight(content, [group]);

        // Should NOT have nested spans or broken HTML
        const nestedSpanPattern = /<span[^>]*><span[^>]*>/;
        expect(result).not.toMatch(nestedSpanPattern);

        // Should NOT have highlighted content inside HTML attributes
        // Old buggy version creates: <span <span class="highlight-violation">class</span>="highlight-violation">test</span>
        const brokenHtmlPattern = /<span\s+<span/;
        expect(result).not.toMatch(brokenHtmlPattern);

        // Should have only "test" highlighted, not "class" from the HTML attribute
        // Correct result: <span class="highlight-violation">test</span> message
        expect(result).toBe("This is a <span class=\"highlight-violation\">test</span> message");
    });
});

describe("getViolationsForRow", () => {
    test("should return empty array when no violation groups", () => {
        const row = { id: "1", label: "Subject", value: "Test" };
        const result = getViolationsForRow(row, []);
        expect(result).toHaveLength(0);
    });

    test("should find violation matching by section header", () => {
        const section: HeaderSection = { header: "Subject", value: "Test" };
        const rule = new SimpleValidationRule("Subject", "test", "Test", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: "test"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Test",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row = { label: "Subject", value: "Some value" };
        const result = getViolationsForRow(row, [group]);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(violation);
    });

    test("should find violation matching by header property", () => {
        const section: HeaderSection = { header: "From", value: "test@example.com" };
        const rule = new SimpleValidationRule("From", "pattern", "Error", "From", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: "pattern"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Error",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row = { header: "From", value: "test@example.com" };
        const result = getViolationsForRow(row, [group]);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(violation);
    });

    test("should find violation matching by pattern in row value", () => {
        const section: HeaderSection = { header: "Other", value: "Other value" };
        const rule = new SimpleValidationRule("A", "spam", "Spam", "A", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: "spam"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Spam",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row = { label: "Subject", value: "This is spam" };
        const result = getViolationsForRow(row, [group]);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(violation);
    });

    test("should find violation matching by pattern in row valueUrl", () => {
        const section: HeaderSection = { header: "Other", value: "Other" };
        const rule = new SimpleValidationRule("A", "example.com", "Domain", "A", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: "example.com"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Domain",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row = { label: "From", valueUrl: "mailto:test@example.com", value: "Test User" };
        const result = getViolationsForRow(row, [group]);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(violation);
    });

    test("should handle multiple patterns with pipe separator", () => {
        const section: HeaderSection = { header: "SFV", value: "SPM" };
        const rule = new SimpleValidationRule("X", "SFV:SPM|SFV:BLK", "SFV", "SFV", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: "SFV:SPM|SFV:BLK"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "SFV",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row1 = { label: "Data", value: "SFV:SPM;other" };
        const result1 = getViolationsForRow(row1, [group]);
        expect(result1).toHaveLength(1);

        const row2 = { label: "Data", value: "SFV:BLK;other" };
        const result2 = getViolationsForRow(row2, [group]);
        expect(result2).toHaveLength(1);

        const row3 = { label: "Data", value: "SFV:NSPM;other" };
        const result3 = getViolationsForRow(row3, [group]);
        expect(result3).toHaveLength(0);
    });

    test("should handle empty highlight pattern", () => {
        const section: HeaderSection = { header: "Subject", value: "Test" };
        const rule = new SimpleValidationRule("Subject", "", "Empty", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: ""
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Empty",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row = { label: "Other", value: "Test" };
        const result = getViolationsForRow(row, [group]);
        expect(result).toHaveLength(0);
    });

    test("should handle row without value or valueUrl", () => {
        const section: HeaderSection = { header: "Subject", value: "Test" };
        const rule = new SimpleValidationRule("Subject", "pattern", "Error", "Subject", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: "pattern"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Error",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row = { label: "Subject" };
        const result = getViolationsForRow(row, [group]);
        // Should still match by section header/label
        expect(result).toHaveLength(1);
    });

    test("should find multiple violations for same row", () => {
        const section1: HeaderSection = { header: "Subject", value: "Test" };
        const section2: HeaderSection = { header: "Subject", value: "Test" };

        const rule1 = new SimpleValidationRule("A", "urgent", "Urgent", "Subject", "error");
        const rule2 = new SimpleValidationRule("B", "immediate", "Immediate", "Subject", "error");

        const violation1: RuleViolation = {
            rule: rule1,
            affectedSections: [section1],
            highlightPattern: "urgent"
        };
        const violation2: RuleViolation = {
            rule: rule2,
            affectedSections: [section2],
            highlightPattern: "immediate"
        };

        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Multiple",
            severity: "error",
            isAndRule: false,
            violations: [violation1, violation2]
        };

        const row = { label: "Subject", value: "urgent immediate" };
        const result = getViolationsForRow(row, [group]);

        expect(result).toHaveLength(2);
    });

    test("should find all matching violations in group even after first section match", () => {
        // This test verifies the bug: early return should not prevent checking other violations
        const section1: HeaderSection = { header: "Subject", value: "Test" };
        const section2: HeaderSection = { header: "From", value: "Test" };

        const rule1 = new SimpleValidationRule("A", "urgent", "Urgent", "Subject", "error");
        const rule2 = new SimpleValidationRule("B", "spam", "Spam", "From", "error");

        const violation1: RuleViolation = {
            rule: rule1,
            affectedSections: [section1],
            highlightPattern: "urgent"
        };
        const violation2: RuleViolation = {
            rule: rule2,
            affectedSections: [section2],
            highlightPattern: "spam"
        };

        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Multiple",
            severity: "error",
            isAndRule: false,
            violations: [violation1, violation2]
        };

        // Row that matches BOTH violations: first by section (Subject), second by pattern (spam in value)
        const row = { label: "Subject", value: "This is spam" };
        const result = getViolationsForRow(row, [group]);

        // Should find both violations: violation1 matches by section, violation2 matches by pattern
        expect(result).toHaveLength(2);
        expect(result).toContain(violation1);
        expect(result).toContain(violation2);
    });

    test("should handle invalid regex patterns gracefully", () => {
        const section: HeaderSection = { header: "Subject", value: "Test" };
        const rule = new SimpleValidationRule("A", "[invalid", "Invalid", "A", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: "[invalid"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Invalid",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row = { label: "Test", value: "[invalid content" };
        const result = getViolationsForRow(row, [group]);
        // Invalid regex gets escaped and treated as literal string - should match
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(violation);
    });

    test("should be case-insensitive for pattern matching", () => {
        const section: HeaderSection = { header: "Other", value: "Other" };
        const rule = new SimpleValidationRule("A", "spam", "Spam", "A", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [section],
            highlightPattern: "spam"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Spam",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const row = { label: "Subject", value: "This is SPAM" };
        const result = getViolationsForRow(row, [group]);

        expect(result).toHaveLength(1);
    });
});

describe("highlightHtml", () => {
    test("should preserve HTML anchor tags without escaping", () => {
        const rule = new SimpleValidationRule("Country", "US", "Country", "Country", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "US"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Country match",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const htmlContent = "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>US</a>";
        const result = highlightHtml(htmlContent, [group]);

        // Should preserve anchor tag structure
        expect(result).toContain("<a href");
        expect(result).toContain("target=\"_blank\"");
        expect(result).toContain("</a>");
        // Should highlight text inside anchor tag
        expect(result).toContain("<span class=\"highlight-violation\">US</span>");
        // Should NOT escape the HTML
        expect(result).not.toContain("&lt;a");
        expect(result).not.toContain("&gt;");
    });

    test("should preserve multiple anchor tags", () => {
        const rule = new SimpleValidationRule("Lang", "en", "Language", "Language", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "en"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Language match",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const htmlContent = "<a href = 'https://example.com' target = '_blank'>en</a>";
        const result = highlightHtml(htmlContent, [group]);

        expect(result).toContain("<a href");
        expect(result).toContain("</a>");
        expect(result).toContain("<span class=\"highlight-violation\">en</span>");
    });

    test("should handle message IDs with special characters", () => {
        const htmlContent = "<message@example.com>";
        const result = highlightHtml(htmlContent, []);

        // Message IDs with angle brackets should be preserved as-is (no escaping needed since no highlighting)
        expect(result).toBe("<message@example.com>");
    });

    test("should escape special characters in plain text when using escapeAndHighlight", () => {
        const content = "<message@example.com>";
        const result = escapeAndHighlight(content, []);

        // Plain text with special chars should be escaped
        expect(result).toBe("&lt;message@example.com&gt;");
    });

    test("should return original content when no violation groups", () => {
        const htmlContent = "<a href='test'>link</a>";
        const result = highlightHtml(htmlContent, []);
        expect(result).toBe(htmlContent);
    });

    test("should return original content when content is empty", () => {
        const result = highlightHtml("", []);
        expect(result).toBe("");
    });

    test("should handle HTML with no matches", () => {
        const rule = new SimpleValidationRule("Test", "notfound", "Test", "Test", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "notfound"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Test",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const htmlContent = "<a href='test'>different text</a>";
        const result = highlightHtml(htmlContent, [group]);

        // Should preserve HTML without highlighting (DOM normalizes quotes to double quotes)
        expect(result).toContain("<a href=\"");
        expect(result).not.toContain("highlight-violation");
    });

    test("should highlight text outside tags", () => {
        const rule = new SimpleValidationRule("Test", "spam", "Spam", "Test", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "spam"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Spam",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const htmlContent = "This is spam <a href='test'>link</a>";
        const result = highlightHtml(htmlContent, [group]);

        // Should highlight text outside tags
        expect(result).toContain("<span class=\"highlight-violation\">spam</span>");
        // Should preserve anchor tag (DOM normalizes quotes to double quotes)
        expect(result).toContain("<a href=\"");
        expect(result).toContain(">link</a>");
    });

    test("should handle complex HTML with nested elements", () => {
        const rule = new SimpleValidationRule("Test", "test", "Test", "Test", "error");
        const violation: RuleViolation = {
            rule,
            affectedSections: [],
            highlightPattern: "test"
        };
        const group: ViolationGroup = {
            groupId: "group-1",
            displayName: "Test",
            severity: "error",
            isAndRule: false,
            violations: [violation]
        };

        const htmlContent = "<div><span>test</span> text with test</div>";
        const result = highlightHtml(htmlContent, [group]);

        // Should preserve div and span structure
        expect(result).toContain("<div>");
        expect(result).toContain("</div>");
        expect(result).toContain("<span>");
        // Should highlight both occurrences
        const matches = result.match(/highlight-violation/g);
        expect(matches).toBeTruthy();
        expect(matches!.length).toBeGreaterThan(0);
    });
});
