import { RulesService, ValidationResult } from "./RulesService";

// Simple interface for header model to avoid type issues
interface IHeaderModel {
    summary: { rows: any[] };
    forefrontAntiSpamReport: { rows: any[] };
    antiSpamReport: { rows: any[] };
    otherHeaders: { rows: any[] };
}

export async function flagRuleViolations(header: IHeaderModel): Promise<ValidationResult> {
    console.log("🔍 flagRuleViolations: Starting simplified rule validation");

    try {
        // Load rules once (safe to call multiple times)
        await RulesService.loadRules();

        // Create sections array for validation
        const headerSections = [
            header.summary.rows,
            header.forefrontAntiSpamReport.rows,
            header.antiSpamReport.rows,
            header.otherHeaders.rows
        ];

        console.log("🔍 flagRuleViolations: Sections for validation:");
        console.log("🔍 flagRuleViolations: Summary rows:", header.summary.rows?.length || 0);
        console.log("🔍 flagRuleViolations: Forefront rows:", header.forefrontAntiSpamReport.rows?.length || 0);
        console.log("🔍 flagRuleViolations: AntiSpam rows:", header.antiSpamReport.rows?.length || 0);
        console.log("🔍 flagRuleViolations: Other rows:", header.otherHeaders.rows?.length || 0);

        // Single call validates all sections and returns structured results
        const result = RulesService.validateHeaders(headerSections);

        console.log("🔍 flagRuleViolations: Validation complete");
        console.log("🔍 flagRuleViolations: Has violations:", result.hasViolations);
        console.log("🔍 flagRuleViolations: Violated sections:", result.violatedSections.length);
        console.log("🔍 flagRuleViolations: Rule errors:", result.ruleErrors.length);

        // Log detailed results
        if (result.hasViolations) {
            result.ruleErrors.forEach(({ section, rules }) => {
                console.log(`🔍 flagRuleViolations: Section "${section.header}" has ${rules.length} rule violations:`,
                    rules.map(r => r.message));
            });
        }

        return result;
    } catch (error) {
        console.error("🔍 flagRuleViolations: Validation failed:", error);
        // Return empty result on error
        return {
            hasViolations: false,
            violatedSections: [],
            ruleErrors: []
        };
    }
}

export function mapHeaderToURL(headerName: string, text?: string): string | null {
    for (let i = 0; i < HeaderToURLMap.length; i++) {
        if (headerName.toLowerCase() === HeaderToURLMap[i][0].toLowerCase()) {
            return ["<a href = '", HeaderToURLMap[i][1], "' target = '_blank'>", text || headerName, "</a>"].join("");
        }
    }

    return null;
}

// Add the rule to the rulesFlagged component of the toObject.  This is used
// to flag sub-sections within a tab with a rule that they have violated.
export function AddRuleFlagged(toObject: any, rule: any): void {
    if (!toObject.rulesFlagged) {
        toObject.rulesFlagged = [];
    }

    if (Array.isArray(rule)) {
        rule.forEach(function (oneRule) { AddRuleFlagged(toObject, oneRule); });
    }
    else {
        pushUniqueRule(toObject.rulesFlagged, rule);
    }

    function pushUniqueRule(ruleArray: any[], rule: any): void {
        if (!arrayContains(ruleArray, rule)) {
            ruleArray.push(rule);
        }

        function arrayContains(array: any[], value: any): boolean {
            for (let index = 0; index < array.length; index++) {
                const entry = array[index];
                if (entry === value) {
                    return true;
                }
            }
            return false;
        }
    }
}

