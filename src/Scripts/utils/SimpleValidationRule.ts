// A validation rule is a single, simple rule.  The rule is of the format:
//
//  IF regularExpression exists in section
//    then display error message on UI for section
//

// rule counter to assign unique rule numbers to each rule (internal number only)
export let UniqueRuleNumber = 0;

// Create a new Validation Rule
// checkSection - section in the header to look for the pattern
// errorPattern - Regular Expression that is the pattern to look for in the section
// errorMessage - Message to show when regular expression is found
// reportSection - Where on the UI to show the error message
// cssEntryPrefix - prefix (appended with 'Text') to define the Text format in the CSS to use when showing message
export const SimpleValidationRule = function ( checkSection, errorPattern, errorMessage, reportSection, cssEntryPrefix )
{
    this.checkSection = checkSection;
    this.errorPattern = errorPattern;
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

/// Test this rule to see if it 'matches'
/// section - Section in the header that contains this text
/// sectionText - Text of the section within the email header
///
/// returns : null if no match, otherwise the text that matched the errorPattern Regular Expression
SimpleValidationRule.prototype.ViolatesRule = function ( section, sectionText )
{

    if ( section === this.checkSection )
    {

        const matches = sectionText.match( this.errorPattern );

        if ( matches && matches.length > 0 )
        {
            return matches[0];
        }
    }

    return null;
};
