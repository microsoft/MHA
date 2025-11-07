import { OtherRow } from "../../row/OtherRow";
import { AndValidationRule } from "../types/AndValidationRule";
import { HeaderSectionMissingRule } from "../types/HeaderSectionMissingRule";
import { HeaderSection, IAndRuleData, IComplexValidationRule, IRuleData, ISimpleValidationRule, IValidationRule } from "../types/interfaces";
import { SimpleValidationRule } from "../types/SimpleValidationRule";

// Add the rule to the rulesFlagged component of the toObject.  This is used
// to flag sub-sections within a tab with a rule that they have violated.
function addRuleFlagged( toObject: HeaderSection, rule: IValidationRule | IValidationRule[] ): void
{
    if ( !toObject.rulesFlagged )
    {
        toObject.rulesFlagged = [];
    }

    if ( Array.isArray( rule ) )
    {
        rule.forEach( function ( oneRule ) { addRuleFlagged( toObject, oneRule ); } );
    }
    else
    {
        pushUniqueRule( toObject.rulesFlagged, rule );
    }

    function pushUniqueRule(ruleArray: IValidationRule[], rule: IValidationRule): void {

        if (!arrayContains(ruleArray, rule))
        {
            ruleArray.push(rule);
        }

        function arrayContains(array: IValidationRule[], value: IValidationRule): boolean
        {
            for (let index = 0; index < array.length; index++) {
                const entry = array[index];

                if (entry === value) {
                    return true;
                };
            };
            return false;
        };
    }
}

type ValidationRule = ISimpleValidationRule | IComplexValidationRule;

export class HeaderValidationRulesEngine {
    private validationRuleSet: ValidationRule[] = [];
    /**
     * Find all the Violations that exist in the section. This only tests for violations of simple rules
     * (rules that implement 'violatesRule') as complex rules apply across multiple sections.
     */
    public findViolations(section: string, sectionText: string): ISimpleValidationRule[] {
        const rulesViolated: ISimpleValidationRule[] = [];

        this.validationRuleSet.forEach((rule) => {
            if (this.isSimpleRule(rule)) {
                const flaggedText = rule.violatesRule(section, sectionText);

                if (flaggedText) {
                    rulesViolated.push(rule);
                }
            }
        });

        return rulesViolated;
    }

    /**
     * Flag all rows within the tab (set of sections to display) that violate a rule
     */
    public flagAllRowsWithViolations(tabData: HeaderSection[], setOfSections: HeaderSection[][]): void {
        // for each section in the set of data displayed on one tab
        tabData.forEach((tabDataSection) => {
            // Find any violations of rules for that section
            const newItemsFlagged = this.findViolations(tabDataSection.header, tabDataSection.value);

            // For each rule that was violated
            newItemsFlagged.forEach((ruleFlagged) => {
                // Flag the section that the rule that was violated says to mark with an error message
                this.flagRuleInSections(ruleFlagged, setOfSections);
            });
        });
    }

    /**
     * Find and flag all the complex rules that are violated. Label the sections that the violated rule
     * says to mark the error on.
     */
    public findComplexViolations(setOfSections: HeaderSection[][]): void {
        // for each of the rules that have been defined
        this.validationRuleSet.forEach((rule) => {
            // IF it is a complex rule
            if (this.isComplexRule(rule)) {
                // Check Complex rule
                if (rule.violatesComplexRule(setOfSections)) {
                    // IF it's an AND rule with subrules, only flag the child rules with parent context
                    if (this.isAndRule(rule)) {
                        // Show sub-rules with message and parent context
                        rule.rulesToAndArray.forEach((reportRule) => {
                            if (reportRule && reportRule.errorMessage !== "") {
                                // Attach parent AND rule information to child rule
                                reportRule.parentAndRule = {
                                    message: rule.errorMessage,
                                    severity: rule.severity || "error"
                                };
                                this.flagRuleInSections(reportRule, setOfSections);
                            }
                        });
                    } else {
                        // For non-AND rules, flag the rule itself
                        this.flagRuleInSections(rule, setOfSections);
                    }
                }
            }
        });
    }

    /**
     * Add Rule to the set of rules to check the header for
     */
    public addRule(newRule: ValidationRule): void {
        this.validationRuleSet.push(newRule);
    }

