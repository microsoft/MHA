/* global cptable */
/* exported clean2047Encoding */

/// <reference path="Table.js" />
/// <reference path="Strings.js" />

/// <disable>JS2026.CapitalizeComments,JS2027.PunctuateCommentsCorrectly,JS2073.CommentIsMisspelled</disable>
// http://tools.ietf.org/html/rfc2047
// http://tools.ietf.org/html/rfc2231

// Sample encodings from the RFC:
////From: =?US-ASCII?Q?Keith_Moore?= <moore@cs.utk.edu>
////To: =?ISO-8859-1?Q?Keld_J=F8rn_Simonsen?= <keld@dkuug.dk>
////CC: =?ISO-8859-1?Q?Andr=E9?= Pirard <PIRARD@vm1.ulg.ac.be>
////Subject: =?ISO-8859-1?B?SWYgeW91IGNhbiByZWFkIHRoaXMgeW8=?=
////    =?ISO-8859-2?B?dSB1bmRlcnN0YW5kIHRoZSBleGFtcGxlLg==?=
////From: Nathaniel Borenstein <nsb@thumper.bellcore.com>
////    (=?iso-8859-8?b?7eXs+SDv4SDp7Oj08A==?=)
////From: =?US-ASCII*EN?Q?Keith_Moore?= <moore@cs.utk.edu>
/// <enable>JS2026.CapitalizeComments,JS2027.PunctuateCommentsCorrectly,JS2073.CommentIsMisspelled</enable>

function clean2047Encoding(buffer) {
    // We're decoding =?...?= tokens here.
    // Per RFC, white space between tokens is to be ignored.
    // Remove that white space.
    buffer = buffer.replace(/\?=\s*=\?/g, "?==?");

    var unparsedblocks = [];
    //split string into blocks
    while (buffer.length) {
        var matches = buffer.match(/([\S\s]*?)(=\?.*?\?.\?.*?\?=)([\S\s]*)/m);
        if (matches) {
            if (matches[1]) {
                unparsedblocks.push({ text: matches[1] });
            }

            unparsedblocks.push(getBlock(matches[2]));
            buffer = matches[3];
        } else if (buffer) {
            // Once we're out of matches, we've parsed the whole string.
            // Append the rest of the buffer to the result.
            unparsedblocks.push({ text: buffer });
            break;
        }
    }

    var collapsedBlocks = [];
    for (var i = 0; i < unparsedblocks.length; i++) {
        collapsedBlocks.push(unparsedblocks[i]);

        // Combine a Q block with the previous Q block if the charset matches
        if (i >= 1 &&
            collapsedBlocks[i].type === "Q" && collapsedBlocks[i - 1].type === "Q" &&
            collapsedBlocks[i].charset === collapsedBlocks[i - 1].charset) {
            collapsedBlocks[i].text = collapsedBlocks[i - 1].text + collapsedBlocks[i].text;
            // Clear the previous block so we don't process it later
            collapsedBlocks[i - 1] = {};
        }
    }

    var result = [];
    collapsedBlocks.forEach(function (block) {
        if (block.type === "B") {
            result.push(decodeBase64(block.charset, block.text));
        }
        else if (block.type === "Q") {
            result.push(decodeQuoted(block.charset, block.text));
        }
        else {
            result.push(block.text);
        }
    });

    return result.join("");
}

function getBlock(token) {
    var matches = token.match(/=\?(.*?)(?:\*.*)?\?(.)\?(.*?)\?=/m);
    if (matches) {
        return { charset: matches[1], type: matches[2].toUpperCase(), text: matches[3] }
    }

    return { text: token, };
}

function decodeQuoted(charSet, buffer) {
    if (!buffer) {
        return buffer;
    }

    var decoded;

    try {
        // 2047 quoted allows _ as a replacement for space. Fix that first.
        var uriBuffer = buffer.replace(/_/g, " ");
        decoded = decodeHex(charSet, uriBuffer);
    } catch (e) {
        // Since we failed to decode, put it all back
        decoded = "=?" + charSet + "?Q?" + buffer + "?=";
    }

    return decoded;
}

// Javascript auto converted from C# implementation + improvements.
var $F = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function decodeBase64(charSet, input) {
    if (!input) {
        return input;
    }

    var $v$0 = [];
    var $v$1, $v$2, $v$3, $v$4, $v$5, $v$6, $v$7;
    var $v$8 = 0;
    while ($v$8 < input.length) {
        $v$4 = $F.indexOf(input.charAt($v$8++));
        $v$5 = $F.indexOf(input.charAt($v$8++));
        $v$6 = $F.indexOf(input.charAt($v$8++));
        $v$7 = $F.indexOf(input.charAt($v$8++));
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

    var decoded;
    try {
        decoded = decodeHexCodepage(charSet, $v$0);
    }
    catch (e) {
        // Since we failed to decode, put it all back
        decoded = "=?" + charSet + "?B?" + input + "?=";
    }

    return decoded;

}

function decodeHex(charSet, buffer) {
    var result = [];

    while (buffer.length) {
        var matches = buffer.match(/(.*?)((?:=[0-9a-fA-F]{2,2})+)(.*)/m);
        if (matches) {
            ////var left = matches[1];
            ////var hex = matches[2];
            ////var right = matches[3];
            var hexes = matches[2].split("=").filter(function (i) { return i; });
            var hexArray = [];
            for (var iHex = 0; iHex < hexes.length; iHex++) {
                hexArray.push(parseInt("0x" + hexes[iHex], 16));
            }

            result.push(matches[1], decodeHexCodepage(charSet, hexArray));
            buffer = matches[3];
        } else {
            // Once we're out of matches, we've decoded the whole string.
            // Append the rest of the buffer to the result.
            result.push(buffer);
            break;
        }
    }

    return result.join("");
}

function decodeHexCodepage(charSet, hexArray) {
    // https://msdn.microsoft.com/en-us/library/windows/desktop/dd317756(v=vs.85).aspx
    var codepage = 65001;
    switch (charSet.toUpperCase()) {
        case "UTF-8":
            codepage = 65001;
            break;
        case "ISO-8859-8":
            codepage = 28598;
            break;
        case "ISO-8859-1":
            codepage = 28591;
            break;
        case "US-ASCII":
            codepage = 20127;
            break;
        case "WINDOWS-1252":
            codepage = 1252;
            break;
        case "GB2312":
            codepage = 936;
            break;
    }

    return cptable.utils.decode(codepage, hexArray);
}