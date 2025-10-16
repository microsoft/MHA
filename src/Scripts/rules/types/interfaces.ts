// Type definitions for the rules engine

export interface HeaderSection {
    header: string;
    value: string;
}

export interface IValidationRule {
    checkSection: string;
    errorMessage: string;
    errorReportingSection: string[];
    cssEntryPrefix: string;
    ruleNumber: number;
    primaryRule: boolean;
}

export interface ISimpleValidationRule extends IValidationRule {
    errorPattern: string;
    violatesRule(section: string, sectionText: string): string | null;
}

export interface IComplexValidationRule extends IValidationRule {
    violatesComplexRule(setOfSections: HeaderSection[][]): boolean;
}

export interface IAndValidationRule extends IComplexValidationRule {
    rulesToAndArray: ISimpleValidationRule[];
    errorPattern: string;
}

// JSON data interfaces (matching the actual JSON structure)
/* eslint-disable @typescript-eslint/naming-convention */
export interface IRuleData {
    RuleType: "SimpleRule" | "HeaderMissingRule";
    SectionToCheck: string;
    PatternToCheckFor?: string;
    MessageWhenPatternFails: string;
    SectionsInHeaderToShowError: string[];
    CssPrefix?: string;
}

export interface IAndRuleData {
    Message: string;
    SectionsInHeaderToShowError: string[];
    CssPrefix?: string;
    RulesToAnd: IRuleData[];
}

export interface IRulesResponse {
    IsError: boolean;
    Message: string;
    SimpleRules: IRuleData[];
    AndRules: IAndRuleData[];
}
/* eslint-enable @typescript-eslint/naming-convention */