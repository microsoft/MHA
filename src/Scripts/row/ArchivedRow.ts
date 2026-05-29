import { Strings } from "../Strings";
import { SummaryRow } from "./SummaryRow";

// Handle the "Archived-At" header per https://tools.ietf.org/html/rfc5064
export class ArchivedRow extends SummaryRow {
    constructor(header: string, label: string) {
        super(header, label);
        this.url = Strings.mapHeaderToURL(header, label);
    }
    // Return the URL for the archived message, or the encoded value if it's not a valid URL.
    override get valueUrl(): string {
        const match = this.valueInternal.match(/\s*<(.*)>\s*/i);
        if (match && match[1]){
            try{
                const url = new URL(match[1]);
                if (["http:", "https:"].includes(url.protocol)){
                    return ["<a href='", url.href, "' target='_blank'>", Strings.htmlEncode(url.href), "</a>"].join("");
                }
            } catch {
                // if we can't make URL from it, default to htmlEncode
            }
        }

        return Strings.htmlEncode(this.valueInternal);
    }
}