import { Decoder } from "../2047";
import { Other } from "./Other";
import { Received } from "./Received";
import { AntiSpamReport } from "../row/Antispam";
import { ForefrontAntiSpamReport } from "../row/ForefrontAntispam";
import { RulesService, ValidationResult } from "../rules/RulesService";
import { Summary } from "../Summary";

// Simple interface for header model to avoid type issues
interface IHeaderModel {
    summary: { summaryRows: any[] };
    forefrontAntiSpamReport: { forefrontAntiSpamRows: any[] };
    antiSpamReport: { antiSpamRows: any[] };
    otherHeaders: { otherRows: any[] };
}

export const HeaderModel = function (headers) {
    // Initialize defaults
    this.summary = new Summary();
    this.receivedHeaders = new Received();
    this.forefrontAntiSpamReport = new ForefrontAntiSpamReport();
    this.antiSpamReport = new AntiSpamReport();
    this.otherHeaders = new Other();

    if (headers) {
        this.parseHeaders(headers);
    }
};

HeaderModel.prototype.status = "";
HeaderModel.prototype.summary = {};
HeaderModel.prototype.receivedHeaders = {};
HeaderModel.prototype.otherHeaders = {};
HeaderModel.prototype.forefrontAntiSpamReport = {};
HeaderModel.prototype.antiSpamReport = {};
HeaderModel.prototype.originalHeaders = "";
HeaderModel.prototype.hasData = false;

export const Header = function (header, value) {
    this.header = header;
    this.value = value;
};

Header.prototype.header = "";
Header.prototype.value = "";

HeaderModel.prototype.parseHeaders = function (headers) {
    // Initialize originalHeaders in case we have parsing problems
    this.originalHeaders = headers;
    const headerList = GetHeaderList(headers);

    if (headerList.length > 0) {
        this.hasData = true;
    }

    for (let i = 0; i < headerList.length; i++) {
        // Grab values for our summary pane
        this.summary.init(headerList[i]);

        // Properties with special parsing
        switch (headerList[i].header) {
            case "X-Forefront-Antispam-Report":
                this.forefrontAntiSpamReport.init(headerList[i].value);
                break;
            case "X-Microsoft-Antispam":
                this.antiSpamReport.init(headerList[i].value);
                break;
        }

        if (headerList[i].header === "Received") {
            this.receivedHeaders.init(headerList[i].value);
        } else if (headerList[i].header || headerList[i].value) {
            this.otherHeaders.init(headerList[i]);
        }
    }

    this.summary.totalTime = this.receivedHeaders.computeDeltas();
};

export async function flagRuleViolations(header: IHeaderModel): Promise<ValidationResult> {
    console.log("🔍 flagRuleViolations: Starting simplified rule validation");

    try {
        // Load rules once (safe to call multiple times)
        await RulesService.loadRules();

        // Create sections array for validation
        const headerSections = [
            header.summary.summaryRows,
            header.forefrontAntiSpamReport.forefrontAntiSpamRows,
            header.antiSpamReport.antiSpamRows,
            header.otherHeaders.otherRows
        ];

        console.log("🔍 flagRuleViolations: Sections for validation:");
        console.log("🔍 flagRuleViolations: Summary rows:", header.summary.summaryRows?.length || 0);
        console.log("🔍 flagRuleViolations: Forefront rows:", header.forefrontAntiSpamReport.forefrontAntiSpamRows?.length || 0);
        console.log("🔍 flagRuleViolations: AntiSpam rows:", header.antiSpamReport.antiSpamRows?.length || 0);
        console.log("🔍 flagRuleViolations: Other rows:", header.otherHeaders.otherRows?.length || 0);

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

function GetHeaderList(headers) {
    // First, break up out input by lines.
    const lines = headers.split(/[\n\r]+/);

    const headerList = [];
    let iNextHeader = 0;
    // Unfold lines
    for (let iLine = 0; iLine < lines.length; iLine++) {
        let line = lines[iLine];
        // Skip empty lines
        if (line === "") continue;

        // Recognizing a header:
        // - First colon comes before first white space.
        // - We're not strictly honoring white space folding because initial white space
        // - is commonly lost. Instead, we heuristically assume that space before a colon must have been folded.
        // This expression will give us:
        // match[1] - everything before the first colon, assuming no spaces (header).
        // match[2] - everything after the first colon (value).
        const match = line.match(/(^[\w-.]*?): ?(.*)/);

        // There's one false positive we might get: if the time in a Received header has been
        // folded to the next line, the line might start with something like "16:20:05 -0400".
        // This matches our regular expression. The RFC does not preclude such a header, but I've
        // never seen one in practice, so we check for and exclude 'headers' that
        // consist only of 1 or 2 digits.
        if (match && match[1] && !match[1].match(/^\d{1,2}$/)) {
            headerList[iNextHeader] = new Header(match[1], match[2]);
            iNextHeader++;
        } else {
            if (iNextHeader > 0) {
                // Tack this line to the previous line
                // All folding whitespace should collapse to a single space
                line = line.replace(/^[\s]+/, "");
                if (!line) continue;
                const separator = headerList[iNextHeader - 1].value ? " " : "";
                headerList[iNextHeader - 1].value += separator + line;
            } else {
                // If we didn't have a previous line, go ahead and use this line
                if (line.match(/\S/g)) {
                    headerList[iNextHeader] = new Header("", line);
                    iNextHeader++;
                }
            }
        }
    }

    // 2047 decode our headers now
    for (let iHeader = 0; iHeader < headerList.length; iHeader++) {
        // Clean 2047 encoding
        // Strip nulls
        // Strip trailing carriage returns
        const headerValue = Decoder.clean2047Encoding(headerList[iHeader].value).replace(/\0/g, "").replace(/[\n\r]+$/, "");
        headerList[iHeader].value = headerValue;
    }

    return headerList;
}

export function mapHeaderToURL(headerName, text) {
    for (let i = 0; i < HeaderToURLMap.length; i++) {
        if (headerName.toLowerCase() === HeaderToURLMap[i][0].toLowerCase()) {
            return ["<a href = '", HeaderToURLMap[i][1], "' target = '_blank'>", text || headerName, "</a>"].join("");
        }
    }

    return null;
}

// Add the rule to the rulesFlagged component of the toObject.  This is used
// to flag sub-sections within a tab with a rule that they have violated.
export function AddRuleFlagged( toObject, rule )
{
    if ( !toObject.rulesFlagged )
    {
        toObject.rulesFlagged = [];
    }

    if ( Array.isArray( rule ) )
    {
        rule.forEach( function ( oneRule ) { AddRuleFlagged( toObject, oneRule ); } );
    }
    else
    {
        pushUniqueRule( toObject.rulesFlagged, rule );
    }

    function pushUniqueRule(ruleArray, rule) {

        if (!arrayContains(ruleArray, rule))
        {
            ruleArray.push(rule);
        }

        function arrayContains(array, value)
        {
            for (let index = 0; index < array.length; index++) {
                const entry = array[index];

                if (entry === value) {
                    return true;
                };
            };
            return false;
        };
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
