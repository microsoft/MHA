import { Strings } from "../Strings";
import { SummaryRow } from "./SummaryRow";

// Handle the "Archived-At" header per https://tools.ietf.org/html/rfc5064
export class ArchivedRow extends SummaryRow {
    constructor(header: string, label: string) {
        super(header, label);
    }
    // Return the URL for the archived message, or the encoded value if it's not a valid URL.
    override get valueUrl(): string {
        const match = this.valueInternal.match(/^\s*<([^>]+)>\s*$/);
        if (match?.[1]) {
            try {
                const url = new URL(match[1]);
                if (url.protocol === "http:" || url.protocol === "https:") {
                    const a = document.createElement("a");
                    a.href = url.href;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.textContent = url.href;
                    return a.outerHTML;
                }
            } catch {
                // Fall through to encoded output.
            }
        }

        return Strings.htmlEncode(this.valueInternal);
    }
}