/// <disable>JS2073.CommentIsMisspelled</disable>
export const HeaderToURLMap = [
    ["Accept-Language", "https://tools.ietf.org/html/rfc3282"],
    ["Authentication-Results", "https://tools.ietf.org/html/rfc7601"],
    ["BCC", "https://tools.ietf.org/html/rfc5322#section-3.6.3"],
    ["CC", "https://tools.ietf.org/html/rfc5322#section-3.6.3"],
    ["Content-Description", "https://tools.ietf.org/html/rfc2045#section-8"],
    ["Content-Disposition", "https://tools.ietf.org/html/rfc2183"],
    ["Content-Id", "https://tools.ietf.org/html/rfc2045#section-7"],
    ["Content-Language", "https://tools.ietf.org/html/rfc3282"],
    ["Content-Transfer-Encoding", "https://tools.ietf.org/html/rfc2045#section-6"],
    ["Content-Type", "https://tools.ietf.org/html/rfc2045#section-5"],
    ["Date", "https://tools.ietf.org/html/rfc5322#section-3.6.1"],
    ["Deferred-Delivery", "https://tools.ietf.org/html/rfc4021#section-2.1.65"],
    ["DKIM-Signature", "https://tools.ietf.org/html/rfc6376"],
    ["From", "https://tools.ietf.org/html/rfc5322#section-3.6.2"],
    ["In-Reply-To", "https://tools.ietf.org/html/rfc5322#section-3.6.4"],
    ["Importance", "https://tools.ietf.org/html/rfc2156#section-5.3"],
    ["List-Help", "https://tools.ietf.org/html/rfc2369"],
    ["List-ID", "https://tools.ietf.org/html/rfc2919"],
    ["List-Subscribe", "https://tools.ietf.org/html/rfc2369"],
    ["List-Unsubscribe", "https://tools.ietf.org/html/rfc2369"],
    ["Message-ID", "https://tools.ietf.org/html/rfc5322#section-3.6.4"],
    ["MIME-Version", "https://tools.ietf.org/html/rfc2045#section-4"],
    ["Received", "https://tools.ietf.org/html/rfc5321#section-4.4"],
    ["Received-SPF", "https://tools.ietf.org/html/rfc4408#section-7"],
    ["References", "https://tools.ietf.org/html/rfc5322#section-3.6.4"],
    ["Reply-To", "https://tools.ietf.org/html/rfc5322#section-3.6.2"],
    ["Return-Path", "https://tools.ietf.org/html/rfc5322#section-3.6.7"],
    ["Sender", "https://tools.ietf.org/html/rfc5322#section-3.6.2"],
    ["Subject", "https://tools.ietf.org/html/rfc5322#section-3.6.5"],
    ["Thread-Index", "https://msdn.microsoft.com/en-us/library/ms526219"],
    ["Thread-Topic", "https://msdn.microsoft.com/en-us/library/ms526986"],
    ["To", "https://tools.ietf.org/html/rfc5322#section-3.6.3"],
    ["X-Auto-Response-Suppress", "https://msdn.microsoft.com/en-us/library/ee219609"],
    ["X-Forefront-Antispam-Report", "https://technet.microsoft.com/en-us/library/dn205071"],
    ["X-Forefront-Antispam-Report-Untrusted", "https://technet.microsoft.com/en-us/library/bb232136"],
    ["X-Forefront-Prvs", "https://technet.microsoft.com/en-us/library/dd639361"],
    ["X-Message-Flag", "https://msdn.microsoft.com/en-us/library/exchange/ms875195"],
    ["X-Microsoft-Antispam", "https://technet.microsoft.com/en-us/library/dn205071"],
    ["X-MS-Exchange-Organization-Antispam-Report", "https://technet.microsoft.com/en-us/library/aa996878"],
    ["X-MS-Exchange-Organization-AuthAs", "https://technet.microsoft.com/en-us/library/bb232136"],
    ["X-MS-Exchange-Organization-AuthMechanism", "https://technet.microsoft.com/en-us/library/bb232136"],
    ["X-MS-Exchange-Organization-AuthSource", "https://technet.microsoft.com/en-us/library/bb232136"],
    ["X-MS-Exchange-Organization-AutoForwarded", "https://msdn.microsoft.com/en-us/library/ee178180"],
    ["X-MS-Exchange-Organization-AVStamp-Mailbox", "https://technet.microsoft.com/en-us/library/bb232136"],
    ["X-MS-Exchange-Organization-Network-Message-Id", "https://technet.microsoft.com/en-us/library/bb232136"],
    ["X-MS-Exchange-Organization-PCL", "https://technet.microsoft.com/en-us/library/aa996878"],
    ["X-MS-Exchange-Organization-SCL", "https://technet.microsoft.com/en-us/library/aa996878"],
    ["X-MS-Exchange-Organization-SenderIdResult", "https://technet.microsoft.com/en-us/library/aa996878"],
    ["X-MS-Has-Attach", "https://msdn.microsoft.com/en-us/library/ee178420"],
    ["X-MS-TNEF-Correlator", "https://msdn.microsoft.com/en-us/library/ee219198"],
    ["X-Originating-IP", "https://en.wikipedia.org/wiki/X-Originating-IP"],
    ["X-Priority", "https://technet.microsoft.com/en-us/library/bb691107"]
];
/// <enable>JS2073.CommentIsMisspelled</enable>