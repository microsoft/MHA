import * as QUnit from "qunit";
import { Decoder } from "../2047"

QUnit.test("RFC 2047 Tests", function (assert) {
    // Tests from https://tools.ietf.org/html/rfc2047
    assert.equal(Decoder.clean2047Encoding("=?US-ASCII?Q?Keith_Moore?= <moore@cs.utk.edu>"), "Keith Moore <moore@cs.utk.edu>");
    assert.equal(Decoder.clean2047Encoding("=?ISO-8859-1?Q?Keld_J=F8rn_Simonsen?= <keld@dkuug.dk>"), "Keld Jørn Simonsen <keld@dkuug.dk>");
    assert.equal(Decoder.clean2047Encoding("=?ISO-8859-1?Q?Andr=E9?= Pirard <PIRARD@vm1.ulg.ac.be>"), "André Pirard <PIRARD@vm1.ulg.ac.be>");
    assert.equal(Decoder.clean2047Encoding("=?ISO-8859-1?B?SWYgeW91IGNhbiByZWFkIHRoaXMgeW8=?=\n" +
        "    =?ISO-8859-2?B?dSB1bmRlcnN0YW5kIHRoZSBleGFtcGxlLg==?="), "If you can read this you understand the example.");
    assert.equal(Decoder.clean2047Encoding("=?ISO-8859-1?Q?Olle_J=E4rnefors?= <ojarnef@admin.kth.se>"), "Olle Järnefors <ojarnef@admin.kth.se>");
    assert.equal(Decoder.clean2047Encoding("ietf-822@dimacs.rutgers.edu, ojarnef@admin.kth.se"), "ietf-822@dimacs.rutgers.edu, ojarnef@admin.kth.se");
    assert.equal(Decoder.clean2047Encoding("Time for ISO 10646?"), "Time for ISO 10646?");
    assert.equal(Decoder.clean2047Encoding("Dave Crocker <dcrocker@mordor.stanford.edu>"), "Dave Crocker <dcrocker@mordor.stanford.edu>");
    assert.equal(Decoder.clean2047Encoding("ietf-822@dimacs.rutgers.edu, paf@comsol.se"), "ietf-822@dimacs.rutgers.edu, paf@comsol.se");
    assert.equal(Decoder.clean2047Encoding("=?ISO-8859-1?Q?Patrik_F=E4ltstr=F6m?= <paf@nada.kth.se>"), "Patrik Fältström <paf@nada.kth.se>");
    assert.equal(Decoder.clean2047Encoding("Re: RFC-HDR care and feeding"), "Re: RFC-HDR care and feeding");

    assert.equal(Decoder.clean2047Encoding("Nathaniel Borenstein <nsb@thumper.bellcore.com>\n" +
        "    (=?iso-8859-8?b?7eXs+SDv4SDp7Oj08A==?=)"), "Nathaniel Borenstein <nsb@thumper.bellcore.com>\n" +
    "    (םולש ןב ילטפנ)");

    assert.equal(Decoder.clean2047Encoding("Greg Vaudreuil <gvaudre@NRI.Reston.VA.US>, Ned Freed\n" +
        "    < ned@innosoft.com>, Keith Moore < moore@cs.utk.edu>"), "Greg Vaudreuil <gvaudre@NRI.Reston.VA.US>, Ned Freed\n" +
    "    < ned@innosoft.com>, Keith Moore < moore@cs.utk.edu>");
    assert.equal(Decoder.clean2047Encoding("Test of new header generator"), "Test of new header generator");
    assert.equal(Decoder.clean2047Encoding("=?utf-8?Q?=00=41?=test1"), "\0Atest1");
    assert.equal(Decoder.clean2047Encoding("=?utf-8?Q?=0A=41?=test2"), "\nAtest2");
    assert.equal(Decoder.clean2047Encoding("=?utf-8?Q?=00=0A=41?=test3"), "\0\nAtest3");
    assert.equal(Decoder.clean2047Encoding("From: =?utf-8?Q?=00=0A=41?=test4"), "From: \0\nAtest4");
    assert.equal(Decoder.clean2047Encoding("From: =?utf-8?Q?=41?=\r\ntest5"), "From: A\r\ntest5");
    assert.equal(Decoder.clean2047Encoding(
        "=?UTF-8?B?8J+PiCAgMjAxOSdzIE5vLjEgUmVjcnVpdCwgVGhlIFdvcmxkJ3Mg?=\n" +
        " =?UTF-8?B?VGFsbGVzdCBUZWVuYWdlciwgVG9wIFBsYXlzIG9mIHRoZSBXZWVrICYgbW9y?=\n" +
        " =?UTF-8?B?ZQ==?="),
        "🏈  2019's No.1 Recruit, The World's Tallest Teenager, Top Plays of the Week & more");
    assert.equal(Decoder.clean2047Encoding(
        "Subject: =?Windows-1252?Q?Fwd:_Scam_Alert_from_a_neighbor_on_NextDoor_-_Don=92t_re?=\n" +
        " =?Windows-1252?Q?ad_out_your_2_factored_authentication_code_to_anyone_on_?=\n" +
        "=?Windows-1252?Q?the_phone?="), "Subject: Fwd: Scam Alert from a neighbor on NextDoor - Don’t read out your 2 factored authentication code to anyone on the phone");
    assert.equal(Decoder.clean2047Encoding("Subject: =?gb2312?B?RndkOiDT67DCwu3SqdK119y+rcDto6ywosDvsM2wzdfcvOCjrMu5sdi/y9fc?=" +
        " =?gb2312?B?ssOjrNK7xvDR0L6/yc/K0Lmry762rcrCu+HD2Mrp?="),
        "Subject: Fwd: 与奥马药业总经理，阿里巴巴总监，斯必克总裁，一起研究上市公司董事会秘书");
    assert.equal(Decoder.clean2047Encoding("Subject: =?gb2312?Q?=D3=EB=B0=C2=C2=ED=D2=A9=D2=B5=D7=DC=BE=AD=C0=ED=A3?=" +
        "=?gb2312?Q?=AC=B0=A2=C0=EF=B0=CD=B0=CD=D7=DC=BC=E0=A3=AC=CB=B9=B1=D8?=" +
        "=?gb2312?Q?=BF=CB=D7=DC=B2=C3=A3=AC=D2=BB=C6=F0=D1=D0=BE=BF=C9=CF=CA?=" +
        "=?gb2312?Q?=D0=B9=AB=CB=BE=B6=AD=CA=C2=BB=E1=C3=D8=CA=E9?="),
        "Subject: 与奥马药业总经理，阿里巴巴总监，斯必克总裁，一起研究上市公司董事会秘书");
    assert.equal(Decoder.clean2047Encoding("To: \"=?utf-8?q?=E3=82=A2=E3=83=A1=E3=83=AA=E3=82=AB    =E3=82=A2=E3=83=A1=E3=83=AA=E3=82=AB?=\" <test@example.com>"), "To: \"アメリカ    アメリカ\" <test@example.com>");
    assert.equal(Decoder.clean2047Encoding("=?utf-8?B?VE9EQVk6IFdlc3QgSGFtIHYuIE5ld2Nhc3RsZSBhdCAzUE0gRVQ=?==?utf-8?B?4pq9?="), "TODAY: West Ham v. Newcastle at 3PM ET⚽");
});

