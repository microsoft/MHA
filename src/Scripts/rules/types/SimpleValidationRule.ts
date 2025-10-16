// A validation rule is a single, simple rule.  The rule is of the format:
//
//  IF regularExpression exists in section
//    then display error message on UI for section
//

import { ISimpleValidationRule } from "./interfaces";

// rule counter to assign unique rule numbers to each rule (internal number only)
let uniqueRuleNumber = 0;

export class SimpleValidationRule implements ISimpleValidationRule {
    public checkSection: string;
    public errorPattern: string;
    public errorMessage: string;
    public errorReportingSection: string[];
    public cssEntryPrefix: string;
    public ruleNumber: number;
    public primaryRule: boolean;

    constructor(
        checkSection: string,
        errorPattern: string,
        errorMessage: string,
        reportSection: string | string[],
        cssEntryPrefix?: string
    ) {
        this.checkSection = checkSection;
        this.errorPattern = errorPattern;
        this.errorMessage = errorMessage || "";

        // Make sure reporting section is an array
        if (Array.isArray(reportSection)) {
            this.errorReportingSection = reportSection;
        } else {
            if (reportSection) {
                this.errorReportingSection = [reportSection];
            } else {
                this.errorReportingSection = [];
            }
        }

        this.cssEntryPrefix = cssEntryPrefix || "error";
        this.ruleNumber = ++uniqueRuleNumber;
        this.primaryRule = true;
    }

    /**
     * Test this rule to see if it 'matches'
     * @param section - Section in the header that contains this text
     * @param sectionText - Text of the section within the email header
     * @returns null if no match, otherwise the text that matched the errorPattern Regular Expression
     */
    public violatesRule(section: string, sectionText: string): string | null {
        if (section === this.checkSection) {
            const matches = sectionText.match(this.errorPattern);

            if (matches && matches.length > 0) {
                return matches[0];
            }
        }

        return null;
    }
}

// Export function constructor for backward compatibility
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SimpleValidationRuleFunction = function (
    checkSection: string,
    errorPattern: string,
    errorMessage: string,
    reportSection: string | string[],
    cssEntryPrefix?: string
): SimpleValidationRule {
    return new SimpleValidationRule(checkSection, errorPattern, errorMessage, reportSection, cssEntryPrefix);
};