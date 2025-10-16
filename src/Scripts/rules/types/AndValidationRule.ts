// This class allows for And'ing of rules together to make a more complex rule.  This rule is flagged
// if all of the Rules to And are flagged.

import { HeaderSection, IAndValidationRule, ISimpleValidationRule } from "./interfaces";
import { findSectionSubSection } from "../engine/HeaderValidationRules";

export class AndValidationRule implements IAndValidationRule {
    public errorMessage: string;
    public errorReportingSection: string[];
    public cssEntryPrefix: string;
    public rulesToAndArray: ISimpleValidationRule[];
    public errorPattern: string;
    public primaryRule: boolean;
    public checkSection: string;
    public ruleNumber: number;

    constructor(
        errorMessage: string,
        reportSection: string | string[],
        cssEntryPrefix: string,
        rulesToAndArray: ISimpleValidationRule[]
    ) {
        this.errorMessage = errorMessage;

        // Make sure sections to report error is an array
        if (Array.isArray(reportSection)) {
            this.errorReportingSection = reportSection;
        } else {
            this.errorReportingSection = [reportSection];
        }

        this.cssEntryPrefix = cssEntryPrefix;
        this.rulesToAndArray = rulesToAndArray;
        this.errorPattern = "";
        this.primaryRule = true;
        this.checkSection = ""; // AndRules don't have a single check section
        this.ruleNumber = 0; // Will be set by the rules engine

        // Create a single rule pattern to use to highlight text on display
        for (let ruleIndex = 0; ruleIndex < rulesToAndArray.length; ruleIndex++) {
            const subRule = rulesToAndArray[ruleIndex];

            // Flag the sub-rules as non-primary
            subRule.primaryRule = false;

            if (ruleIndex === 0) {
                this.errorPattern = subRule.errorPattern;
            } else {
                this.errorPattern = this.errorPattern + "|" + subRule.errorPattern;
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
                    sectionsToExamine.forEach((section) => {
                        if (allTrue) {
                            // IF fails rule, then fails this test
                            if (rule.violatesRule(section.header, section.value) === null) {
                                allTrue = false;
                            }
                        }
                    });
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
export const AndValidationRuleClassFunction = function (
    errorMessage: string,
    reportSection: string | string[],
    cssEntryPrefix: string,
    rulesToAndArray: ISimpleValidationRule[]
): AndValidationRule {
    return new AndValidationRule(errorMessage, reportSection, cssEntryPrefix, rulesToAndArray);
};