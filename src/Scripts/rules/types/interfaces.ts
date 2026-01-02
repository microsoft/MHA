// Type definitions for the rules engine

export interface HeaderSection {
    header: string;
    value: string;
    label?: string;
    url?: string;
    headerName?: string;
    rulesFlagged?: IValidationRule[];
    // Properties specific to ReceivedRow
    from?: string;
    delay?: string;
    by?: string;
}

export interface IValidationRule {
    checkSection: string;
    errorMessage: string;
    errorReportingSection: string[];
    ruleNumber: number;
    primaryRule: boolean;
    severity: "error" | "warning" | "info";
    parentAndRule?: {
        message: string;
        severity: "error" | "warning" | "info";
    };
    errorPattern: string;
    matchedSection?: HeaderSection; // Specific section that matched this rule (used in AND rules)
}

export interface ISimpleValidationRule extends IValidationRule {
    violatesRule(section: HeaderSection): string | null;
}

export interface IComplexValidationRule extends IValidationRule {
    violatesComplexRule(setOfSections: HeaderSection[][]): boolean;
}

export interface IAndValidationRule extends IComplexValidationRule {
    rulesToAndArray: ISimpleValidationRule[];
}

// JSON data interfaces (matching the actual JSON structure)
/* eslint-disable @typescript-eslint/naming-convention */
export interface IRuleData {
    RuleType: "SimpleRule" | "HeaderMissingRule";
    SectionToCheck: string;
    PatternToCheckFor?: string;
    MessageWhenPatternFails: string;
    SectionsInHeaderToShowError: string[];
    Severity: "error" | "warning" | "info";
}

export interface IAndRuleData {
    Message: string;
    SectionsInHeaderToShowError: string[];
    Severity: "error" | "warning" | "info";
    RulesToAnd: IRuleData[];
}

export interface IRulesResponse {
    IsError: boolean;
    Message: string;
    SimpleRules: IRuleData[];
    AndRules: IAndRuleData[];
}
/* eslint-enable @typescript-eslint/naming-convention */