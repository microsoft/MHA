﻿import * as QUnit from "qunit";
import { Received } from "../Received";

QUnit.test("Received Tests", function (assert: Assert) {
    const received = new Received();
    const header1 =
        "Received: from BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com\n" +
        " (2a01:111:e400:c418::34) by SN1PR16MB0494.namprd16.prod.outlook.com with\n" +
        " HTTPS via SN1PR15CA0024.NAMPRD15.PROD.OUTLOOK.COM; Sat, 21 Apr 2018 03:01:33\n" +
        " +0000";
    received.addInternal(header1);
    const header2 =
        "Received: from BN3NAM04FT003.eop-NAM04.prod.protection.outlook.com\n" +
        " (10.152.92.53) by BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com\n" +
        " (10.152.93.134) with Microsoft SMTP Server (version=TLS1_2,\n" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.696.11; Sat, 21\n" +
        " Apr 2018 03:01:32 +0000";
    received.addInternal(header2);
    const header3 =
        "Received: from vmta6.response.nfcu.org (199.204.166.217) by\n" +
        " BN3NAM04FT003.mail.protection.outlook.com (10.152.92.112) with Microsoft SMTP\n" +
        " Server id 15.20.696.11 via Frontend Transport; Sat, 21 Apr 2018 03:01:32\n" +
        " +0000";
    received.addInternal(header3);
    const header4 =
        "Received: from localhost (10.0.22.21) by vmta6.response.nfcu.org (PowerMTA(TM) v3.5r17) id hrakoo0lrlgv for <sgriffin@outlook.com>; Fri, 20 Apr 2018 17:51:19 -0400 (envelope-from <abuse_281D5450C2D61412E888B78BD84CCB3D2E80DB1641131EAF@response.nfcu.org>)";
    received.addInternal(header4);

    assert.equal(received.computeDeltas(), "310 minutes 14 seconds", "Deltas");
    assert.equal(received.exists(), true, "Exists");
    assert.receivedEqual(received.rows[0],
        {
            "by": "vmta6.response.nfcu.org (PowerMTA(TM) v3.5r17)",
            "dateNum": 1524261079000,
            "delaySort": -1,
            "for": "<sgriffin@outlook.com>",
            "from": "localhost (10.0.22.21)",
            "hop": 1,
            "id": "hrakoo0lrlgv",
            "percent": 0,
            "sourceHeader": header4
        }, "header4");
    assert.receivedEqual(received.rows[1],
        {
            "by": "BN3NAM04FT003.mail.protection.outlook.com (10.152.92.112)",
            "dateNum": 1524279692000,
            "delay": "310 minutes 13 seconds",
            "delaySort": 18613000,
            "from": "vmta6.response.nfcu.org (199.204.166.217)",
            "hop": 2,
            "id": "15.20.696.11",
            "percent": 99.99462769958096,
            "sourceHeader": header3,
            "via": "Frontend Transport",
            "with": "Microsoft SMTP Server"
        }, "header3");
    assert.receivedEqual(received.rows[2],
        {
            "by": "BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com (10.152.93.134)",
            "dateNum": 1524279692000,
            "delay": "0 seconds",
            "delaySort": 0,
            "from": "BN3NAM04FT003.eop-NAM04.prod.protection.outlook.com (10.152.92.53)",
            "hop": 3,
            "id": "15.20.696.11",
            "percent": 0,
            "sourceHeader": header2,
            "with": "Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384)"
        }, "header2");
    assert.receivedEqual(received.rows[3],
        {
            "by": "SN1PR16MB0494.namprd16.prod.outlook.com",
            "dateNum": 1524279693000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com (2a01:111:e400:c418::34)",
            "hop": 4,
            "percent": 0.0053723004190394325,
            "sourceHeader": header1,
            "via": "SN1PR15CA0024.NAMPRD15.PROD.OUTLOOK.COM",
            "with": "HTTPS"
        }, "header1");
});

