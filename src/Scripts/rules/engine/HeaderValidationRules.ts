import { AddRuleFlagged } from "../../table/Headers";
import { AndValidationRuleClass } from "../types/AndValidationRule";
import { HeaderSectionMissingRule } from "../types/HeaderSectionMissingRule";
import { SimpleValidationRule } from "../types/SimpleValidationRule";

// Create instance of the HeaderValidationRules.
// overrideCreateRuleSetFunction - function to define the rules to put into header validation rules.  If undefined
// then the default rules creator (this.CreateRuleSet) will be used to create the rule definitions.
export const ClassHeaderValidationRules = function ( overrideCreateRuleSetFunction ) {
    this.ValidationRuleSet = [];

    if (overrideCreateRuleSetFunction) {

        overrideCreateRuleSetFunction(this);
    }
    else {

        // Create Default rule set
        this.CreateRuleSet(this);
    }
};

// Find all the Violations that exist in the section.  This only tests for violations of simple rules
// (rules that implement 'ViolatesRule') as complex rules apply accross multiple sections.
// section - section that this text is from
// sectionText - text that is from this section.
ClassHeaderValidationRules.prototype.FindViolations = function (section, sectionText) {

    const rulesViolated = [];

    this.ValidationRuleSet.forEach(function (rule) {

        if (objectImplmentsFunction(rule, "ViolatesRule")) {

            //var rule = ValidationRuleSet[ruleIndex];
            const flaggedText = rule.ViolatesRule(section, sectionText);

            if (flaggedText) {

                rulesViolated.push(rule);
            }
        };
    });

    return rulesViolated;
};

// Flag all rows within the tab (set of sections to display) that violate a rule
// tabData - Set of sections that are displayed on one tab on the UI
// setOfSections - all data that was extracted from the header for display
ClassHeaderValidationRules.prototype.FlagAllRowsWithViolations = function (tabData, setOfSections)
{
    // for each section in the set of data displayed on one tab
    tabData.forEach(function (tabDataSection)
    {
        // Find any violations of rules for that section
        const newItemsFlagged = HeaderValidationRules.FindViolations(tabDataSection.header, tabDataSection.value);

        // For each rule that was violated
        newItemsFlagged.forEach(function (ruleFlagged)
        {
            // Flag the section that the rule that was violated says to mark with an error message
            flagRuleInSections(ruleFlagged, setOfSections);
        });

    });
};

// Find and flag all the complex rules that are violated.  Label the sections that the violated rule
// says to mark the error on.
// set of sections is an array of arrays of sections
ClassHeaderValidationRules.prototype.FindComplexViolations = function (setOfSections) {

    // for each of the rules that have been defind
    this.ValidationRuleSet.forEach(function ValidateComplextRule(rule) {

        // IF it is a complex rule
        if (objectImplmentsFunction(rule, "ViolatesComplexRule"))
        {
            // Check Complex rule
            if (rule.ViolatesComplexRule(setOfSections))
            {
                // IF rule succeeds, find all sections we need to flag

                // For each section identified in rule that we need to flag

                flagRuleInSections(rule, setOfSections);

                // IF subrules, then flag those
                if (rule.rulesToAnd)
                {
                    // Show sub-rules with message

                    rule.rulesToAndArray.forEach(function (reportRule) {
                        if (reportRule && (reportRule.errorMessage !== "")) {
                            flagRuleInSections(reportRule, setOfSections);
                        }
                    });
                }
            }
        }
    });
};

// Add Rule to the set of rules to check the header for
ClassHeaderValidationRules.prototype.AddRule = function (newRule) {
    this.ValidationRuleSet.push(newRule);
};

// Create the Rule Set to test the header for
ClassHeaderValidationRules.prototype.CreateRuleSet = function (ruleManager) {
};

ClassHeaderValidationRules.prototype.SetRules = function (simpleRuleSet, andRuleSet) {
    let ruleIndex;

    if (simpleRuleSet)
    {
        for (ruleIndex = 0; ruleIndex < simpleRuleSet.length; ruleIndex++)
        {
            const newRule = simpleRuleSet[ruleIndex];

            if (newRule.RuleType === "SimpleRule") {

                this.AddRule(new SimpleValidationRule(newRule.SectionToCheck, newRule.PatternToCheckFor,
                    newRule.MessageWhenPatternFails, newRule.SectionsInHeaderToShowError, newRule.CssPrefix));
            }
            else if (newRule.RuleType === "HeaderMissingRule") {

                this.AddRule(new HeaderSectionMissingRule(newRule.SectionToCheck, newRule.MessageWhenPatternFails,
                    newRule.SectionsInHeaderToShowError, newRule.CssPrefix));
            }
        }
    }

    if (andRuleSet)
    {
        for (ruleIndex = 0; ruleIndex < andRuleSet.length; ruleIndex++)
        {
            const newRule = andRuleSet[ruleIndex];

            // Create set of rules to and
            const rulesToAnd = [];
            let ruleToAndIndex = 0;
            for (ruleToAndIndex = 0; ruleToAndIndex < newRule.RulesToAnd.length; ruleToAndIndex++)
            {
                const newAndRule = newRule.RulesToAnd[ruleToAndIndex];

                rulesToAnd.push(new SimpleValidationRule(newAndRule.SectionToCheck, newAndRule.PatternToCheckFor,
                    newAndRule.MessageWhenPatternFails, newAndRule.SectionsInHeaderToShowError, newAndRule.CssPrefix));
            }

            this.AddRule(new AndValidationRuleClass(newRule.Message, newRule.SectionsInHeaderToShowError, newRule.CssPrefix, rulesToAnd));
        }
    }
};

// Create the only instance of the rules list
export const HeaderValidationRules = new ClassHeaderValidationRules(undefined);

// Does the object implement the function ?
export function objectImplmentsFunction(obj, doThis) {
    return ( (typeof obj[doThis]) === "function") ;
}

// in the set of sections (array of array of sections) find all of them with particular name
// setOfSections - array of array of sections
// subSectionLookingFor - name of sub-section that we are looking for
// Returns set of sub-sections
export function FindSectionSubSection(setOfSections, subSectionLookingFor) {

    const results = [];

    setOfSections.forEach(function FindSubSectionInSection(section)
    {
        section.forEach(function FindSubsection(subSection)
        {
            if (subSection.header === subSectionLookingFor)
            {
                results.push(subSection);
            }
        });
    });

    return results;
}

// Flag all the sections that the rule says to, as violating the rule
// rule - Rule that was violated (contains list of sections to flag)
// setOfSections - all the sections to be shown on the UI
function flagRuleInSections(rule, setOfSections)
{
    // Each rule has a set of sections that are to be flagged if the rule failes, with the
    // error message from the rule.

    // For each section the rule says to flag
    rule.errorReportingSection.forEach(function (sectionRuleSaysToFlag) {

        // Find all occurances of the section the rule says to flag
        const sectionsToFlag = FindSectionSubSection(setOfSections, sectionRuleSaysToFlag);

        // For each of the sections that are to be flagged, associate the rule with the section
        sectionsToFlag.forEach(function (sectionToFlag) {
            AddRuleFlagged( sectionToFlag, rule );
        });
    });
}