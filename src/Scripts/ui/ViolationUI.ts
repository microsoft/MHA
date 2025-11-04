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

        const content = document.createElement("div");

        violationGroups.forEach(group => {
            const groupDiv = document.createElement("div");
            groupDiv.className = "diagnostic-group";

            const groupHeader = document.createElement("div");
            groupHeader.className = "diagnostic-group-header";

            const badge = document.createElement("span");
            badge.className = "severity-badge";
            badge.setAttribute("data-severity", group.severity);
            badge.textContent = group.severity.toUpperCase();
            groupHeader.appendChild(badge);

            const groupMessage = document.createElement("span");
            groupMessage.className = "violation-message";
            groupMessage.setAttribute("data-severity", group.severity);
            groupMessage.textContent = " " + group.displayName;
            groupHeader.appendChild(groupMessage);

            if (group.violations.length > 1) {
                const count = document.createElement("span");
                count.className = "violation-count";
                count.textContent = ` (${group.violations.length})`;
                groupHeader.appendChild(count);
            }

            groupDiv.appendChild(groupHeader);

            const violations = document.createElement("div");
            violations.className = "diagnostic-violations";

            const includeCardHeaders = group.violations.length > 1;
            group.violations.forEach(violation => {
                violations.appendChild(this.createViolationCard(violation, includeCardHeaders));
            });

            groupDiv.appendChild(violations);
            content.appendChild(groupDiv);
        });

        return content;
    }
}
