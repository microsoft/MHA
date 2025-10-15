/* global QUnit */
/* global Received */
/* global ReceivedRow */
/* global dateString */

QUnit.test("Received Tests", function (assert) {
    var received = new Received();
    var header1 =
        "Received: from BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com\n" +
        " (2a01:111:e400:c418::34) by SN1PR16MB0494.namprd16.prod.outlook.com with\n" +
        " HTTPS via SN1PR15CA0024.NAMPRD15.PROD.OUTLOOK.COM; Sat, 21 Apr 2018 03:01:33\n" +
        " +0000";
    received.init(header1);
    var header2 =
        "Received: from BN3NAM04FT003.eop-NAM04.prod.protection.outlook.com\n" +
        " (10.152.92.53) by BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com\n" +
        " (10.152.93.134) with Microsoft SMTP Server (version=TLS1_2,\n" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.696.11; Sat, 21\n" +
        " Apr 2018 03:01:32 +0000";
    received.init(header2);
    var header3 =
        "Received: from vmta6.response.nfcu.org (199.204.166.217) by\n" +
        " BN3NAM04FT003.mail.protection.outlook.com (10.152.92.112) with Microsoft SMTP\n" +
        " Server id 15.20.696.11 via Frontend Transport; Sat, 21 Apr 2018 03:01:32\n" +
        " +0000";
    received.init(header3);
    var header4 =
        "Received: from localhost (10.0.22.21) by vmta6.response.nfcu.org (PowerMTA(TM) v3.5r17) id hrakoo0lrlgv for <sgriffin@outlook.com>; Fri, 20 Apr 2018 17:51:19 -0400 (envelope-from <abuse_281D5450C2D61412E888B78BD84CCB3D2E80DB1641131EAF@response.nfcu.org>)";
    received.init(header4);

    assert.equal(received.computeDeltas(), "310 minutes 14 seconds", "Deltas");
    assert.equal(received.exists(), true, "Exists");
    assert.propEqual(received.receivedRows[0],
        {
            "by": "vmta6.response.nfcu.org (PowerMTA(TM) v3.5r17)",
            "date": dateString("20 Apr 2018 21:51:19 +0000"),
            "dateNum": 1524261079000,
            "dateSort": 1524261079000,
            "delay": "",
            "delaySort": -1,
            "for": "<sgriffin@outlook.com>",
            "from": "localhost (10.0.22.21)",
            "hop": 1,
            "id": "hrakoo0lrlgv",
            "percent": 0,
            "sourceHeader": header4
        }, "header4");
    assert.propEqual(received.receivedRows[1],
        {
            "by": "BN3NAM04FT003.mail.protection.outlook.com (10.152.92.112)",
            "date": dateString("21 Apr 2018 03:01:32 +0000"),
            "dateNum": 1524279692000,
            "dateSort": 1524279692000,
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
    assert.propEqual(received.receivedRows[2],
        {
            "by": "BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com (10.152.93.134)",
            "date": dateString("21 Apr 2018 03:01:32 +0000"),
            "dateNum": 1524279692000,
            "dateSort": 1524279692000,
            "delay": "0 seconds",
            "delaySort": 0,
            "from": "BN3NAM04FT003.eop-NAM04.prod.protection.outlook.com (10.152.92.53)",
            "hop": 3,
            "id": "15.20.696.11",
            "percent": 0,
            "sourceHeader": header2,
            "with": "Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384)"
        }, "header2");
    assert.propEqual(received.receivedRows[3],
        {
            "by": "SN1PR16MB0494.namprd16.prod.outlook.com",
            "date": dateString("21 Apr 2018 03:01:33 +0000"),
            "dateNum": 1524279693000,
            "dateSort": 1524279693000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "BN3NAM04HT205.eop-NAM04.prod.protection.outlook.com (2a01:111:e400:c418::34)",
            "hop": 4,
            "percent": 0.0053723004190394325,
            "sourceHeader": header1,
            "via": "SN1PR15CA0024.NAMPRD15.PROD.OUTLOOK.COM",
            "with": "HTTPS"
        }, "header1");

    var github = new Received();
    var githubHeader1 =
        "Received: from CO1NAM03HT217.eop-NAM03.prod.protection.outlook.com\n" +
        " (2a01:111:e400:c418::43) by SN1PR16MB0494.namprd16.prod.outlook.com with\n" +
        " HTTPS via SN1PR15CA0033.NAMPRD15.PROD.OUTLOOK.COM; Sun, 22 Apr 2018 02:54:19\n" +
        " +0000";
    github.init(githubHeader1);
    var githubHeader2 =
        "Received: from CO1NAM03FT028.eop-NAM03.prod.protection.outlook.com\n" +
        " (10.152.80.60) by CO1NAM03HT217.eop-NAM03.prod.protection.outlook.com\n" +
        " (10.152.81.113) with Microsoft SMTP Server (version=TLS1_2,\n" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.696.11; Sun, 22\n" +
        " Apr 2018 02:54:18 +0000";
    github.init(githubHeader2);
    var githubHeader3 =
        "Received: from o9.sgmail.github.com (167.89.101.2) by\n" +
        " CO1NAM03FT028.mail.protection.outlook.com (10.152.80.189) with Microsoft SMTP\n" +
        " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id\n" +
        " 15.20.696.11 via Frontend Transport; Sun, 22 Apr 2018 02:54:17 +0000";
    github.init(githubHeader3);
    var githubHeader4 =
        "Received: by filter0652p1las1.sendgrid.net with SMTP id filter0652p1las1-5089-5ADBF958-25\n" +
        "        2018-04-22 02:54:17.028704749 +0000 UTC";
    github.init(githubHeader4);
    var githubHeader5 =
        "Received: from smtp.github.com (out-3.smtp.github.com [192.30.252.194])\n" +
        "	by ismtpd0021p1iad2.sendgrid.net (SG) with ESMTP id 1dCtTVbKTgGmrXSNolRfbg\n" +
        "	for <sgriffin@outlook.com>; Sun, 22 Apr 2018 02:54:16.987 +0000 (UTC)";
    github.init(githubHeader5);

    assert.equal(github.computeDeltas(), "2 seconds", "github Deltas");
    assert.equal(github.exists(), true, "github exists");
    assert.propEqual(github.receivedRows[0],
        {
            "by": "ismtpd0021p1iad2.sendgrid.net (SG)",
            "date": dateString("22 Apr 2018 02:54:16 +0000"),
            "dateNum": 1524365656987,
            "dateSort": 1524365656987,
            "delay": "",
            "delaySort": -1,
            "for": "<sgriffin@outlook.com>",
            "from": "smtp.github.com (out-3.smtp.github.com [192.30.252.194])",
            "hop": 1,
            "id": "1dCtTVbKTgGmrXSNolRfbg",
            "percent": 0,
            "sourceHeader": githubHeader5,
            "with": "ESMTP"
        }, "githubHeader5");
    assert.propEqual(github.receivedRows[1],
        {
            "by": "filter0652p1las1.sendgrid.net",
            "date": dateString("22 Apr 2018 02:54:17 +0000"),
            "dateNum": 1524365657028,
            "dateSort": 1524365657028,
            "delay": "0 seconds",
            "delaySort": 41,
            "hop": 2,
            "id": "filter0652p1las1-5089-5ADBF958-25",
            "percent": 2.0088192062714354,
            "sourceHeader": githubHeader4,
            "with": "SMTP"
        }, "githubHeader4");
    assert.propEqual(github.receivedRows[2],
        {
            "by": "CO1NAM03FT028.mail.protection.outlook.com (10.152.80.189)",
            "date": dateString("22 Apr 2018 02:54:17 +0000"),
            "dateNum": 1524365657000,
            "dateSort": 1524365657000,
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
    assert.propEqual(github.receivedRows[3],
        {
            "by": "CO1NAM03HT217.eop-NAM03.prod.protection.outlook.com (10.152.81.113)",
            "date": dateString("22 Apr 2018 02:54:18 +0000"),
            "dateNum": 1524365658000,
            "dateSort": 1524365658000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "CO1NAM03FT028.eop-NAM03.prod.protection.outlook.com (10.152.80.60)",
            "hop": 4,
            "id": "15.20.696.11",
            "percent": 48.99559039686428,
            "sourceHeader": githubHeader2,
            "with": "Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384)"
        }, "githubHeader2");
    assert.propEqual(github.receivedRows[4],
        {
            "by": "SN1PR16MB0494.namprd16.prod.outlook.com",
            "date": dateString("22 Apr 2018 02:54:19 +0000"),
            "dateNum": 1524365659000,
            "dateSort": 1524365659000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "CO1NAM03HT217.eop-NAM03.prod.protection.outlook.com (2a01:111:e400:c418::43)",
            "hop": 5,
            "percent": 48.99559039686428,
            "sourceHeader": githubHeader1,
            "via": "SN1PR15CA0033.NAMPRD15.PROD.OUTLOOK.COM",
            "with": "HTTPS"
        }, "githubHeader1");

    var sendGrid = "Received: by filter0383p1iad2.sendgrid.net with SMTP id filter0383p1iad2-15318-5AB8F728-C\n" +
        " 2018-03-26 13:35:36.270951634 +0000 UTC";
    assert.propEqual(new ReceivedRow(sendGrid), {
        "by": "filter0383p1iad2.sendgrid.net",
        "date": dateString("26 Mar 2018 13:35:36 +0000"),
        "dateNum": 1522071336270,
        "dateSort": 1522071336270,
        "delaySort": -1,
        "id": "filter0383p1iad2-15318-5AB8F728-C",
        "percent": 0,
        "sourceHeader": sendGrid,
        "with": "SMTP"
    }, "sendGrid");

    var sendGrid2 = "Received: from smtp.github.com (out-8.smtp.github.com [192.30.252.199])\n" +
        " by ismtpd0003p1iad2.sendgrid.net (SG) with ESMTP id gDQRSEGgSqCsi9tFtF1Vtg\n" +
        " Mon, 26 Mar 2018 13:35:36.102 +0000 (UTC)";
    assert.propEqual(new ReceivedRow(sendGrid2), {
        "by": "ismtpd0003p1iad2.sendgrid.net (SG)",
        "date": dateString("26 Mar 2018 13:35:36 +0000"),
        "dateNum": 1522071336102,
        "dateSort": 1522071336102,
        "delaySort": -1,
        "from": "smtp.github.com (out-8.smtp.github.com [192.30.252.199])",
        "id": "gDQRSEGgSqCsi9tFtF1Vtg",
        "percent": 0,
        "sourceHeader": sendGrid2,
        "with": "ESMTP"
    }, "sendGrid2");

    var dupe1 = "Received: by me by you with this with that with whatever\n" +
        " 2018-03-26 13:35:36.270951634 +0000 UTC";
    assert.propEqual(new ReceivedRow(dupe1), {
        "by": "me; you",
        "date": dateString( "26 Mar 2018 13:35:36 +0000" ),
        "dateNum": 1522071336270,
        "dateSort": 1522071336270,
        "delaySort": -1,
        "percent": 0,
        "sourceHeader": dupe1,
        "with": "this; that; whatever"
    }, "dupe1");
});