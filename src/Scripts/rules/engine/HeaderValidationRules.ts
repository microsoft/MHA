import { AddRuleFlagged } from "../../rules/RulesUtils";
import { AndValidationRule } from "../types/AndValidationRule";
import { HeaderSectionMissingRule } from "../types/HeaderSectionMissingRule";
import { HeaderSection, IAndRuleData, IComplexValidationRule, IRuleData, ISimpleValidationRule, IValidationRule } from "../types/interfaces";
import { SimpleValidationRule } from "../types/SimpleValidationRule";

type ValidationRule = ISimpleValidationRule | IComplexValidationRule;

export class HeaderValidationRulesEngine {
    private validationRuleSet: ValidationRule[] = [];

    constructor(overrideCreateRuleSetFunction?: (engine: HeaderValidationRulesEngine) => void) {
        if (overrideCreateRuleSetFunction) {
            overrideCreateRuleSetFunction(this);
        } else {
            // Create Default rule set (currently empty)
            this.createRuleSet();
        }
    }

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
                    // IF rule succeeds, find all sections we need to flag
                    this.flagRuleInSections(rule, setOfSections);

                    // IF it's an AND rule with subrules, flag those too
                    if (this.isAndRule(rule)) {
                        // Show sub-rules with message
                        rule.rulesToAndArray.forEach((reportRule) => {
                            if (reportRule && reportRule.errorMessage !== "") {
                                this.flagRuleInSections(reportRule, setOfSections);
                            }
                        });
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
     * Create the Rule Set to test the header for
     */
    private createRuleSet(): void {
        // Currently empty - rules are loaded dynamically via setRules
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

                if (newRule.RuleType === "SimpleRule") {
                    this.addRule(new SimpleValidationRule(
                        newRule.SectionToCheck,
                        newRule.PatternToCheckFor || "",
                        newRule.MessageWhenPatternFails,
                        newRule.SectionsInHeaderToShowError,
                        newRule.CssPrefix
                    ));
                } else if (newRule.RuleType === "HeaderMissingRule") {
                    this.addRule(new HeaderSectionMissingRule(
                        newRule.SectionToCheck,
                        newRule.MessageWhenPatternFails,
                        newRule.SectionsInHeaderToShowError,
                        newRule.CssPrefix
                    ));
                }
            }
        }

        if (andRuleSet) {
            for (let ruleIndex = 0; ruleIndex < andRuleSet.length; ruleIndex++) {
                const newRule = andRuleSet[ruleIndex];

                // Create set of rules to and
                const rulesToAnd: SimpleValidationRule[] = [];
                for (let ruleToAndIndex = 0; ruleToAndIndex < newRule.RulesToAnd.length; ruleToAndIndex++) {
                    const newAndRule = newRule.RulesToAnd[ruleToAndIndex];

                    rulesToAnd.push(new SimpleValidationRule(
                        newAndRule.SectionToCheck,
                        newAndRule.PatternToCheckFor || "",
                        newAndRule.MessageWhenPatternFails,
                        newAndRule.SectionsInHeaderToShowError,
                        newAndRule.CssPrefix
                    ));
                }

                this.addRule(new AndValidationRule(
                    newRule.Message,
                    newRule.SectionsInHeaderToShowError,
                    newRule.CssPrefix || "error",
                    rulesToAnd
                ));
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

            // For each of the sections that are to be flagged, associate the rule with the section
            sectionsToFlag.forEach((sectionToFlag) => {
                AddRuleFlagged(sectionToFlag, rule);
            });
        });
    }
}

// Create the only instance of the rules list
// eslint-disable-next-line @typescript-eslint/naming-convention
export const HeaderValidationRules = new HeaderValidationRulesEngine();

// For backward compatibility
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ClassHeaderValidationRules = HeaderValidationRulesEngine;

/**
 * Does the object implement the function?
 */
export function objectImplmentsFunction(obj: Record<string, unknown>, doThis: string): boolean {
    return typeof obj[doThis] === "function";
}

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