QUnit.test("Mailsploit Tests", function (assert) {
    // Tests drawn from posts/discussions of Mailsploit
    assert.equal(Decoder.clean2047Encoding("=?utf-8?Q?=42=45=47=49=4E=20=2F=20=20=2F=20=00=20=50=41=53=53=45=44=20=4E=55=4C=4C=20=42=59=54=45=20=2F=20=0D=0A=20=50=41=53=53=45=44=20=43=52=4C=46=20=2F=20=45=4E=44?="),
        "BEGIN /  / \0 PASSED NULL BYTE / \r\n PASSED CRLF / END");
    assert.equal(Decoder.clean2047Encoding("<=?utf-8?Q?=42=45=47=49=4E=20=2F=20=20=2F=20=00=20=50=41=53=53=45=44=20=4E=55=4C=4C=20=42=59=54=45=20=2F=20=0D=0A=20=50=41=53=53=45=44=20=43=52=4C=46=20=2F=20=45=4E=44?=@example.com>"),
        "<BEGIN /  / \0 PASSED NULL BYTE / \r\n PASSED CRLF / END@example.com>");
    assert.equal(Decoder.clean2047Encoding("=?utf-8?b?c2VydmljZUBwYXlwYWwuY29tPGlmcmFtZSBvbmxvYWQ9YWxlcnQoZG9jdW1lbnQuY29va2llKSBzcmM9aHR0cHM6Ly93d3cuaHVzaG1haWwuY29tIHN0eWxlPSJkaXNwbGF5Om5vbmUi?==?utf-8?Q?=0A=00?=@mailsploit.com"),
        "service@paypal.com<iframe onload=alert(document.cookie) src=https://www.hushmail.com style=\"display:none\"\n\0@mailsploit.com");

    // Tests from actual Mailsploit mails
    // macOS  ≤ 10.13.1 / iOS ≤ 11  .2 Mail.app / Open-Xchange < 7.1  0.0 / CloudMagic Newton ≤ 9.8.79-like
    assert.equal(Decoder.clean2047Encoding(
        "=?utf-8?b?cG90dXNAd2hpdGVob3VzZS5nb3Y=?==?utf-8?Q?=00?==?utf-8?b?KHBvdHVzQHdoaXRlaG91c2UuZ292KQ==?=@mailsploit.com"),
        "potus@whitehouse.gov\0(potus@whitehouse.gov)@mailsploit.com");
    // Mozilla-Thunderbird ≤ 52.5.0-like
    assert.equal(Decoder.clean2047Encoding(
        "\"=?utf-8?b?cG90dXNAd2hpdGVob3VzZS5nb3Y=?==?utf-8?Q?=0A=00?=\"\r\n <=?utf-8?b?cG90dXNAd2hpdGVob3VzZS5nb3Y=?==?utf-8?Q?=0A=00?=@mailsploit.com>"),
        "\"potus@whitehouse.gov\n\0\"\r\n <potus@whitehouse.gov\n\0@mailsploit.com>");
    // Variation #1
    assert.equal(Decoder.clean2047Encoding(
        "=?utf-8?b?cG90dXNAd2hpdGVob3VzZS5nb3Y=?==?utf-8?Q?=00=0A?=@mailsploit.com"),
        "potus@whitehouse.gov\0\n@mailsploit.com");
    // Variation #2
    assert.equal(Decoder.clean2047Encoding(
        "\"=?utf-8?b?cG90dXNAd2hpdGVob3VzZS5nb3YiIDxwb3R1c0B3aGl0ZWhvdXNlLmdvdj4=?==?utf-8?Q?=00=0A?=\"\r\n <demo@mailsploit.com>"),
        "\"potus@whitehouse.gov\" <potus@whitehouse.gov>\0\n\"\r\n <demo@mailsploit.com>");
    // Variation #2.1
    assert.equal(Decoder.clean2047Encoding(
        "\"=?utf-8?b?cG90dXNAd2hpdGVob3VzZS5nb3YiIDx0ZXN0Pg==?==?utf-8?Q?=00=0A?=\"\r\n <demo@mailsploit.com>"),
        "\"potus@whitehouse.gov\" <test>\0\n\"\r\n <demo@mailsploit.com>");
    // Variation #2.2
    assert.equal(Decoder.clean2047Encoding(
        "\"=?utf-8?b?dGVzdCIgPHBvdHVzQHdoaXRlaG91c2UuZ292Pg==?==?utf-8?Q?=00=0A?=\"\r\n <demo@mailsploit.com>"),
        "\"test\" <potus@whitehouse.gov>\0\n\"\r\n <demo@mailsploit.com>");
    // Variation #3
    assert.equal(Decoder.clean2047Encoding(
        "\"=?utf-8?b?InBvdHVzQHdoaXRlaG91c2UuZ292IiA8cG90dXNAd2hpdGVob3VzZS5nb3Y+?==?utf-8?Q?=0A=00=00=00?=\"\r\n <demo@mailsploit.com>"),
        "\"\"potus@whitehouse.gov\" <potus@whitehouse.gov>\n\0\0\0\"\r\n <demo@mailsploit.com>");
    // Variation #3.1
    assert.equal(Decoder.clean2047Encoding(
        "\"=?utf-8?b?InRlc3QiIDxwb3R1c0B3aGl0ZWhvdXNlLmdvdj4=?==?utf-8?Q?=0A=00=00=00?=\"\r\n <demo@mailsploit.com>"),
        "\"\"test\" <potus@whitehouse.gov>\n\0\0\0\"\r\n <demo@mailsploit.com>");
    // Variation #3.2
    assert.equal(Decoder.clean2047Encoding(
        "\"=?utf-8?b?InBvdHVzQHdoaXRlaG91c2UuZ292IiA8dGVzdD4=?==?utf-8?Q?=0A=00=00=00?=\"\r\n<demo@mailsploit.com>"),
        "\"\"potus@whitehouse.gov\" <test>\n\0\0\0\"\r\n<demo@mailsploit.com>");
    // Variation #4
    assert.equal(Decoder.clean2047Encoding(
        "=?utf-8?b?cG90dXNAd2hpdGVob3VzZS5nb3Y=?==?utf-8?Q?=0A=00?=@mailsploit.com"),
        "potus@whitehouse.gov\n\0@mailsploit.com");
    // Variation #5
    assert.equal(Decoder.clean2047Encoding(
        "\" =?utf - 8 ? b ? cG90dXNAd2hpdGVob3VzZS5nb3Y =?=\" <demo@mailsploit.com>"),
        "\" =?utf - 8 ? b ? cG90dXNAd2hpdGVob3VzZS5nb3Y =?=\" <demo@mailsploit.com>");
    // Variation #6
    assert.equal(Decoder.clean2047Encoding(
        "=?utf-8?b?cG90dXNAd2hpdGVob3VzZS5nb3YocG90dXNAd2hpdGVob3VzZS5nb3Y=?==?utf-8?Q?=00?=@mailsploit.com"),
        "potus@whitehouse.gov(potus@whitehouse.gov\0@mailsploit.com");
    // Generic test #1
    assert.equal(Decoder.clean2047Encoding(
        "\"=?utf-8?Q?=42=45=47=49=4E=20=2F=20=28=7C=29=7C=3C=7C=3E=7C=40=7C=2C=7C=3B=7C=3A=7C=5C=7C=22=7C=2F=7C=5B=7C=5D=7C=3F=7C=2E=7C=3D=20=2F=20=00=20=50=41=53=53=45=44=20=4E=55=4C=4C=20=42=59=54=45=20=2F=20=0D=0A=20=50=41=53=53=45=44=20=43=52=4C=46=20=2F=20?==?utf-8?b?RU5E?=\"\r\n <demo@mailsploit.com>"),
        "\"BEGIN / (|)|<|>|@|,|;|:|\\|\"|/|[|]|?|.|= / \0 PASSED NULL BYTE / \r\n PASSED CRLF / END\"\r\n <demo@mailsploit.com>");
    // Generic test #2
    assert.equal(Decoder.clean2047Encoding(
        "=?utf-8?Q?=42=45=47=49=4E=20=2F=20=28=7C=29=7C=3C=7C=3E=7C=40=7C=2C=7C=3B=7C=3A=7C=5C=7C=22=7C=2F=7C=5B=7C=5D=7C=3F=7C=2E=7C=3D=20=2F=20=00=20=50=41=53=53=45=44=20=4E=55=4C=4C=20=42=59=54=45=20=2F=20=0D=0A=20=50=41=53=53=45=44=20=43=52=4C=46=20=2F=20?==?utf-8?b?RU5E?=@mailsploit.com"),
        "BEGIN / (|)|<|>|@|,|;|:|\\|\"|/|[|]|?|.|= / \0 PASSED NULL BYTE / \r\n PASSED CRLF / END@mailsploit.com");
});

