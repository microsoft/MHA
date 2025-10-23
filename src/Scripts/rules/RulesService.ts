// Rules service - the main rules engine for processing headers
// This facade wraps the complex rules engine and provides a clean interface

import { HeaderModel } from "../HeaderModel";
import { headerValidationRules } from "./engine/HeaderValidationRules";
import { getRules, ruleStore } from "./loaders/GetRules";
import { AnalysisResult, RuleViolation, ViolationGroup } from "./types/AnalysisTypes";
import { HeaderSection, IValidationRule } from "./types/interfaces";

class RulesService {
    private rulesLoaded = false;
    private loadingPromise: Promise<void> | null = null;

    /**
     * Load rules once at application startup
     * Can be called multiple times safely - subsequent calls return the same promise
     */
    private async loadRules(): Promise<void> {
        if (this.rulesLoaded) {
            return Promise.resolve();
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise<void>((resolve, reject) => {
            try {
                getRules(
                    () => {
                        console.log("🔍 RulesService: Rules loaded successfully");
                        console.log("🔍 RulesService: SimpleRules:", ruleStore.simpleRuleSet?.length || 0);
                        console.log("🔍 RulesService: AndRules:", ruleStore.andRuleSet?.length || 0);

                        headerValidationRules.setRules(ruleStore.simpleRuleSet, ruleStore.andRuleSet);
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
     * Analyze headers for rule violations - main entry point
     */
    public async analyzeHeaders(headerModel: HeaderModel): Promise<AnalysisResult> {
        try {
            // Load rules once (safe to call multiple times)
            await this.loadRules();

            // Create sections array for header processing
            const headerSections = [
                headerModel.summary.rows,
                headerModel.forefrontAntiSpamReport.rows,
                headerModel.antiSpamReport.rows,
                headerModel.otherHeaders.rows
            ];

            console.log("🔍 RulesService: Processing", headerSections.length, "sections");

            // Clear flags and run simple rules on each section
            headerSections.forEach(section => {
                if (Array.isArray(section)) {
                    // Clear existing flags
                    section.forEach((headerSection: HeaderSection) => {
                        if (headerSection && typeof headerSection === "object") {
                            delete headerSection.rulesFlagged;
                        }
                    });

                    // Run simple rules on this section
                    headerValidationRules.flagAllRowsWithViolations(section, headerSections);
                }
            });

            // Run complex rule validation (operates on all sections)
            headerValidationRules.findComplexViolations(headerSections);

            // Extract violations and build groups directly during evaluation
            const violations: RuleViolation[] = [];
            const groupMap = new Map<string, ViolationGroup>();

            headerSections.forEach(section => {
                if (Array.isArray(section)) {
                    section.forEach((headerSection: HeaderSection) => {
                        const rulesFlagged = headerSection.rulesFlagged;
                        if (rulesFlagged && rulesFlagged.length > 0) {
                            rulesFlagged.forEach((rule: IValidationRule) => {
                                // Type-safe access to errorPattern property
                                const hasErrorPattern = (rule: IValidationRule): rule is IValidationRule & { errorPattern: string } => {
                                    return "errorPattern" in rule && typeof (rule as unknown as { errorPattern?: string }).errorPattern === "string";
                                };

                                const parentAndRule = rule.parentAndRule;

                                const violation: RuleViolation = {
                                    rule: rule,
                                    section: headerSection,
                                    highlightPattern: hasErrorPattern(rule) ? rule.errorPattern : undefined,
                                    ...(parentAndRule?.message && { parentMessage: parentAndRule.message })
                                };

                                violations.push(violation);

                                // Use explicit AND rule information
                                const isAndRule = !!rule.parentAndRule;
                                const displayName = isAndRule ? rule.parentAndRule!.message : rule.errorMessage;
                                const severity = isAndRule ? rule.parentAndRule!.severity : rule.severity;
                                const groupKey = displayName;

                                if (!groupMap.has(groupKey)) {
                                    groupMap.set(groupKey, {
                                        groupId: `group-${groupKey.replace(/\s+/g, "-").toLowerCase()}`,
                                        displayName,
                                        severity,
                                        isAndRule,
                                        violations: []
                                    });
                                }

                                const group = groupMap.get(groupKey)!;
                                group.violations.push(violation);
                            });
                        }
                    });
                }
            });

            const violationGroups = Array.from(groupMap.values());

            console.log("Rule violations found:", violations.length);
            console.log("Violation groups found:", violationGroups.length);

            return {
                success: true,
                enrichedHeaders: headerModel,
                violations,
                violationGroups
            };
        } catch (error) {
            console.error("Rules analysis failed:", error);

            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown analysis error",
                enrichedHeaders: headerModel,
                violations: [],
                violationGroups: []
            };
        }
    }

    /**
     * Check if rules are loaded and service is ready
     */
    public isReady(): boolean {
        return this.rulesLoaded;
    }
}

// Export singleton instance
export const rulesService = new RulesService();