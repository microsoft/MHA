// A validation rule is a single, simple rule.  The rule is of the format:
//
//  IF regularExpression exists in section
//    then display error message on UI for section
//

import { HeaderSection, ISimpleValidationRule } from "./interfaces";

// rule counter to assign unique rule numbers to each rule (internal number only)
let uniqueRuleNumber = 0;

export class SimpleValidationRule implements ISimpleValidationRule {
    public checkSection: string;
    public errorPattern: string;
    public errorMessage: string;
    public errorReportingSection: string[];
    public ruleNumber: number;
    public primaryRule: boolean;
    public severity: "error" | "warning" | "info";

    constructor(
        checkSection: string,
        errorPattern: string,
        errorMessage: string,
        reportSection: string | string[],
        severity: "error" | "warning" | "info"
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

        this.ruleNumber = ++uniqueRuleNumber;
        this.primaryRule = true;
        this.severity = severity;
    }

    /**
     * Test this rule to see if it 'matches'
     * @param section - Section object containing header, value, and headerName
     * @returns null if no match, otherwise the text that matched the errorPattern Regular Expression
     */
    public violatesRule(section: HeaderSection): string | null {
        // Check if the header directly matches
        const headerMatches = section.header === this.checkSection;

        // OR check if this is a broken-out row from the header we're looking for
        // AND it's the "source" row which contains the full original value
        const isSourceRow = section.headerName === this.checkSection && section.header === "source";

        if (headerMatches || isSourceRow) {
            const matches = section.value.match(this.errorPattern);

            if (matches && matches.length > 0) {
                return matches[0];
            }
        }

        return null;
    }
}