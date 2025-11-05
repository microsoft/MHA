import { RuleViolation, ViolationGroup } from "../rules/types/AnalysisTypes";

export class ViolationUI {
    static createInlineViolation(violation: RuleViolation): HTMLElement {
        const template = document.getElementById("violation-inline-template") as HTMLTemplateElement;
        if (!template) {
            throw new Error("Template not found: violation-inline-template");
        }

        const container = template.content.cloneNode(true) as DocumentFragment;
        const element = container.firstElementChild as HTMLElement;

        const badge = element.querySelector(".severity-badge") as HTMLElement;
        badge.setAttribute("data-severity", violation.rule.severity);
        badge.textContent = violation.rule.severity.toUpperCase();

        const message = element.querySelector(".violation-message") as HTMLElement;
        message.setAttribute("data-severity", violation.rule.severity);
        message.textContent = " " + violation.rule.errorMessage;

        return element;
    }

    static createViolationCard(violation: RuleViolation, includeHeader = true): HTMLElement {
        const template = document.getElementById("violation-card-template") as HTMLTemplateElement;
        if (!template) {
            throw new Error("Template not found: violation-card-template");
        }

        const container = template.content.cloneNode(true) as DocumentFragment;
        const card = container.firstElementChild as HTMLElement;
        card.setAttribute("data-severity", violation.rule.severity);

        const header = card.querySelector(".violation-card-header") as HTMLElement;
        if (!includeHeader && header) {
            // Remove the header with badge and message for single violations
            header.remove();
        } else if (header) {
            // Populate the header for multiple violations
            const badge = header.querySelector(".severity-badge") as HTMLElement;
            badge.setAttribute("data-severity", violation.rule.severity);
            badge.textContent = violation.rule.severity.toUpperCase();

            const message = header.querySelector(".violation-message") as HTMLElement;
            message.setAttribute("data-severity", violation.rule.severity);
            message.textContent = " " + violation.rule.errorMessage;
        }

        const sectionInfo = card.querySelector(".violation-rule") as HTMLElement;
        const ruleInfo = `${violation.rule.checkSection || ""} / ${violation.rule.errorPattern || ""}`.trim();
        sectionInfo.textContent = ruleInfo;

        const parent = card.querySelector(".violation-parent-message") as HTMLElement;
        if (violation.parentMessage) {
            parent.textContent = `Part of: ${violation.parentMessage}`;
        } else {
            parent.remove();
        }

        return card;
    }

    static buildDiagnosticsSection(violationGroups: ViolationGroup[]): HTMLElement | null {
        if (!violationGroups || violationGroups.length === 0) return null;

        const sectionTemplate = document.getElementById("diagnostics-section-template") as HTMLTemplateElement;
        const accordionTemplate = document.getElementById("diagnostics-accordion-template") as HTMLTemplateElement;
        const itemTemplate = document.getElementById("diagnostic-accordion-item-template") as HTMLTemplateElement;

        if (!itemTemplate) return null;

        // Build container: section template (mobile), accordion template (desktop), or plain div (classic)
        let container: HTMLElement;
        let accordion: HTMLElement;

        if (sectionTemplate) {
            const section = sectionTemplate.content.cloneNode(true) as DocumentFragment;
            accordion = section.querySelector(".diagnostics-accordion")!;
            container = section.firstElementChild as HTMLElement;
        } else if (accordionTemplate) {
            const accordionClone = accordionTemplate.content.cloneNode(true) as DocumentFragment;
            accordion = accordionClone.querySelector("fluent-accordion")!;
            container = accordion;
        } else {
            accordion = document.createElement("div");
            container = accordion;
        }

        // Build each accordion item
        violationGroups.forEach((group) => {
            const itemClone = itemTemplate.content.cloneNode(true) as DocumentFragment;

            // Set badge
            const badge = itemClone.querySelector(".severity-badge")!;
            badge.setAttribute("data-severity", group.severity);
            badge.textContent = group.severity.toUpperCase();

            // Set message
            const message = itemClone.querySelector(".violation-message")!;
            message.setAttribute("data-severity", group.severity);
            message.textContent = group.displayName;

            // Set count
            const count = itemClone.querySelector(".violation-count") as HTMLElement;
            if (group.violations.length > 1) {
                const countValue = count.querySelector(".violation-count-value");
                if (countValue) {
                    countValue.textContent = `${group.violations.length}`;
                } else {
                    count.textContent = ` (${group.violations.length})`;
                }
            } else {
                count.style.display = "none";
            }

            // Add violation cards
            const content = itemClone.querySelector(".diagnostic-content")!;
            const includeCardHeaders = group.violations.length > 1;
            group.violations.forEach((violation) => {
                content.appendChild(this.createViolationCard(violation, includeCardHeaders));
            });

            accordion.appendChild(itemClone);
        });

        return container;
    }
}
