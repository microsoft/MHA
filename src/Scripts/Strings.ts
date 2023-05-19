import * as $ from "jquery";
import { Diagnostics } from "./diag";

export class strings {
    public static copyToClipboard(str: string): void {
        const textArea: HTMLTextAreaElement = document.createElement("textarea");
        textArea.style.position = "absolute";
        textArea.style.opacity = "0";
        textArea.value = str;
        document.body.appendChild(textArea);
        textArea.select();
        const succeeded: boolean = document.execCommand("copy");
        document.body.removeChild(textArea);
        Diagnostics.trackEvent({ name: "copy", properties: { succeeded: succeeded, style: "textarea" } });

        if (!succeeded) {
            try {
                navigator.clipboard.writeText(str).then(function (): void {
                    Diagnostics.trackEvent({ name: "copy", properties: { succeeded: "true", style: "navigator" } });
                }, function () {
                    Diagnostics.trackEvent({ name: "copy", properties: { succeeded: "false", style: "navigator" } });
                });
            }
            catch (e) { /**/ }
        }

        try {
            const queryOpts: PermissionDescriptor = { name: "clipboard-write" as PermissionName };
            navigator.permissions.query(queryOpts).then(function (result: PermissionStatus) {
                Diagnostics.trackEvent({ name: "copy", properties: { succeeded: succeeded, style: "permissions", clipboardWrite: result.state } });
            });
        }
        catch (e) { /**/ }
    }

    private static headerToURLMap: string[][] = [
        ["Accept-Language", "https://tools.ietf.org/html/rfc3282"],
        ["Archived-At", "https://tools.ietf.org/html/rfc5064"],
        ["ARC-Authentication-Results", "https://tools.ietf.org/html/rfc8617#section-4.1.1"],
        ["ARC-Message-Signature", "https://tools.ietf.org/html/rfc8617#section-4.1.2"],
        ["ARC-Seal", "https://tools.ietf.org/html/rfc8617#section-4.1.3"],
        ["Authentication-Results", "https://tools.ietf.org/html/rfc8601"],
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
        ["X-Forefront-Antispam-Report", "https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers"],
        ["X-Forefront-Antispam-Report-Untrusted", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-Forefront-Prvs", "https://technet.microsoft.com/en-us/library/dd639361"],
        ["X-Message-Flag", "https://msdn.microsoft.com/en-us/library/exchange/ms875195"],
        ["X-Microsoft-Antispam", "https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers"],
        ["X-MS-Exchange-Organization-Antispam-Report", "https://technet.microsoft.com/en-us/library/aa996878"],
        ["X-MS-Exchange-Organization-AuthAs", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-AuthMechanism", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-AuthSource", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-AutoForwarded", "https://msdn.microsoft.com/en-us/library/ee178180"],
        ["X-MS-Exchange-Organization-AVStamp-Enterprise", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-AVStamp-Mailbox", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-Network-Message-Id", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-PCL", "https://technet.microsoft.com/en-us/library/aa996878"],
        ["X-MS-Exchange-Organization-SCL", "https://technet.microsoft.com/en-us/library/aa996878"],
        ["X-MS-Exchange-Organization-SenderIdResult", "https://technet.microsoft.com/en-us/library/aa996878"],
        ["X-MS-Has-Attach", "https://msdn.microsoft.com/en-us/library/ee178420"],
        ["X-MS-TNEF-Correlator", "https://msdn.microsoft.com/en-us/library/ee219198"],
        ["X-Originating-IP", "https://en.wikipedia.org/wiki/X-Originating-IP"],
        ["X-Priority", "https://technet.microsoft.com/en-us/library/bb691107"],
        ["SFS", "https://docs.microsoft.com/en-us/exchange/monitoring/trace-an-email-message/run-a-message-trace-and-view-results"]
    ];

    public static htmlEncode(value: string): string { return value ? $("<div />").text(value).html() : ""; }

    public static mapHeaderToURL(headerName: string, text?: string): string {
        let url: string = "";
        strings.headerToURLMap.forEach((h: string[]) => {
            if (url === "" && headerName.toLowerCase() === h[0]?.toLowerCase()) {
                url = h[1] ?? "";
            }
        });

        if (url !== "") {
            return ["<a href = '", url, "' target = '_blank'>", this.htmlEncode(text || headerName), "</a>"].join("");
        }

        return "";
    }

    public static mapValueToURL(text: string): string {
        try {
            return ["<a href='", text, "' target='_blank'>", this.htmlEncode(text), "</a>"].join("");
        } catch (e) {
            return text;
        }
    }

    // Join an array with char, dropping empty/missing entries
    public static joinArray(array: (string | number | null)[] | null, char: string): string {
        if (!array) return "";
        return (array.filter(function (item) { return item; })).join(char);
    }
}