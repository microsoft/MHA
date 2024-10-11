import cptable from "codepage";
import { Block } from "./block";

export class Decoder {
    // http://tools.ietf.org/html/rfc2047
    // http://tools.ietf.org/html/rfc2231

    private static getBlock(token: string): Block {
        const matches = token.match(/=\?(.*?)\?(.)\?(.*?)\?=/m);
        if (matches) {
            return <Block>{ charset: matches[1], type: matches[2]?.toUpperCase(), text: matches[3] };
        }

        return <Block>{ text: token, };
    }

    private static splitToBlocks(buffer: string): Block[] {
        const unparsedblocks: Block[] = [];
        //split string into blocks
        while (buffer.length) {
            try {
                const matches = buffer.match(/([\S\s]*?)(=\?.*?\?.\?.*?\?=)([\S\s]*)/m);
                if (matches) {
                    if (matches[1]) {
                        unparsedblocks.push(<Block>{ text: matches[1] });
                    }

                    if (matches[2]) {
                        unparsedblocks.push(Decoder.getBlock(matches[2]));
                    }

                    buffer = matches[3] ?? "";
                } else if (buffer) {
                    // Once we're out of matches, we've parsed the whole string.
                    // Append the rest of the buffer to the result.
                    unparsedblocks.push(<Block>{ text: buffer });
                    break;
                }
            }
            catch {
                // Firefox will throw when passed a large non-matching buffer
                // Such a buffer isn't a match anyway, so we just push it as raw text
                unparsedblocks.push(<Block>{ text: buffer });
                buffer = "";
            }
        }

        return unparsedblocks;
    }

    private static fixCharSet(charSet: string): string {
        switch (charSet.toUpperCase()) {
            case "UTF 8": return "UTF-8";
            default: return charSet;
        }
    }

    private static getCodePage(charSet: string): number {
        // https://msdn.microsoft.com/en-us/library/windows/desktop/dd317756(v=vs.85).aspx
        switch (charSet.toUpperCase()) {
            case "UTF-8": return 65001;
            case "ISO-8859-8": return 28598;
            case "ISO-8859-1": return 28591;
            case "US-ASCII": return 20127;
            case "WINDOWS-1252": return 1252;
            case "GB2312": return 936;
            case "EUC-KR": return 51949;
            default: return 65001;
        }
    }

    public static decodeHexCodepage(charSet: string, hexArray: number[]): string {
        if (window.TextDecoder) {
            return (new TextDecoder(Decoder.fixCharSet(charSet))).decode(new Uint8Array(hexArray).buffer);
        }
        else if (cptable) {
            return cptable.utils.decode(Decoder.getCodePage(charSet), hexArray);
        }

        throw new Error("decodeHexCodepage: no decoder found");
    }

    // Javascript auto converted from C# implementation + improvements.
    private static base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    public static decodeBase64(charSet: string, input: string): string {
        if (!input) {
            return input;
        }

        // Only decode if we think this is valid base64
        if (RegExp(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/).test(input) === true) {
            const $v$0 = [];
            let $v$1, $v$2, $v$3, $v$4, $v$5, $v$6, $v$7;
            let $v$8 = 0;
            while ($v$8 < input.length) {
                $v$4 = Decoder.base64Chars.indexOf(input.charAt($v$8++));
                $v$5 = Decoder.base64Chars.indexOf(input.charAt($v$8++));
                $v$6 = Decoder.base64Chars.indexOf(input.charAt($v$8++));
                $v$7 = Decoder.base64Chars.indexOf(input.charAt($v$8++));
                $v$1 = $v$4 << 2 | $v$5 >> 4;
                $v$2 = ($v$5 & 15) << 4 | $v$6 >> 2;
                $v$3 = ($v$6 & 3) << 6 | $v$7;

                if ($v$7 !== 64) {
                    $v$0.push($v$1, $v$2, $v$3);
                } else if ($v$6 !== 64) {
                    $v$0.push($v$1, $v$2);
                } else {
                    $v$0.push($v$1);
                }
            }

            try {
                return Decoder.decodeHexCodepage(charSet, $v$0);
            }
            catch { /**/ }
        }

        // Since we failed to decode, put it all back
        return "=?" + charSet + "?B?" + input + "?=";
    }

