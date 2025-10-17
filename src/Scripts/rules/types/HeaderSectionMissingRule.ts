// A validation to verify that a header section exists.  The rule is of the format:
//
//  IF section is missing
//    then display error message on UI for section
//

import { HeaderSection, IComplexValidationRule } from "./interfaces";
import { findSectionSubSection } from "../engine/HeaderValidationRules";

// rule counter to assign unique rule numbers to each rule (internal number only)
let uniqueRuleNumber = 0;

export class HeaderSectionMissingRule implements IComplexValidationRule {
    public checkSection: string;
    public errorMessage: string;
    public errorReportingSection: string[];
    public cssEntryPrefix: string;
    public ruleNumber: number;
    public primaryRule: boolean;

    constructor(
        checkSection: string,
        errorMessage: string,
        reportSection: string | string[],
        cssEntryPrefix?: string
    ) {
        this.checkSection = checkSection;
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
     * Determine if the rule is violated by the header sections passed in.
     * @param setOfSections - set of sections being displayed. An array of sections that are displayed on the UI,
     * where each entry in the array is an array of the portions of the header that are displayed in on that
     * section within the UI.
     * @returns true if the rule is violated (section is missing)
     */
    public violatesComplexRule(setOfSections: HeaderSection[][]): boolean {
        // FOREACH section find instance of section to look for in that group of sections
        const sectionDefinition = findSectionSubSection(setOfSections, this.checkSection);

        return sectionDefinition.length === 0;
    }
}