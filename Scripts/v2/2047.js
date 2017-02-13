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
    var result = [];

    // We're decoding =?...?= tokens here.
    // Per RFC, white space between tokens is to be ignored.
    // Remove that white space.
    buffer = buffer.replace(/\?=\s*=\?/g, "?==?");

    while (buffer.length) {
        var matches = buffer.match(/(.*?)(=\?.*?\?.\?.*?\?=)(.*)/m);
        if (matches) {
            ////var left = matches[1];
            ////var token = matches[2];
            ////var right = matches[3];

            result.push(matches[1], decode2047Token(matches[2]));
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

function decode2047Token(token) {
    var decoding = token;
    var matches = token.match(/=\?(.*?)(?:\*.*)?\?(.)\?(.*?)\?=/m);
    if (matches) {
        ////var charSet = matches[1];
        ////var type = matches[2];
        ////var encoding = matches[3];

        switch (matches[2].toUpperCase()) {
            case "B":
                decoding = decodeBase64(matches[1], matches[3]);
                break;
            case "Q":
                decoding = decodeQuoted(matches[1], matches[3]);
                break;
        }
    }

    return decoding;
}

function decodeQuoted(charSet, buffer) {
    if (!buffer) {
        return buffer;
    }

    var decoded;

    try {
        decoded = decodeURIComponent(buffer.replace(/=/g, '%'));
    }
    catch (e) {
        // TODO: Figure out how to decode any character set properly
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
        $v$1 = ($v$4 << 2) | ($v$5 >> 4);
        $v$2 = (($v$5 & 15) << 4) | ($v$6 >> 2);
        $v$3 = (($v$6 & 3) << 6) | $v$7;

        if ($v$7 !== 64) {
            $v$0.push(String.fromCharCode($v$1, $v$2, $v$3));
        } else if ($v$6 !== 64) {
            $v$0.push(String.fromCharCode($v$1, $v$2));
        } else {
            $v$0.push(String.fromCharCode($v$1));
        }
    }

    return $v$0.join("");
};