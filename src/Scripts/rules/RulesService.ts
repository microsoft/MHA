// Rules service interface for UI components
// This facade wraps the complex rules engine and provides a clean, minimal interface

import { HeaderValidationRules } from "./engine/HeaderValidationRules";
import { AndRuleSet, GetRules, SimpleRuleSet } from "./loaders/GetRules";
import { HeaderSection, IValidationRule } from "./types/interfaces";

// Extended HeaderSection with optional rule flags for internal processing
interface HeaderSectionWithFlags extends HeaderSection {
    rulesFlagged?: IValidationRule[];
}

// Result type that contains everything the UI needs
export interface ValidationResult {
    hasViolations: boolean;
    violatedSections: HeaderSection[];
    ruleErrors: Array<{
        section: HeaderSection;
        rules: Array<{
            message: string;
            cssClass: string;
            pattern?: string;
        }>;
    }>;
}

// Service interface
export interface IRulesService {
    loadRules(): Promise<void>;
    validateHeaders(headerSections: HeaderSection[][]): ValidationResult;
    isReady(): boolean;
}

class RulesServiceImpl implements IRulesService {
    private rulesLoaded = false;
    private loadingPromise: Promise<void> | null = null;

    /**
     * Load rules once at application startup
     * Can be called multiple times safely - subsequent calls return the same promise
     */
    public async loadRules(): Promise<void> {
        if (this.rulesLoaded) {
            return Promise.resolve();
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise<void>((resolve, reject) => {
            try {
                GetRules(
                    () => {
                        console.log("🔍 RulesService: Rules loaded successfully");
                        console.log("🔍 RulesService: SimpleRules:", SimpleRuleSet?.length || 0);
                        console.log("🔍 RulesService: AndRules:", AndRuleSet?.length || 0);

                        HeaderValidationRules.setRules(SimpleRuleSet, AndRuleSet);
                        this.rulesLoaded = true;
                        resolve();
                    },
                    () => {
                        console.log("🔍 RulesService: Loading rules...");
                    }
                );
            } catch (error) {
                console.error("🔍 RulesService: Failed to load rules:", error);
                reject(error);
            }
        });

        return this.loadingPromise;
    }

    /**
     * Validate headers and return all violation information
     */
    public validateHeaders(headerSections: HeaderSection[][]): ValidationResult {
        if (!this.rulesLoaded) {
            console.warn("🔍 RulesService: Rules not loaded yet, returning empty result");
            return {
                hasViolations: false,
                violatedSections: [],
                ruleErrors: []
            };
        }

        console.log("🔍 RulesService: Validating headers with", headerSections.length, "sections");

        // Clear any existing flags on the sections to start fresh
        this.clearExistingFlags(headerSections);

        // Run the validation using the existing engine
        headerSections.forEach(section => {
            if (Array.isArray(section)) {
                HeaderValidationRules.flagAllRowsWithViolations(section, headerSections);
            }
        });

        // Run complex rule validation
        HeaderValidationRules.findComplexViolations(headerSections);

        // Extract the results into our simplified format
        return this.extractValidationResults(headerSections);
    }

    /**
     * Check if rules are loaded and service is ready
     */
    public isReady(): boolean {
        return this.rulesLoaded;
    }

    /**
     * Clear any existing rule flags from header sections
     */
    private clearExistingFlags(headerSections: HeaderSection[][]): void {
        headerSections.forEach(section => {
            if (Array.isArray(section)) {
                section.forEach(headerSection => {
                    if (headerSection && typeof headerSection === "object") {
                        // Clear any existing rulesFlagged property
                        delete (headerSection as HeaderSectionWithFlags).rulesFlagged;
                    }
                });
            }
        });
    }

    /**
     * Extract validation results from the flagged sections
     */
    private extractValidationResults(headerSections: HeaderSection[][]): ValidationResult {
        const violatedSections: HeaderSection[] = [];
        const ruleErrors: ValidationResult["ruleErrors"] = [];

        headerSections.forEach(section => {
            if (Array.isArray(section)) {
                section.forEach(headerSection => {
                    const rulesFlagged = (headerSection as HeaderSectionWithFlags).rulesFlagged;
                    if (rulesFlagged && rulesFlagged.length > 0) {
                        violatedSections.push(headerSection);

                        const rules = rulesFlagged.map((rule: IValidationRule) => {
                            const hasPattern = "errorPattern" in rule;
                            return {
                                message: rule.errorMessage || "",
                                cssClass: rule.cssEntryPrefix || "error",
                                pattern: hasPattern ? (rule as { errorPattern: string }).errorPattern : undefined
                            };
                        });

                        ruleErrors.push({
                            section: headerSection,
                            rules: rules
                        });
                    }
                });
            }
        });

        console.log("🔍 RulesService: Validation complete -", violatedSections.length, "violations found");

        return {
            hasViolations: violatedSections.length > 0,
            violatedSections,
            ruleErrors
        };
    }
}

// Export singleton instance
// eslint-disable-next-line @typescript-eslint/naming-convention
export const RulesService: IRulesService = new RulesServiceImpl();