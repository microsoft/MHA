// This class allows for And'ing of rules together to make a more complex rule.  This rule is flagged
// if all of the Rules to And are flagged.

import { HeaderSection, IAndValidationRule, ISimpleValidationRule } from "./interfaces";
import { findSectionSubSection } from "../engine/HeaderValidationRules";

export class AndValidationRule implements IAndValidationRule {
    public errorMessage: string;
    public errorReportingSection: string[];
    public rulesToAndArray: ISimpleValidationRule[];
    public errorPattern: string;
    public primaryRule: boolean;
    public checkSection: string;
    public ruleNumber: number;
    public severity: "error" | "warning" | "info";

    constructor(
        errorMessage: string,
        reportSection: string | string[],
        severity: "error" | "warning" | "info",
        rulesToAndArray: ISimpleValidationRule[]
    ) {
        this.errorMessage = errorMessage;

        // Make sure sections to report error is an array
        if (Array.isArray(reportSection)) {
            this.errorReportingSection = reportSection;
        } else {
            this.errorReportingSection = [reportSection];
        }

        this.severity = severity;
        this.rulesToAndArray = rulesToAndArray;
        this.errorPattern = "";
        this.primaryRule = true;
        this.checkSection = ""; // AndRules don't have a single check section
        this.ruleNumber = 0; // Will be set by the rules engine

        // Create a single rule pattern to use to highlight text on display
        for (let ruleIndex = 0; ruleIndex < rulesToAndArray.length; ruleIndex++) {
            const subRule = rulesToAndArray[ruleIndex];

            if (subRule) {
                // Flag the sub-rules as non-primary
                subRule.primaryRule = false;

                if (ruleIndex === 0) {
                    this.errorPattern = subRule.errorPattern;
                } else {
                    this.errorPattern = this.errorPattern + "|" + subRule.errorPattern;
                }
            }
        }
    }

    /**
     * Determine if the rule is violated by the header sections passed in.
     * @param setOfSections - set of sections being displayed. An array of sections that are displayed on the UI,
     * where each entry in the array is an array of the portions of the header that are displayed in on that
     * section within the UI.
     * @returns true if all AND conditions are met (rule is violated)
     */
    public violatesComplexRule(setOfSections: HeaderSection[][]): boolean {
        let allTrue = true;

        // Go through rules and if one is false, then return false
        this.rulesToAndArray.forEach((rule) => {
            if (allTrue) {
                const sectionsToExamine = findSectionSubSection(setOfSections, rule.checkSection);

                // IF there are sections to examine to see if this part of the AND statement is true
                if (sectionsToExamine && sectionsToExamine.length > 0) {
                    // Check if ANY of the sections match this rule
                    let foundMatch = false;
                    sectionsToExamine.forEach((section) => {
                        if (!foundMatch) {
                            // IF passes rule, then this sub-rule is satisfied
                            const result = rule.violatesRule(section);
                            if (result !== null) {
                                foundMatch = true;
                                // Store the specific section that matched so it can be flagged later
                                rule.matchedSection = section;
                            }
                        }
                    });

                    if (!foundMatch) {
                        allTrue = false;
                    }
                } else {
                    // IF nothing to prove this rule true, then it must be false.
                    allTrue = false;
                }
            }
        });

        return allTrue;
    }
}

// Export function constructor for backward compatibility
export const andValidationRuleClassFunction = function (
    errorMessage: string,
    reportSection: string | string[],
    severity: "error" | "warning" | "info",
    rulesToAndArray: ISimpleValidationRule[]
): AndValidationRule {
    return new AndValidationRule(errorMessage, reportSection, severity, rulesToAndArray);
};