    /**
     * Set the rules from JSON data
     */
    public setRules(simpleRuleSet?: IRuleData[], andRuleSet?: IAndRuleData[]): void {
        // Clear existing rules
        this.validationRuleSet = [];

        if (simpleRuleSet) {
            for (let ruleIndex = 0; ruleIndex < simpleRuleSet.length; ruleIndex++) {
                const newRule = simpleRuleSet[ruleIndex];

                if (newRule && newRule.RuleType === "SimpleRule") {
                    this.addRule(new SimpleValidationRule(
                        newRule.SectionToCheck,
                        newRule.PatternToCheckFor || "",
                        newRule.MessageWhenPatternFails,
                        newRule.SectionsInHeaderToShowError,
                        newRule.Severity
                    ));
                } else if (newRule && newRule.RuleType === "HeaderMissingRule") {
                    this.addRule(new HeaderSectionMissingRule(
                        newRule.SectionToCheck,
                        newRule.MessageWhenPatternFails,
                        newRule.SectionsInHeaderToShowError,
                        newRule.Severity
                    ));
                }
            }
        }

        if (andRuleSet) {
            for (let ruleIndex = 0; ruleIndex < andRuleSet.length; ruleIndex++) {
                const newRule = andRuleSet[ruleIndex];

                if (newRule && newRule.RulesToAnd) {
                    // Create set of rules to and
                    const rulesToAnd: SimpleValidationRule[] = [];
                    for (let ruleToAndIndex = 0; ruleToAndIndex < newRule.RulesToAnd.length; ruleToAndIndex++) {
                        const newAndRule = newRule.RulesToAnd[ruleToAndIndex];

                        if (newAndRule) {
                            rulesToAnd.push(new SimpleValidationRule(
                                newAndRule.SectionToCheck,
                                newAndRule.PatternToCheckFor || "",
                                newAndRule.MessageWhenPatternFails,
                                newAndRule.SectionsInHeaderToShowError,
                                newAndRule.Severity
                            ));
                        }
                    }

                    this.addRule(new AndValidationRule(
                        newRule.Message,
                        newRule.SectionsInHeaderToShowError,
                        newRule.Severity,
                        rulesToAnd
                    ));
                }
            }
        }
    }

    private isSimpleRule(rule: ValidationRule): rule is ISimpleValidationRule {
        return "violatesRule" in rule;
    }

    private isComplexRule(rule: ValidationRule): rule is IComplexValidationRule {
        return "violatesComplexRule" in rule;
    }

    private isAndRule(rule: ValidationRule): rule is AndValidationRule {
        return "rulesToAndArray" in rule;
    }

    /**
     * Flag all the sections that the rule says to, as violating the rule
     */
    private flagRuleInSections(rule: IValidationRule, setOfSections: HeaderSection[][]): void {
        // Each rule has a set of sections that are to be flagged if the rule fails, with the
        // error message from the rule.

        // For each section the rule says to flag
        rule.errorReportingSection.forEach((sectionRuleSaysToFlag) => {
            // Find all occurrences of the section the rule says to flag
            const sectionsToFlag = findSectionSubSection(setOfSections, sectionRuleSaysToFlag);

            if (sectionsToFlag.length === 0) {
                // If no sections exist to flag, create a placeholder section
                // This allows the violation to appear in the diagnostic report
                // This is essential for HeaderSectionMissingRule (which checks for absent headers)
                // and also handles edge cases like misconfigured rules or typos in section names

                // Add the placeholder to the last section array (typically "Other" headers)
                if (setOfSections.length > 0) {
                    const lastSectionArray = setOfSections[setOfSections.length - 1];
                    if (lastSectionArray) {
                        // Create a proper OtherRow instance with appropriate number
                        const rowNumber = lastSectionArray.length + 1;
                        // Use a non-empty value so the row appears in new UI (which filters out empty values)
                        const placeholderSection = new OtherRow(rowNumber, sectionRuleSaysToFlag, "(missing)");

                        lastSectionArray.push(placeholderSection);

                        // Flag the placeholder section
                        addRuleFlagged(placeholderSection, rule);
                    }
                }
            } else {
                // For each of the sections that are to be flagged, associate the rule with the section
                sectionsToFlag.forEach((sectionToFlag) => {
                    addRuleFlagged(sectionToFlag, rule);
                });
            }
        });

        // If this is a simple rule with a KEY:VALUE pattern, also flag the broken-out KEY row
        // (e.g., X-Forefront-Antispam-Report with pattern "SFV:SPM" also flags the "SFV" row)
        const simpleRule = rule as ISimpleValidationRule;
        if ("violatesRule" in simpleRule) {
            // Check if pattern matches KEY:VALUE format
            const match = simpleRule.errorPattern.match(/^([A-Z]+):(.+)$/);

            if (match && match[1]) {
                const breakoutSectionName = match[1];

                // Find the broken-out row section (e.g., "SFV", "IPV", "BCL", etc.)
                const breakoutSections = findSectionSubSection(setOfSections, breakoutSectionName);

                // Flag the broken-out section with this same rule
                breakoutSections.forEach((breakoutSection) => {
                    addRuleFlagged(breakoutSection, rule);
                });
            }
        }
    }
}

// Create the only instance of the rules list
export const headerValidationRules = new HeaderValidationRulesEngine();

/**
 * In the set of sections (array of array of sections) find all of them with particular name
 */
export function findSectionSubSection(setOfSections: HeaderSection[][], subSectionLookingFor: string): HeaderSection[] {
    const results: HeaderSection[] = [];

    setOfSections.forEach((section) => {
        section.forEach((subSection) => {
            if (subSection.header === subSectionLookingFor) {
                results.push(subSection);
            }
        });
    });

    return results;
}