QUnit.test("Received Tests github headers", function (assert: Assert) {
    const received = new Received();
    const githubHeader1 =
        "Received: from CO1NAM03HT217.eop-NAM03.prod.protection.outlook.com\n" +
        " (2a01:111:e400:c418::43) by SN1PR16MB0494.namprd16.prod.outlook.com with\n" +
        " HTTPS via SN1PR15CA0033.NAMPRD15.PROD.OUTLOOK.COM; Sun, 22 Apr 2018 02:54:19\n" +
        " +0000";
    received.addInternal(githubHeader1);
    const githubHeader2 =
        "Received: from CO1NAM03FT028.eop-NAM03.prod.protection.outlook.com\n" +
        " (10.152.80.60) by CO1NAM03HT217.eop-NAM03.prod.protection.outlook.com\n" +
        " (10.152.81.113) with Microsoft SMTP Server (version=TLS1_2,\n" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.696.11; Sun, 22\n" +
        " Apr 2018 02:54:18 +0000";
    received.addInternal(githubHeader2);
    const githubHeader3 =
        "Received: from o9.sgmail.github.com (167.89.101.2) by\n" +
        " CO1NAM03FT028.mail.protection.outlook.com (10.152.80.189) with Microsoft SMTP\n" +
        " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id\n" +
        " 15.20.696.11 via Frontend Transport; Sun, 22 Apr 2018 02:54:17 +0000";
    received.addInternal(githubHeader3);
    const githubHeader4 =
        "Received: by filter0652p1las1.sendgrid.net with SMTP id filter0652p1las1-5089-5ADBF958-25\n" +
        "        2018-04-22 02:54:17.028704749 +0000 UTC";
    received.addInternal(githubHeader4);
    const githubHeader5 =
        "Received: from smtp.github.com (out-3.smtp.github.com [192.30.252.194])\n" +
        "	by ismtpd0021p1iad2.sendgrid.net (SG) with ESMTP id 1dCtTVbKTgGmrXSNolRfbg\n" +
        "	for <sgriffin@outlook.com>; Sun, 22 Apr 2018 02:54:16.987 +0000 (UTC)";
    received.addInternal(githubHeader5);

    assert.equal(received.computeDeltas(), "2 seconds", "github Deltas");
    assert.equal(received.exists(), true, "github exists");
    assert.receivedEqual(received.rows[0],
        {
            "by": "ismtpd0021p1iad2.sendgrid.net (SG)",
            "dateNum": 1524365656987,
            "delaySort": -1,
            "for": "<sgriffin@outlook.com>",
            "from": "smtp.github.com (out-3.smtp.github.com [192.30.252.194])",
            "hop": 1,
            "id": "1dCtTVbKTgGmrXSNolRfbg",
            "percent": 0,
            "sourceHeader": githubHeader5,
            "with": "ESMTP"
        }, "githubHeader5");
    assert.receivedEqual(received.rows[1],
        {
            "by": "filter0652p1las1.sendgrid.net",
            "dateNum": 1524365657028,
            "delay": "0 seconds",
            "delaySort": 41,
            "hop": 2,
            "id": "filter0652p1las1-5089-5ADBF958-25",
            "percent": 2.0088192062714354,
            "sourceHeader": githubHeader4,
            "with": "SMTP"
        }, "githubHeader4");
    assert.receivedEqual(received.rows[2],
        {
            "by": "CO1NAM03FT028.mail.protection.outlook.com (10.152.80.189)",
            "dateNum": 1524365657000,
            "delay": "0 seconds",
            "delaySort": -28,
            "from": "o9.sgmail.github.com (167.89.101.2)",
            "hop": 3,
            "id": "15.20.696.11",
            "percent": 0,
            "sourceHeader": githubHeader3,
            "via": "Frontend Transport",
            "with": "Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384)"
        }, "githubHeader3");
    assert.receivedEqual(received.rows[3],
        {
            "by": "CO1NAM03HT217.eop-NAM03.prod.protection.outlook.com (10.152.81.113)",
            "dateNum": 1524365658000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "CO1NAM03FT028.eop-NAM03.prod.protection.outlook.com (10.152.80.60)",
            "hop": 4,
            "id": "15.20.696.11",
            "percent": 48.99559039686428,
            "sourceHeader": githubHeader2,
            "with": "Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384)"
        }, "githubHeader2");
    assert.receivedEqual(received.rows[4],
        {
            "by": "SN1PR16MB0494.namprd16.prod.outlook.com",
            "dateNum": 1524365659000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "CO1NAM03HT217.eop-NAM03.prod.protection.outlook.com (2a01:111:e400:c418::43)",
            "hop": 5,
            "percent": 48.99559039686428,
            "sourceHeader": githubHeader1,
            "via": "SN1PR15CA0033.NAMPRD15.PROD.OUTLOOK.COM",
            "with": "HTTPS"
        }, "githubHeader1");
});

