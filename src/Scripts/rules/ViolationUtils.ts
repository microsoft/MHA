import { RuleViolation, ViolationGroup } from "./types/AnalysisTypes";
import { HeaderSection } from "./types/interfaces";

/**
 * Map severity to label, and CSS class
 */
export function getSeverityDisplay(severity?: string): { label: string; cssClass: string } {
    switch (severity) {
        case "warning":
            return { label: "⚠️ Warning", cssClass: "rule-violation-warning" };
        case "info":
            return { label: "ℹ️ Info", cssClass: "rule-violation-info" };
        case "error":
            return { label: "❌ Error", cssClass: "rule-violation-error" };
        default:
            return { label: "❌ Error", cssClass: "rule-violation-error" };
    }
}

/**
 * Apply content highlighting to show rule violation patterns
 * @param content - The text content to highlight
 * @param violationGroups - Array of violation groups with highlight patterns
 * @returns The content with HTML highlighting spans applied
 */
export function highlightContent(content: string, violationGroups: ViolationGroup[]): string {
    if (!content || !violationGroups || violationGroups.length === 0) {
        return content;
    }

    let highlightedContent = content;

    violationGroups.forEach(group => {
        group.violations.forEach(violation => {
            if (violation.highlightPattern) {
                // Split multiple patterns by |
                const patterns = violation.highlightPattern.split("|");

                patterns.forEach(pattern => {
                    if (pattern && pattern.trim()) {
                        // Escape special regex characters except for basic wildcards
                        const escapedPattern = pattern.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                        try {
                            const regex = new RegExp(`(${escapedPattern})`, "gi");
                            highlightedContent = highlightedContent.replace(regex,
                                "<span class=\"rule-violation-highlight\">$1</span>");
                        } catch (error) {

                            console.warn("Invalid regex pattern:", pattern, error);
                        }
                    }
                });
            }
        });
    });

    return highlightedContent;
}

/**
 * Find violations that apply to a specific row by matching section and content
 */
export function getViolationsForRow(
    row: { id?: string; label?: string; valueUrl?: string; value?: string; header?: string },
    violationGroups: ViolationGroup[]
): RuleViolation[] {
    const matchingViolations: RuleViolation[] = [];

    violationGroups.forEach(group => {
        group.violations.forEach(violation => {
            // Check if violation section matches this row
            if (violation.section) {
                const section = violation.section as HeaderSection;

                // Match by section header/name
                if (section.header === row.label || section.header === row.header) {
                    matchingViolations.push(violation);
                    return;
                }
            }

            // Check if violation pattern matches row content
            if (violation.highlightPattern) {
                const content = row.valueUrl || row.value;
                if (content) {
                    const patterns = violation.highlightPattern.split("|");
                    const hasMatch = patterns.some(pattern => {
                        if (pattern && pattern.trim()) {
                            try {
                                const escapedPattern = pattern.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                const regex = new RegExp(escapedPattern, "gi");
                                return regex.test(content);
                            } catch {
                                return false;
                            }
                        }
                        return false;
                    });

                    if (hasMatch) {
                        matchingViolations.push(violation);
                    }
                }
            }
        });
    });

    return matchingViolations;
}