    public static decodeHex(charSet: string, buffer: string): string {
        const result: string[] = [];

        while (buffer.length) {
            const matches = buffer.match(/(.*?)((?:=[0-9a-fA-F]{2,2})+)(.*)/m);
            if (matches) {
                ////var left = matches[1];
                ////var hex = matches[2];
                ////var right = matches[3];
                if (matches[2]) {
                    const hexes = matches[2].split("=").filter(function (i) { return i; });
                    const hexArray = [];
                    for (let iHex = 0; iHex < hexes.length; iHex++) {
                        hexArray.push(parseInt("0x" + hexes[iHex], 16));
                    }

                    result.push(matches[1] ?? "", Decoder.decodeHexCodepage(charSet, hexArray));
                }

                buffer = matches[3] ?? "";
            } else {
                // Once we're out of matches, we've decoded the whole string.
                // Append the rest of the buffer to the result.
                result.push(buffer);
                break;
            }
        }

        return result.join("");
    }

    public static decodeQuoted(charSet: string, buffer: string): string {
        if (!buffer) {
            return buffer;
        }

        try {
            // 2047 quoted allows _ as a replacement for space. Fix that first.
            const uriBuffer = buffer.replace(/_/g, " ");
            return Decoder.decodeHex(charSet, uriBuffer);
        } catch {
            // Since we failed to decode, put it all back
            return "=?" + charSet + "?Q?" + buffer + "?=";
        }
    }

    // Sample encodings from the RFC:
    ////From: =?US-ASCII?Q?Keith_Moore?= <moore@cs.utk.edu>
    ////To: =?ISO-8859-1?Q?Keld_J=F8rn_Simonsen?= <keld@dkuug.dk>
    ////CC: =?ISO-8859-1?Q?Andr=E9?= Pirard <PIRARD@vm1.ulg.ac.be>
    ////Subject: =?ISO-8859-1?B?SWYgeW91IGNhbiByZWFkIHRoaXMgeW8=?=
    ////    =?ISO-8859-2?B?dSB1bmRlcnN0YW5kIHRoZSBleGFtcGxlLg==?=
    ////From: Nathaniel Borenstein <nsb@thumper.bellcore.com>
    ////    (=?iso-8859-8?b?7eXs+SDv4SDp7Oj08A==?=)
    ////From: =?US-ASCII*EN?Q?Keith_Moore?= <moore@cs.utk.edu>

    public static clean2047Encoding(buffer: string): string {
        // We're decoding =?...?= tokens here.
        // Per RFC, white space between tokens is to be ignored.
        // Remove that white space.
        buffer = buffer.replace(/\?=\s*=\?/g, "?==?");

        const unparsedblocks = Decoder.splitToBlocks(buffer);

        const collapsedBlocks: Block[] = [];
        let previousBlock: Block;
        unparsedblocks.forEach((unparsedblock: Block, index: number) => {
            collapsedBlocks.push(unparsedblock);
            // Combine a block with the previous block if the charset matches
            if (index >= 1 &&
                unparsedblock.type === "Q" &&
                unparsedblock.type === previousBlock.type &&
                unparsedblock.charset === previousBlock.charset) {
                unparsedblock.text = previousBlock.text + unparsedblock.text;
                // Clear the previous block so we don't process it later
                collapsedBlocks[index - 1] = <Block>{};
            }

            previousBlock = unparsedblock;
        });

        const result: string[] = [];
        collapsedBlocks.forEach(function (block: Block): void {
            if (block.type === "B") {
                result.push(Decoder.decodeBase64(block.charset, block.text));
            }
            else if (block.type === "Q") {
                result.push(Decoder.decodeQuoted(block.charset, block.text));
            }
            else {
                result.push(block.text);
            }
        });

        return result.join("");
    }
}