QUnit.test("Received Tests parseHeader", function (assert: Assert) {
    const received = new Received();
    const sendGrid = "Received: by filter0383p1iad2.sendgrid.net with SMTP id filter0383p1iad2-15318-5AB8F728-C\n" +
        " 2018-03-26 13:35:36.270951634 +0000 UTC";
    assert.receivedEqual(received.parseHeader(sendGrid), {
        "by": "filter0383p1iad2.sendgrid.net",
        "dateNum": 1522071336270,
        "delaySort": -1,
        "id": "filter0383p1iad2-15318-5AB8F728-C",
        "percent": 0,
        "sourceHeader": sendGrid,
        "with": "SMTP"
    }, sendGrid);

    const sendGrid2 = "Received: from smtp.github.com (out-8.smtp.github.com [192.30.252.199])\n" +
        " by ismtpd0003p1iad2.sendgrid.net (SG) with ESMTP id gDQRSEGgSqCsi9tFtF1Vtg\n" +
        " Mon, 26 Mar 2018 13:35:36.102 +0000 (UTC)";
    assert.receivedEqual(received.parseHeader(sendGrid2), {
        "by": "ismtpd0003p1iad2.sendgrid.net (SG)",
        "dateNum": 1522071336102,
        "delaySort": -1,
        "from": "smtp.github.com (out-8.smtp.github.com [192.30.252.199])",
        "id": "gDQRSEGgSqCsi9tFtF1Vtg",
        "percent": 0,
        "sourceHeader": sendGrid2,
        "with": "ESMTP"
    }, sendGrid2);

    const dupe1 = "Received: by me by you with this with that with whatever\n" +
        " 2018-03-26 13:35:36.270951634 +0000 UTC";
    assert.receivedEqual(received.parseHeader(dupe1), {
        "by": "me; you",
        "dateNum": 1522071336270,
        "delaySort": -1,
        "percent": 0,
        "sourceHeader": dupe1,
        "with": "this; that; whatever"
    }, dupe1);

    const case1 =
        "Received: From BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com\n" +
        " (2a01:111:e400:c418::34) By SN1PR16MB0494.namprd16.prod.outlook.com With\n" +
        " HTTPS Via SN1PR15CA0024.NAMPRD15.PROD.OUTLOOK.COM; Sat, 21 Apr 2018 03:01:33\n" +
        " +0000";
    assert.receivedEqual(received.parseHeader(case1),
        {
            "by": "SN1PR16MB0494.namprd16.prod.outlook.com",
            "dateNum": 1524279693000,
            "delaySort": -1,
            "from": "BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com (2a01:111:e400:c418::34)",
            "percent": 0,
            "sourceHeader": case1,
            "via": "SN1PR15CA0024.NAMPRD15.PROD.OUTLOOK.COM",
            "with": "HTTPS"
        }, case1);

    assert.receivedEqual(received.parseHeader(""), {
        "delaySort": -1,
        "percent": 0
    }, "empty");

    assert.receivedEqual(received.parseHeader("Received: "), {
        "delaySort": -1,
        "percent": 0,
        "sourceHeader": "Received: "
    }, "otherEmpty");

    assert.receivedEqual(received.parseHeader(null), {
        "delaySort": -1,
        "percent": 0,
        "sourceHeader": null
    }, "null");

    const postfix = "Received: by example.com (Postfix, from userid 1001)\n" +
        " id 1234ABCD; Thu, 21 Aug 2014 12:12:48 +0200 (CEST)";
    assert.receivedEqual(received.parseHeader(postfix),
        {
            "by": "example.com (Postfix, from userid 1001)",
            "dateNum": 1408615968000,
            "delaySort": -1,
            "id": "1234ABCD",
            "percent": 0,
            "sourceHeader": postfix
        }, postfix);

    const qmail = "Received: (qmail 10876 invoked from network); 24 Aug 2014 16:13:38 -0000";
    assert.receivedEqual(received.parseHeader(qmail),
        {
            "by": "qmail 10876 invoked from network",
            "dateNum": 1408896818000,
            "delaySort": -1,
            "percent": 0,
            "sourceHeader": qmail
        }, qmail);

    const broke1 =
        "Received: Sun, 22 Apr 2018 02:54:19\n" +
        " +0000";
    assert.receivedEqual(received.parseHeader(broke1), {
        "dateNum": 1524365659000,
        "delaySort": -1,
        "percent": 0,
        "sourceHeader": broke1
    }, broke1);

    const broke2 =
        "Received: 22 Apr 2018";
    assert.receivedEqual(received.parseHeader(broke2), {
        "delaySort": -1,
        "percent": 0,
        "sourceHeader": broke2
    }, broke2);

    const broke3 =
        "Received: ; 22 Apr 2018";
    assert.receivedEqual(received.parseHeader(broke3), {
        "dateNum": 1524355200000,
        "delaySort": -1,
        "percent": 0,
        "sourceHeader": broke3
    }, broke3);

    const broke4 =
        "Received: ;";
    assert.receivedEqual(received.parseHeader(broke4), {
        "delaySort": -1,
        "percent": 0,
        "sourceHeader": broke4
    }, broke4);
});