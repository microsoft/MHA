import { Decoder } from "./2047";
import { Poster } from "./Poster";
import { AntiSpamReport } from "./row/Antispam";
import { ForefrontAntiSpamReport } from "./row/ForefrontAntispam";
import { Header } from "./row/Header";
import { Summary } from "./Summary";
import { Other } from "./table/Other";
import { Received } from "./table/Received";

export class HeaderModel {
    public originalHeaders: string;
    public summary: Summary;
    public receivedHeaders: Received;
    public forefrontAntiSpamReport: ForefrontAntiSpamReport;
    public antiSpamReport: AntiSpamReport;
    public otherHeaders: Other;
    private hasDataInternal: boolean;
    private statusInternal: string;
    public get hasData(): boolean { return this.hasDataInternal || !!this.statusInternal; }
    public get status(): string { return this.statusInternal; }
    public set status(value) { this.statusInternal = value; }
    [index: string]: unknown;

    constructor(headers?: string) {
        this.summary = new Summary();
        this.receivedHeaders = new Received();
        this.forefrontAntiSpamReport = new ForefrontAntiSpamReport();
        this.antiSpamReport = new AntiSpamReport();
        this.otherHeaders = new Other();
        this.originalHeaders = "";
        this.statusInternal = "";
        this.hasDataInternal = false;
        if (headers) {
            this.parseHeaders(headers);
            Poster.postMessageToParent("modelToString", this.toString());
        }
    }

    public getHeaderList(headers: string): Header[] {
        // First, break up out input by lines.
        // Keep empty lines for recognizing the boundary between the header section & the body.
        const lines: string[] = headers.split(/\r\n|\r|\n/);

        const headerList: Header[] = [];
        let iNextHeader = 0;
        let prevHeader: Header | undefined;
        let body = false;
        headerSection: while (!body) {
            unfoldLines: for (let line of lines) {
                // Handling empty lines. The body is separated from the header section by an empty line (RFC 5322, 2.1).
                // To avoid processing the body as headers we should stop there, as someone might paste an entire message.
                // Empty lines at the beginning can be omitted, because that could be a common copy-paste error.
                if (body) break headerSection;
                if (line === "") {
                    if (headerList.length > 0) body = true;
                    continue unfoldLines;
                }

                // Recognizing a header:
                // - First colon comes before first white space.
                // - We're not strictly honoring white space folding because initial white space
                // - is commonly lost. Instead, we heuristically assume that space before a colon must have been folded.
                // This expression will give us:
                // match[1] - everything before the first colon, assuming no spaces (header).
                // match[2] - everything after the first colon (value).
                const match: RegExpMatchArray | null = line.match(/(^[\w-.]*?): ?(.*)/);

                // There's one false positive we might get: if the time in a Received header has been
                // folded to the next line, the line might start with something like "16:20:05 -0400".
                // This matches our regular expression. The RFC does not preclude such a header, but I've
                // never seen one in practice, so we check for and exclude 'headers' that
                // consist only of 1 or 2 digits.
                if (match && match[1] && !match[1].match(/^\d{1,2}$/)) {
                    headerList[iNextHeader] = new Header(match[1], match[2] ?? "");
                    prevHeader = headerList[iNextHeader];
                    iNextHeader++;
                } else {
                    if (iNextHeader > 0) {
                        // Tack this line to the previous line
                        // All folding whitespace should collapse to a single space
                        line = line.replace(/^[\s]+/, "");
                        if (!line) continue unfoldLines;
                        if (prevHeader) {
                            const separator: string = prevHeader.value ? " " : "";
                            prevHeader.value += separator + line;
                        }
                    } else {
                        // If we didn't have a previous line, go ahead and use this line
                        if (line.match(/\S/g)) {
                            headerList[iNextHeader] = new Header("", line);
                            prevHeader = headerList[iNextHeader];
                            iNextHeader++;
                        }
                    }
                }
            }
            break headerSection;
        }

        // 2047 decode our headers now
        headerList.forEach((header: Header) => {
            // Clean 2047 encoding
            // Strip nulls
            // Strip trailing carriage returns
            header.value = Decoder.clean2047Encoding(header.value).replace(/\0/g, "").replace(/[\n\r]+$/, "");
        });

        return headerList;
    }

    public parseHeaders(headers: string): void {
        // Initialize originalHeaders in case we have parsing problems
        // Flatten CRLF to LF to avoid extra blank lines
        this.originalHeaders = headers.replace(/(?:\r\n|\r|\n)/g, "\n");
        const headerList: Header[] = this.getHeaderList(headers);

        if (headerList.length > 0) {
            this.hasDataInternal = true;
        }

        headerList.forEach((header: Header) => {
            // Grab values for our summary pane
            if (this.summary.add(header)) return;

            // Properties with special parsing
            if (this.forefrontAntiSpamReport.add(header)) return;
            if (this.antiSpamReport.add(header)) return;
            if (this.receivedHeaders.add(header)) return;
            this.otherHeaders.add(header);
        });

        this.summary.totalTime = this.receivedHeaders.computeDeltas();
    }

    public toString(): string {
        const ret: string[] = [];
        if (this.summary.exists()) ret.push(this.summary.toString());
        if (this.receivedHeaders.exists()) ret.push(this.receivedHeaders.toString());
        if (this.forefrontAntiSpamReport.exists()) ret.push(this.forefrontAntiSpamReport.toString());
        if (this.antiSpamReport.exists()) ret.push(this.antiSpamReport.toString());
        if (this.otherHeaders.exists()) ret.push(this.otherHeaders.toString());
        return ret.join("\n\n");
    }
}