// Should I add test cases from http://greenbytes.de/tech/tc2231/ ?

QUnit.test("2047 Hex Tests", function (assert) {
    assert.equal(Decoder.decodeHex("US-ASCII", "=61=62"), "ab");
    assert.equal(Decoder.decodeHex("ISO-8859-1", "Keld J=F8rn Simonsen"), "Keld Jørn Simonsen");
});

QUnit.test("2047 Quoted Tests", function (assert) {
    assert.equal(Decoder.decodeQuoted("US-ASCII", "Keith_Moore"), "Keith Moore");
    assert.equal(Decoder.decodeQuoted("ISO-8859-1", "Keld_J=F8rn_Simonsen"), "Keld Jørn Simonsen");
    assert.equal(Decoder.decodeQuoted("iso-8859-8", "=ED=E5=EC=F9=20=EF=E1=20=E9=EC=E8=F4=F0"), "םולש ןב ילטפנ");
    assert.equal(Decoder.decodeQuoted("utf-8", "=41=0A=42"), "A\nB");
    assert.equal(Decoder.decodeQuoted("utf-8", "=41=00=0A=42"), "A\0\nB");
});

QUnit.test("2047 Base64 Tests", function (assert) {
    assert.equal(Decoder.decodeBase64("US-ASCII", "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4bHl6"), "abcdefghijklmnopqrstuvwxlyz");
    assert.equal(Decoder.decodeBase64("US-ASCII", "IUAjJCVeJiooKV8rLT1bXVx7fXw7JzoiLC4vPD4/"), "!@#$%^&*()_+-=[]\\{}|;':\",./<>?");
    assert.equal(Decoder.decodeBase64("ISO-8859-1", "SWYgeW91IGNhbiByZWFkIHRoaXMgeW8="), "If you can read this yo");
    assert.equal(Decoder.decodeBase64("ISO-8859-2", "dSB1bmRlcnN0YW5kIHRoZSBleGFtcGxlLg=="), "u understand the example.");
    assert.equal(Decoder.decodeBase64("UTF-8", "RU5E"), "END");
    assert.equal(Decoder.decodeBase64("UTF-8", "RU5E="), "=?UTF-8?B?RU5E=?="); // this is invalid base64 so it should be rejected
    assert.equal(Decoder.decodeBase64("UTF-8", "RU5E=="), "=?UTF-8?B?RU5E==?="); // this is invalid base64 so it should be rejected
    assert.equal(Decoder.decodeBase64("UTF-8", "RU5E==="), "=?UTF-8?B?RU5E===?="); // this is invalid base64 so it should be rejected
    assert.equal(Decoder.decodeBase64("UTF-8", "RU5E===="), "=?UTF-8?B?RU5E====?="); // this is invalid base64 so it should be rejected
    assert.equal(Decoder.decodeBase64("UTF-8", "RU5E===x"), "=?UTF-8?B?RU5E===x?="); // this is invalid base64 so it should be rejected
    assert.equal(Decoder.decodeBase64("UTF-8", "...."), "=?UTF-8?B?....?="); // this is invalid base64 so it should be rejected

    // This passes. Is this right?
    assert.equal(Decoder.decodeBase64("iso-8859-8", "7eXs+SDv4SDp7Oj08A=="), "םולש ןב ילטפנ");
});

