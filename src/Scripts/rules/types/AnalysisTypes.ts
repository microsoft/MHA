/**
 * Clean type definitions for the new rules analysis engine
 * These provide a clear interface between the rules engine and UI layer
 */

import { HeaderSection, IValidationRule } from "./interfaces";
import { HeaderModel } from "../../HeaderModel";

/**
 * Grouped rule violations for better UI organization
 */
export interface ViolationGroup {
    /** Unique identifier for this group */
    groupId: string;

    /** Display name for the group (rule message) */
    displayName: string;

    /** Severity level for the group */
    severity: "error" | "warning" | "info";

    /** Whether this group represents an AND rule with multiple conditions */
    isAndRule: boolean;

    /** Individual violations that make up this group */
    violations: RuleViolation[];
}

/**
 * Result of analyzing headers for rule violations
 */
export interface AnalysisResult {
    /** Whether the analysis completed successfully */
    success: boolean;

    /** Any error that occurred during analysis */
    error?: string;

    /** Headers enriched with rule violation flags */
    enrichedHeaders: HeaderModel;

    /** Structured violation information for UI display */
    violations: RuleViolation[];

    /** Grouped violations for better UI organization */
    violationGroups: ViolationGroup[];
}

/**
 * Information about a specific rule violation
 */
export interface RuleViolation {
    /** The rule that was violated */
    rule: IValidationRule;

    /** All header sections affected by this violation (for display/highlighting) */
    affectedSections: HeaderSection[];

    /** Pattern to highlight in the section content (if applicable) */
    highlightPattern: string;

    /** Parent AND rule message if this violation is part of an AND rule */
    parentMessage?: string;
}
