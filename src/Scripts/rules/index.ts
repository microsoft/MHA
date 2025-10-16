// =============================================================================
// RULES ENGINE API
// =============================================================================

export { RulesService, IRulesService, ValidationResult } from "./RulesService";

// =============================================================================
// ADVANCED TYPES (for extending the rules engine)
// =============================================================================

// Rule type classes
export { SimpleValidationRule } from "./types/SimpleValidationRule";
export { AndValidationRule } from "./types/AndValidationRule";
export { HeaderSectionMissingRule } from "./types/HeaderSectionMissingRule";

// Type interfaces for advanced usage
export type {
    ISimpleValidationRule,
    IComplexValidationRule,
    IAndValidationRule,
    IRulesResponse,
    IRuleData,
    IAndRuleData,
    HeaderSection
} from "./types/interfaces";