// A validation to verify that a header section exists.  The rule is of the format:
//
//  IF regularExpression exists in section
//    then display error message on UI for section
//

import { FindSectionSubSection } from "../engine/HeaderValidationRules";

// rule counter to assign unique rule numbers to each rule (internal number only)
export let UniqueRuleNumber = 0;

// Create a new Validation Rule
// checkSection - section in the header to look for the pattern
// errorPattern - Regular Expression that is the pattern to look for in the section
// errorMessage - Message to show when regular expression is found
// reportSection - Where on the UI to show the error message
// cssEntryPrefix - prefix (appended with 'Text') to define the Text format in the CSS to use when showing message
export const HeaderSectionMissingRule = function ( checkSection, errorMessage, reportSection, cssEntryPrefix )
{
    this.checkSection = checkSection;
    this.errorMessage = errorMessage || "";

    // Make sure reporting section is an array
    if ( Array.isArray( reportSection ) )
    {
        this.errorReportingSection = reportSection;
    }
    else
    {
        if ( reportSection )
        {
            this.errorReportingSection = [reportSection];
        }
        else
        {
            this.errorReportingSection = [];
        }
    }

    this.cssEntryPrefix = cssEntryPrefix || "error";
    this.ruleNumber = ++UniqueRuleNumber;
    this.primaryRule = true;
};

// Determine if the rule is violated by the header sections passed in.
// setOfSections - set of sections being displayed.  An array of sections that are displayed on the UI,
// where each entry in the array is an array of the portions of the header that are displayed in on that
// section within the UI.
HeaderSectionMissingRule.prototype.ViolatesComplexRule = function (setOfSections) {

    // FOREACH section find instance of section to look for in that group of sections
    const sectionDefinition = FindSectionSubSection(setOfSections, this.checkSection);

    return sectionDefinition.length == 0;
};