QUnit.test("2047 Junkmail Tests", function (assert) {
    // Tests taken from junkmail
    assert.equal(Decoder.clean2047Encoding("=?UTF-8?Q?=F0=9D=93=A2=F0=9D=93=BB=F0=9D=93=B2=20=E2=84=92=F0=9D=93=AA=F0=9D=93=B7=F0=9D=93=B4=F0=9D=93=AA=F0=9D=93=B7=20?= =?UTF-8?Q?=F0=9D=93=B5=20=F0=9D=93=A3=F0=9D=93=BB=F0=9D=93=B2=F0=9D=93=AC=F0=9D=93=B4=20=E2=84=9B=F0=9D=92=86=F0=9D=93=BF=F0=9D=92=86?= =?UTF-8?Q?=F0=9D=93=B2=F0=9D=93=AA=F0=9D=93=AB=F0=9D=92=86=F0=9D=93=BD=F0=9D=92=86=F0=9D=93=BC=20=F0=9D=93=B2=F0=9D=93=B7=20?= =?UTF-8?Q?=F0=9D=93=BC?= "),
        "𝓢𝓻𝓲 ℒ𝓪𝓷𝓴𝓪𝓷 𝓵 𝓣𝓻𝓲𝓬𝓴 ℛ𝒆𝓿𝒆𝓲𝓪𝓫𝒆𝓽𝒆𝓼 𝓲𝓷 𝓼 ");
    assert.equal(Decoder.decodeHex("UTF-8", "Test string=F0=9D=93=A2=F0=9D=93=BB=F0=9D=93=B2=20Woohoo!"), "Test string𝓢𝓻𝓲 Woohoo!");
});

QUnit.test("2047 Codepage Tests", function (assert) {
    assert.equal(Decoder.decodeHexCodepage("ISO-8859-8", [0xED, 0xE5, 0xEC, 0xF9, 0x20, 0xEF, 0xE1, 0x20, 0xE9, 0xEC, 0xE8, 0xF4, 0xF0]), "םולש ןב ילטפנ");
    assert.equal(Decoder.decodeHexCodepage("UTF-8", [0xF0, 0x9D, 0x93, 0xA2, 0xF0, 0x9D, 0x93, 0xBB, 0xF0, 0x9D, 0x93, 0xB2, 0x20]), "𝓢𝓻𝓲 ");
});

QUnit.test("2047 Codepage Tests Korean", function (assert) {
    assert.equal(Decoder.clean2047Encoding("=?EUC-KR?B?sNTAuLinKGxhemluZXNzKSwgwvzB9ri7seIoaW1w?=" +
        "=?EUC-KR?B?YXRpZW5jZSksILGzuLgoaHVicmlzKQ==?="),
        "게으름(laziness), 참지말기(impatience), 교만(hubris)");
});