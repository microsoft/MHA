import { RuleViolation, ViolationGroup } from "../rules/types/AnalysisTypes";

export class ViolationUI {
    static createInlineViolation(violation: RuleViolation): HTMLElement {
        const container = document.createElement("span");
        container.className = "violation-inline";

        const badge = document.createElement("span");
        badge.className = "severity-badge";
        badge.setAttribute("data-severity", violation.rule.severity);
        badge.textContent = violation.rule.severity.toUpperCase();
        container.appendChild(badge);

        const message = document.createElement("span");
        message.className = "violation-message";
        message.setAttribute("data-severity", violation.rule.severity);
        message.textContent = " " + violation.rule.errorMessage;
        container.appendChild(message);

        return container;
    }

    static createViolationCard(violation: RuleViolation): HTMLElement {
        const card = document.createElement("div");
        card.className = "violation-card";
        card.setAttribute("data-severity", violation.rule.severity);

        const header = document.createElement("div");
        header.className = "violation-card-header";

        const badge = document.createElement("span");
        badge.className = "severity-badge";
        badge.setAttribute("data-severity", violation.rule.severity);
        badge.textContent = violation.rule.severity.toUpperCase();
        header.appendChild(badge);

        const message = document.createElement("span");
        message.className = "violation-message";
        message.setAttribute("data-severity", violation.rule.severity);
        message.textContent = " " + violation.rule.errorMessage;
        header.appendChild(message);

        card.appendChild(header);

        const details = document.createElement("div");
        details.className = "violation-details";

        const sectionInfo = document.createElement("div");
        sectionInfo.className = "violation-rule";
        const ruleInfo = `${violation.rule.checkSection || ""} / ${violation.rule.errorPattern || ""}`.trim();
        sectionInfo.textContent = ruleInfo;
        details.appendChild(sectionInfo);

        if (violation.parentMessage) {
            const parent = document.createElement("div");
            parent.className = "violation-parent-message";
            parent.textContent = `Part of: ${violation.parentMessage}`;
            details.appendChild(parent);
        }

        card.appendChild(details);

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

            group.violations.forEach(violation => {
                violations.appendChild(this.createViolationCard(violation));
            });

            groupDiv.appendChild(violations);
            content.appendChild(groupDiv);
        });

        return content;
    }
}
