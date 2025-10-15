// This class allows for And'ing of rules together to make a more complex rule.  This rule is flagged
// if all of the Rules to And are flagged.

import { FindSectionSubSection } from "./HeaderValidationRules";

// Construct an AndValidationRuleClass instance
// errorMessage - error message to show if rule is flagged
// reportSection - Where on the UI to show the error (may be an Array of multiple sections on the UI)
// cssEntryPrefix - prefix (appended with 'Text') to define the Text format in the CSS to use when showing message
// rulesToAndArray - Array of rules (usually simple rules, instance of ValidationRule) to test
export const AndValidationRuleClass = function ( errorMessage, reportSection, cssEntryPrefix, rulesToAndArray )
{

    this.errorMessage = errorMessage;

    // Make sure sections to report error is an array
    if ( Array.isArray( reportSection ) )
    {
        this.errorReportingSection = reportSection;
    }
    else
    {
        this.errorReportingSection = [reportSection];
    }

    this.cssEntryPrefix = cssEntryPrefix;

    this.rulesToAndArray = rulesToAndArray;

    this.errorPattern = "";
    this.primaryRule = true;

    // Create a single rulle pattern to use to highlight text on display
    for ( let ruleIndex = 0; ruleIndex < rulesToAndArray.length; ruleIndex++ )
    {
        const subRule = rulesToAndArray[ruleIndex];

        // Flag the sub-rules as non-primary
        subRule.primaryRule = false;

        if ( ruleIndex === 0 )
        {
            this.errorPattern = subRule.errorPattern;
        }
        else
        {
            this.errorPattern = this.errorPattern + "|" + subRule.errorPattern;
        }
    };
};

// Determine if the rule is violated by the header sections passed in.
// setOfSections - set of sections being displayed.  An array of sections that are displayed on the UI,
// where each entry in the array is an array of the portions of the header that are displayed in on that
// section within the UI.
AndValidationRuleClass.prototype.ViolatesComplexRule = function ( setOfSections )
{
    let allTrue = true;

    // Go through rules and if one is false, then return false
    this.rulesToAndArray.forEach( function AndClauseEvaluation( rule )
    {
        if ( allTrue )
        {
            const sectionsToExamine = FindSectionSubSection( setOfSections, rule.checkSection );

            // IF there are sections to examine to see if this part of the AND statement is true
            if ( sectionsToExamine && ( sectionsToExamine.length > 0 ) )
            {
                sectionsToExamine.forEach( function ( section )
                {
                    if ( allTrue )
                    {
                        // IF fails rule, then fails this test

                        if ( rule.ViolatesRule( section.header, section.value ) === null )
                        {
                            allTrue = false;
                        }
                    }
                } );
            }
            else
            {
                // IF nothing to prove this rule true, then it must be false.
                allTrue = false;
            }
        }
    } );

    return allTrue;
};
