import { Strings } from "../Strings";
import { RuleViolation, ViolationGroup } from "./types/AnalysisTypes";
import { HeaderSection } from "./types/interfaces";

/**
 * Escape HTML and apply content highlighting to show rule violation patterns
 * @param content - The text content to escape and highlight
 * @param violationGroups - Array of violation groups with highlight patterns
 * @returns The HTML-escaped content with highlighting spans applied
 */
export function escapeAndHighlight(content: string, violationGroups: ViolationGroup[]): string {
    const escapedContent = Strings.htmlEncode(content);
    return highlightContent(escapedContent, violationGroups);
}

/**
 * Apply highlighting to HTML content without breaking existing HTML tags
 * Use this for content that already contains HTML (like valueUrl with anchor tags)
 * @param htmlContent - HTML content (e.g., content with anchor tags from mapHeaderToURL)
 * @param violationGroups - Array of violation groups with highlight patterns
 * @returns The HTML content with highlighting spans applied to text nodes only
 */
export function highlightHtml(htmlContent: string, violationGroups: ViolationGroup[]): string {
    if (!htmlContent || !violationGroups || violationGroups.length === 0) {
        return htmlContent;
    }

    // Create a temporary DOM element to parse the HTML
    const temp = document.createElement("div");
    temp.innerHTML = htmlContent;

    // Function to highlight text nodes recursively without breaking HTML structure
    function highlightTextNodes(node: Node): void {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || "";
            if (text.trim()) {
                // Escape the text content before highlighting to prevent XSS
                const escapedText = Strings.htmlEncode(text);
                const highlighted = highlightContent(escapedText, violationGroups);
                if (highlighted !== escapedText) {
                    const span = document.createElement("span");
                    span.innerHTML = highlighted;
                    node.parentNode?.replaceChild(span, node);
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const childNodes = Array.from(node.childNodes);
            childNodes.forEach(child => highlightTextNodes(child));
        }
    }

    highlightTextNodes(temp);
    return temp.innerHTML;
}

/**
 * Apply content highlighting to show rule violation patterns
 * @param content - The text content to highlight (should already be HTML-escaped)
 * @param violationGroups - Array of violation groups with highlight patterns
 * @returns The content with HTML highlighting spans applied
 */
function highlightContent(content: string, violationGroups: ViolationGroup[]): string {
    if (!content || !violationGroups || violationGroups.length === 0) {
        return content;
    }

    interface Match {
        start: number;
        end: number;
        text: string;
    }

    // Collect all matches first without modifying content
    const allMatches: Match[] = [];

    violationGroups.forEach(group => {
        group.violations.forEach(violation => {
            if (violation.highlightPattern) {
                const patterns = violation.highlightPattern.split("|");

                patterns.forEach(pattern => {
                    if (pattern && pattern.trim()) {
                        const escapedPattern = pattern.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                        try {
                            const regex = new RegExp(escapedPattern, "gi");
                            let match;
                            while ((match = regex.exec(content)) !== null) {
                                allMatches.push({
                                    start: match.index,
                                    end: match.index + match[0].length,
                                    text: match[0]
                                });
                            }
                        } catch (error) {
                            console.warn("Invalid regex pattern:", pattern, error);
                        }
                    }
                });
            }
        });
    });

    if (allMatches.length === 0) {
        return content;
    }

    // Sort by position and merge overlapping matches
    allMatches.sort((a, b) => a.start - b.start);

    const mergedMatches: Match[] = [];
    let current = allMatches[0]!;

    for (let i = 1; i < allMatches.length; i++) {
        const next = allMatches[i]!;

        if (next.start < current.end) {
            // Overlapping - extend current if needed
            if (next.end > current.end) {
                current = {
                    start: current.start,
                    end: next.end,
                    text: content.slice(current.start, next.end)
                };
            }
        } else {
            // Non-overlapping - save current and move to next
            mergedMatches.push(current);
            current = next;
        }
    }
    mergedMatches.push(current);

    // Build result by inserting spans from end to start (preserves positions)
    let result = content;
    for (let i = mergedMatches.length - 1; i >= 0; i--) {
        const match = mergedMatches[i]!;
        result =
            result.slice(0, match.start) +
            `<span class="highlight-violation">${match.text}</span>` +
            result.slice(match.end);
    }

    return result;
}

/**
 * Find violations that apply to a specific row by matching section and content
 */
export function getViolationsForRow(
    row: { id?: string; label?: string; valueUrl?: string; value?: string; header?: string; headerName?: string },
    violationGroups: ViolationGroup[]
): RuleViolation[] {
    const matchingViolations: RuleViolation[] = [];

    violationGroups.forEach(group => {
        group.violations.forEach(violation => {
            // Check if violation applies to this row via any of its affected sections
            const matchesSection = violation.affectedSections.some(section => {
                const headerSection = section as HeaderSection;
                // Match by section header/name or headerName property
                return headerSection.header === row.label ||
                       headerSection.header === row.header ||
                       headerSection.header === row.headerName;
            });

            if (matchesSection) {
                matchingViolations.push(violation);
            } else if (violation.highlightPattern) {
                // Check if violation pattern matches row content
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
