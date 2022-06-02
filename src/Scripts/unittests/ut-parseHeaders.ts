import * as QUnit from "qunit";
import { HeaderModel } from "../Headers"

QUnit.test("parseHeader Tests", function (assert) {
    var summaryRows = [
        {
            "header": "Subject",
            "label": "Subject",
            "url": "<a href = 'https://tools.ietf.org/html/rfc5322#section-3.6.5' target = '_blank'>Subject</a>",
            "value": "Hear Hamilton Anytime, Anywhere"
        },
        {
            "header": "Message-ID",
            "label": "Message Id",
            "url": "<a href = 'https://tools.ietf.org/html/rfc5322#section-3.6.4' target = '_blank'>Message Id</a>",
            "value": "<1134542665376.1115276745036.1949397254.0.411440JL.2002@scheduler.constantcontact.com>"
        },
        {
            "header": "Archived-At",
            "label": "Archived at",
            "url": "<a href = 'https://tools.ietf.org/html/rfc5064' target = '_blank'>Archived at</a>",
            "value": "https://www.bing.com",
            "valueUrl": "<a href='https://www.bing.com' target='_blank'>https://www.bing.com</a>"
        },
        {
            "header": "Date",
            "label": "Creation time",
            "url": "<a href = 'https://tools.ietf.org/html/rfc5322#section-3.6.1' target = '_blank'>Creation time</a>",
            "value": "Tue, 14 Jul 2020 14:41:20 -0400 (EDT) (Delivered after 3 seconds)"
        },
        {
            "header": "From",
            "label": "From",
            "url": "<a href = 'https://tools.ietf.org/html/rfc5322#section-3.6.2' target = '_blank'>From</a>",
            "value": "PBS Charlotte <memberservices@wtvi.org>"
        },
        {
            "header": "Reply-To",
            "label": "Reply to",
            "url": "<a href = 'https://tools.ietf.org/html/rfc5322#section-3.6.2' target = '_blank'>Reply to</a>",
            "value": "memberservices@wtvi.org"
        },
        {
            "header": "To",
            "label": "To",
            "url": "<a href = 'https://tools.ietf.org/html/rfc5322#section-3.6.3' target = '_blank'>To</a>",
            "value": "test@outlook.com"
        },
        {
            "header": "CC",
            "label": "Cc",
            "url": "<a href = 'https://tools.ietf.org/html/rfc5322#section-3.6.3' target = '_blank'>Cc</a>"
        }];

    var receivedRows = [
        {
            "by": "10.249.244.10 (envelope-from <AqeHmUtTNRpaUZj9CNd6Rxg==_1115276745036_oCND0ALXEeiiWdSuUo6yew==@in.constantcontact.com>) (ecelerity 4.3.1.69340 r(Core:4.3.1.0))",
            "date": "7/14/2020 2:41:20 PM",
            "dateNum": 1594752080000,
            "delaySort": -1,
            "from": "[10.252.1.143] ([10.252.1.143:47944] helo=p2-jbemailsyndicator32.ctct.net)",
            "hop": 1,
            "id": "C8/A8-65519-05CFD0F5",
            "percent": 0,
            "sourceHeader": "from [10.252.1.143] ([10.252.1.143:47944] helo=p2-jbemailsyndicator32.ctct.net) by 10.249.244.10 (envelope-from <AqeHmUtTNRpaUZj9CNd6Rxg==_1115276745036_oCND0ALXEeiiWdSuUo6yew==@in.constantcontact.com>) (ecelerity 4.3.1.69340 r(Core:4.3.1.0)) with ESMTP id C8/A8-65519-05CFD0F5; Tue, 14 Jul 2020 14:41:20 -0400",
            "with": "ESMTP"
        },
        {
            "by": "HE1EUR04FT039.mail.protection.outlook.com (10.152.26.153)",
            "date": "7/14/2020 2:41:21 PM",
            "dateNum": 1594752081000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "ccm27.constantcontact.com (208.75.123.162)",
            "hop": 2,
            "id": "15.20.3174.21",
            "percent": 33.333333333333336,
            "sourceHeader": "from ccm27.constantcontact.com (208.75.123.162) by HE1EUR04FT039.mail.protection.outlook.com (10.152.26.153) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.3174.21 via Frontend Transport; Tue, 14 Jul 2020 18:41:21 +0000",
            "via": "Frontend Transport",
            "with": "Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384)"
        },
        {
            "by": "HE1EUR04HT207.eop-eur04.prod.protection.outlook.com (2a01:111:e400:7e0d::405)",
            "date": "7/14/2020 2:41:22 PM",
            "dateNum": 1594752082000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "HE1EUR04FT039.eop-eur04.prod.protection.outlook.com (2a01:111:e400:7e0d::4f)",
            "hop": 3,
            "id": "15.20.3174.21",
            "percent": 33.333333333333336,
            "sourceHeader": "from HE1EUR04FT039.eop-eur04.prod.protection.outlook.com (2a01:111:e400:7e0d::4f) by HE1EUR04HT207.eop-eur04.prod.protection.outlook.com (2a01:111:e400:7e0d::405) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.3174.21; Tue, 14 Jul 2020 18:41:22 +0000",
            "with": "Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384)"
        },
        {
            "by": "BN8PR19MB2915.namprd19.prod.outlook.com",
            "date": "7/14/2020 2:41:23 PM",
            "dateNum": 1594752083000,
            "delay": "1 second",
            "delaySort": 1000,
            "from": "HE1EUR04HT207.eop-eur04.prod.protection.outlook.com (2603:10b6:408:c0::39)",
            "hop": 4,
            "percent": 33.333333333333336,
            "sourceHeader": "from HE1EUR04HT207.eop-eur04.prod.protection.outlook.com (2603:10b6:408:c0::39) by BN8PR19MB2915.namprd19.prod.outlook.com with HTTPS via BN8PR15CA0026.NAMPRD15.PROD.OUTLOOK.COM; Tue, 14 Jul 2020 18:41:23 +0000",
            "via": "BN8PR15CA0026.NAMPRD15.PROD.OUTLOOK.COM",
            "with": "HTTPS"
        }];

    var antiSpamRows = [
        {
            "header": "BCL",
            "headerName": "X-Microsoft-Antispam",
            "label": "Bulk Complaint Level",
            "value": "1",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>1</a>"
        },
        {
            "header": "PCL",
            "headerName": "X-Microsoft-Antispam",
            "label": "Phishing Confidence Level"
        },
        {
            "header": "source",
            "headerName": "X-Microsoft-Antispam",
            "label": "Source header",
            "value": "BCL:1;",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>BCL:1;</a>"
        },
        {
            "header": "unparsed",
            "headerName": "X-Microsoft-Antispam",
            "label": "Unknown fields",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>X-Microsoft-Antispam</a>"
        }
    ];

    var forefrontAntiSpamRows = [
        {
            "header": "ARC",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "ARC protocol"
        },
        {
            "header": "CTRY",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Country/Region",
            "value": "US",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>US</a>"
        },
        {
            "header": "LANG",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Language",
            "value": "en",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>en</a>"
        },
        {
            "header": "SCL",
            "headerName": "X-MS-Exchange-Organization-SCL",
            "label": "Spam Confidence Level",
            "value": "0",
            "valueUrl": "<a href = 'https://technet.microsoft.com/en-us/library/aa996878' target = '_blank'>0</a>"
        },
        {
            "header": "PCL",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Phishing Confidence Level"
        },
        {
            "header": "SFV",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Spam Filtering Verdict",
            "value": "NSPM",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>NSPM</a>"
        },
        {
            "header": "IPV",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "IP Filter Verdict",
            "value": "NLI",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>NLI</a>"
        },
        {
            "header": "H",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "HELO/EHLO String",
            "value": "ccm27.constantcontact.com",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>ccm27.constantcontact.com</a>"
        },
        {
            "header": "PTR",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "PTR Record",
            "value": "ccm27.constantcontact.com",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>ccm27.constantcontact.com</a>"
        },
        {
            "header": "CIP",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Connecting IP Address",
            "value": "208.75.123.162",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>208.75.123.162</a>"
        },
        {
            "header": "CAT",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Protection Policy Category",
            "value": "NONE",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>NONE</a>"
        },
        {
            "header": "SFTY",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Phishing message",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>X-Forefront-Antispam-Report</a>"
        },
        {
            "header": "SRV",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Bulk email status",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>X-Forefront-Antispam-Report</a>"
        },
        {
            "header": "X-CustomSpam",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Advanced Spam Filtering"
        },
        {
            "header": "SFS",
            "headerName": "SFS",
            "label": "Spam rules",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/exchange/monitoring/trace-an-email-message/run-a-message-trace-and-view-results' target = '_blank'>SFS</a>"
        },
        {
            "header": "source",
            "headerName": "X-Microsoft-Antispam",
            "label": "Source header",
            "value": "CIP:208.75.123.162;CTRY:US;LANG:en;SCL:0;SRV:;IPV:NLI;SFV:NSPM;H:ccm27.constantcontact.com;PTR:ccm27.constantcontact.com;CAT:NONE;SFTY:;SFS:;DIR:INB;SFP:;",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>CIP:208.75.123.162;CTRY:US;LANG:en;SCL:0;SRV:;IPV:NLI;SFV:NSPM;H:ccm27.constantcontact.com;PTR:ccm27.constantcontact.com;CAT:NONE;SFTY:;SFS:;DIR:INB;SFP:;</a>"
        },
        {
            "header": "unparsed",
            "headerName": "X-Microsoft-Antispam",
            "label": "Unknown fields",
            "value": "DIR:INB;SFP:;",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>DIR:INB;SFP:;</a>"
        }];

    var goodCaseHeaders = "Received: from HE1EUR04HT207.eop-eur04.prod.protection.outlook.com\n" +
        " (2603:10b6:408:c0::39) by BN8PR19MB2915.namprd19.prod.outlook.com with HTTPS\n" +
        " via BN8PR15CA0026.NAMPRD15.PROD.OUTLOOK.COM; Tue, 14 Jul 2020 18:41:23 +0000\n" +
        "Received: from HE1EUR04FT039.eop-eur04.prod.protection.outlook.com\n" +
        " (2a01:111:e400:7e0d::4f) by\n" +
        " HE1EUR04HT207.eop-eur04.prod.protection.outlook.com (2a01:111:e400:7e0d::405)\n" +
        " with Microsoft SMTP Server (version=TLS1_2,\n" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.3174.21; Tue, 14 Jul\n" +
        " 2020 18:41:22 +0000\n" +
        "Authentication-Results: spf=pass (sender IP is 208.75.123.162)\n" +
        " smtp.mailfrom=in.constantcontact.com; outlook.com; dkim=pass (signature was\n" +
        " verified) header.d=pbscharlotte.ccsend.com;outlook.com; dmarc=none\n" +
        " action=none header.from=wtvi.org;compauth=fail reason=001\n" +
        "Received-SPF: Pass (protection.outlook.com: domain of in.constantcontact.com\n" +
        " designates 208.75.123.162 as permitted sender)\n" +
        " receiver=protection.outlook.com; client-ip=208.75.123.162;\n" +
        " helo=ccm27.constantcontact.com;\n" +
        "Received: from ccm27.constantcontact.com (208.75.123.162) by\n" +
        " HE1EUR04FT039.mail.protection.outlook.com (10.152.26.153) with Microsoft SMTP\n" +
        " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id\n" +
        " 15.20.3174.21 via Frontend Transport; Tue, 14 Jul 2020 18:41:21 +0000\n" +
        "X-IncomingTopHeaderMarker:\n" +
        " OriginalChecksum:424E32F552252F90CC4D92C6DA02EB496153B34FF89C7DF12D0C33CF4543FE80;UpperCasedChecksum:D202FB6FC49EE6CAD8BC8DF97C1C80502ACFF17CE8D7B39B10BB310A45496E05;SizeAsReceived:2601;Count:24\n" +
        "Return-Path:\n" +
        " AqeHmUtTNRpaUZj9CNd6Rxg==_1115276745036_oCND0ALXEeiiWdSuUo6yew==@in.constantcontact.com\n" +
        "Received: from [10.252.1.143] ([10.252.1.143:47944] helo=p2-jbemailsyndicator32.ctct.net)\n" +
        "	by 10.249.244.10 (envelope-from <AqeHmUtTNRpaUZj9CNd6Rxg==_1115276745036_oCND0ALXEeiiWdSuUo6yew==@in.constantcontact.com>)\n" +
        "	(ecelerity 4.3.1.69340 r(Core:4.3.1.0)) with ESMTP\n" +
        "	id C8/A8-65519-05CFD0F5; Tue, 14 Jul 2020 14:41:20 -0400\n" +
        "DKIM-Signature: v=1; q=dns/txt; a=rsa-sha256; c=relaxed/relaxed; s=1000126720; d=pbscharlotte.ccsend.com; h=date:mime-version:subject:X-Feedback-ID:X-250ok-CID:message-id:from:reply-to:list-unsubscribe:list-unsubscribe-post:to; bh=WHafE/x2EJSWCLU2YIR8W1io+dQKFZ/pUDVwHqQdiv0=; b=fG+TTOhTr4X4O/5754xsXVScAbBaBkjMKRtzUcIOytqszvhC/X+bxori5rY+RfvQBIU7AbvzNNXmtcmIsjrNDvF5O0RDvTuXgqZad0hyqCATHxpSgdlKs2UdIecj8CSFXuh5bfwEn2d3/j3RKH2CD9YYUCPQux+C8vT7SMd9XNA=\n" +
        "DKIM-Signature: v=1; q=dns/txt; a=rsa-sha256; c=relaxed/relaxed; s=1000073432; d=auth.ccsend.com; h=date:mime-version:subject:X-Feedback-ID:X-250ok-CID:message-id:from:reply-to:list-unsubscribe:list-unsubscribe-post:to; bh=WHafE/x2EJSWCLU2YIR8W1io+dQKFZ/pUDVwHqQdiv0=; b=iPEp4ThtBazoxYkcORXwk4tnNurm/IGWBf/pSj3cvBsb9Iz6CVMLVw6Bv7K+WZTD8jEfect+kCVDAzTBiy6z2XbXUf/6zGhlpdH9m/1AW41217Az9yKEmmWK8wxizj9clQyhA/EwCmdlEdGfZvyakKLDH9VlpdvJKhswl2+pT9M=\n" +
        "Message-ID: <1134542665376.1115276745036.1949397254.0.411440JL.2002@scheduler.constantcontact.com>\n" +
        "Date: Tue, 14 Jul 2020 14:41:20 -0400 (EDT)\n" +
        "From: PBS Charlotte <memberservices@wtvi.org>\n" +
        "Reply-To: memberservices@wtvi.org\n" +
        "Sender: PBS Charlotte <natascha@pbscharlotte.ccsend.com>\n" +
        "To: test@outlook.com\n" +
        "Subject: Hear Hamilton Anytime, Anywhere\n" +
        "Archived-At: https://www.bing.com\n" +
        "MIME-Version: 1.0\n" +
        "Content-Type: multipart/alternative; \n" +
        "	boundary=\"----=_Part_636915194_1889124954.1594752080758\"\n" +
        "List-Unsubscribe:\n" +
        " <https://eur04.safelinks.protection.outlook.com/?url=https%3A%2F%2Fvisitor.constantcontact.com%2Fdo%3Fp%3Dun%26m%3D001znV2qCNlC4q69jnKYsCZDw%253D%253D%26se%3D001ux4it_8ZgYXx3D-UkRvBXQ%253D%253D%26t%3D001EkZLEx15CcE%253D%26llr%3Dmkgz9voab&amp;data=02%7C01%7C%7C42e4fc51d2dd490c433d08d828258159%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C637303488827969246&amp;sdata=R18jtujsqi9qwNLx%2B%2BkHr%2FIl14CeUgUOttipQOoPTS4%3D&amp;reserved=0>\n" +
        "List-Unsubscribe-Post: List-Unsubscribe=One-Click\n" +
        "X-Campaign-Activity-ID: a9e1e652-d4cd-4696-9466-3f4235de91c6\n" +
        "X-250ok-CID: a9e1e652-d4cd-4696-9466-3f4235de91c6\n" +
        "X-Channel-ID: a02343d0-02d7-11e8-a259-d4ae528eb27b\n" +
        "X-Mailer: Roving Constant Contact 2012 (http://www.constantcontact.com)\n" +
        "X-Return-Path-Hint: AqeHmUtTNRpaUZj9CNd6Rxg==_1115276745036_oCND0ALXEeiiWdSuUo6yew==@in.constantcontact.com\n" +
        "X-Roving-Campaignid: 1134542665376\n" +
        "X-Roving-Id: 1115276745036.1949397254\n" +
        "X-Feedback-ID: a02343d0-02d7-11e8-a259-d4ae528eb27b:a9e1e652-d4cd-4696-9466-3f4235de91c6:1115276745036:CTCT\n" +
        "X-CTCT-ID: 9fe7e880-02d7-11e8-a24b-d4ae528eb27b\n" +
        "X-IncomingHeaderCount: 24\n" +
        "X-MS-Exchange-Organization-ExpirationStartTime: 14 Jul 2020 18:41:22.1936\n" +
        " (UTC)\n" +
        "X-MS-Exchange-Organization-ExpirationStartTimeReason: OriginalSubmit\n" +
        "X-MS-Exchange-Organization-ExpirationInterval: 1:00:00:00.0000000\n" +
        "X-MS-Exchange-Organization-ExpirationIntervalReason: OriginalSubmit\n" +
        "X-MS-Exchange-Organization-Network-Message-Id:\n" +
        " 42e4fc51-d2dd-490c-433d-08d828258159\n" +
        "X-EOPAttributedMessage: 0\n" +
        "X-EOPTenantAttributedMessage: 84df9e7f-e9f6-40af-b435-aaaaaaaaaaaa:0\n" +
        "X-MS-Exchange-Organization-MessageDirectionality: Incoming\n" +
        "X-Forefront-Antispam-Report:\n" +
        " CIP:208.75.123.162;CTRY:US;LANG:en;SCL:0;SRV:;IPV:NLI;SFV:NSPM;H:ccm27.constantcontact.com;PTR:ccm27.constantcontact.com;CAT:NONE;SFTY:;SFS:;DIR:INB;SFP:;\n" +
        "X-MS-PublicTrafficType: Email\n" +
        "X-MS-Exchange-Organization-AuthSource:\n" +
        " HE1EUR04FT039.eop-eur04.prod.protection.outlook.com\n" +
        "X-MS-Exchange-Organization-AuthAs: Anonymous\n" +
        "X-MS-UserLastLogonTime: 7/14/2020 6:34:06 PM\n" +
        "X-MS-Office365-Filtering-Correlation-Id: 42e4fc51-d2dd-490c-433d-08d828258159\n" +
        "X-MS-TrafficTypeDiagnostic: HE1EUR04HT207:\n" +
        "X-MS-Exchange-EOPDirect: true\n" +
        "X-Sender-IP: 208.75.123.162\n" +
        "X-SID-PRA: NATASCHA@PBSCHARLOTTE.CCSEND.COM\n" +
        "X-SID-Result: PASS\n" +
        "X-MS-Exchange-Organization-PCL: 2\n" +
        "X-MS-Exchange-AtpMessageProperties: SA|SL\n" +
        "X-MS-Exchange-Organization-SCL: 0\n" +
        "X-Microsoft-Antispam: BCL:1;\n" +
        "X-MS-Exchange-Safelinks-Url-KeyVer: 1\n" +
        "X-MS-Exchange-ATPSafeLinks-Stat: 0\n" +
        "X-MS-Exchange-Safelinks-Url-KeyVer: 1\n" +
        "X-MS-Exchange-ATPSafeLinks-BitVector: 3000:0x0|0x0|0x3000;\n" +
        "X-OriginatorOrg: outlook.com\n" +
        "X-MS-Exchange-CrossTenant-OriginalArrivalTime: 14 Jul 2020 18:41:21.6249\n" +
        " (UTC)\n" +
        "X-MS-Exchange-CrossTenant-Network-Message-Id: 42e4fc51-d2dd-490c-433d-08d828258159\n" +
        "X-MS-Exchange-CrossTenant-Id: 84df9e7f-e9f6-40af-b435-aaaaaaaaaaaa\n" +
        "X-MS-Exchange-CrossTenant-AuthSource:\n" +
        " HE1EUR04FT039.eop-eur04.prod.protection.outlook.com\n" +
        "X-MS-Exchange-CrossTenant-AuthAs: Anonymous\n" +
        "X-MS-Exchange-CrossTenant-FromEntityHeader: Internet\n" +
        "X-MS-Exchange-CrossTenant-RMS-PersistedConsumerOrg:\n" +
        " 00000000-0000-0000-0000-000000000000\n" +
        "X-MS-Exchange-Transport-CrossTenantHeadersStamped: HE1EUR04HT207\n" +
        "X-MS-Exchange-Transport-EndToEndLatency: 00:00:01.3895325\n" +
        "X-MS-Exchange-Processed-By-BccFoldering: 15.20.3174.025\n" +
        "X-Message-Info:\n" +
        "	5vMbyqxGkdebmBIBmsJrnP7JQx6T4ncINFmhrDtAlWDrNbPDThcg9BY+ctBPmd2uI3vzEp0Q3MJyf8G/Sw3J5rgh1U92Ex6RDNm4WqBnbBugwTyLdFcM5EzV1KVhT41tI7B5k/vPVb/lprrteekIn1DoPLVcQjw909dbQUo9E0WbxcCxDNGR3H/Jxn1s5bn4KcFfSPX5CCdf3gjE3VOjHQ==\n" +
        "X-Message-Delivery: Vj0xLjE7dXM9MDtsPTA7YT0xO0Q9MTtHRD0xO1NDTD0z\n" +
        "X-Microsoft-Antispam-Mailbox-Delivery:\n" +
        "	abwl:0;wl:0;pcwl:0;kl:0;iwl:0;ijl:0;dwl:0;dkl:0;rwl:0;ucf:0;jmr:0;ex:0;auth:1;dest:I;ENG:(5062000282)(90000002)(90012020)(90026001)(9000001)(9050020)(9100021)(5061607266)(5061608174)(4900115)(98392012)(98391011)(4920090)(6516101)(6515079)(4950130)(4990090);\n" +
        "X-Microsoft-Antispam-Message-Info:\n" +
        "	=?us-ascii?Q?J/fdProDb0P+kdDhy53RsYRPiWQp/RyS7mq6bvKayvXe4WgmRvR4ZB42bboq?=\n" +
        " =?us-ascii?Q?e20fik78+Dv1fvddWoeuKBIt4QlGUGjqMOWTMBg5YH/SzbYWu/+jcafwoNk3?=\n" +
        " =?us-ascii?Q?XGcwj+KDJnDDkdeRepPMjhh2c4wEzheMKp5jLkmMbq3FU5C21U3rKGwmBUzr?=\n" +
        " =?us-ascii?Q?A3cqa9faFonmTXVK1WCuMO/jN1+GXnjWn1uEVJjCOGmzZqCz7vlAViYec31E?=\n" +
        " =?us-ascii?Q?TS7TrZgpyYm6FYQ2vJjV4OYK6CkWfIGsNmXAEcEDgrdSlkk2btQStBBKWpgI?=\n" +
        " =?us-ascii?Q?QR23ZGFGdo0O75P6ZtSUzLU9HwQkh7MWicf8V2b0QWqmQpPjdQmejHYjUX36?=\n" +
        " =?us-ascii?Q?Yik2MnJbgeaPBqVli9jN3T6Vi4nRuupiCgTI+XYg4X1+NkUEycfEyljvmCyy?=\n" +
        " =?us-ascii?Q?YIIv9gYWPdYBtet1ECgcmdO+k1rGRaNyCdfm3iane3mUQyIiqlWs4vUI2y7u?=\n" +
        " =?us-ascii?Q?r8r2rtZuha6Vys32qtvTM6q3++bHPBsdJs8EXladbysmx8Mx4mDFthRIjENQ?=\n" +
        " =?us-ascii?Q?1rkJNtCaReI9XZaabQcq/mNZsTLDQbIBfiOI04kfn3+e+c/Rd4cMzRUu57p7?=\n" +
        " =?us-ascii?Q?vM7WGSIGGa5juRjMZVcE1GsSBPNfFDmHzsXcB4ya0ehIRcQ8ngU0wa1AdVhR?=\n" +
        " =?us-ascii?Q?IR/dD1WsWYK9SQN5XB9DEG1BTBwHYHsxoY8jdYaJuis5aRaonJhDTs1KrZdw?=\n" +
        " =?us-ascii?Q?I+tZuAXzIkkna8P6JBRgXQgjCc7ooFawcQd+JfD1eIHTIm14IAO8vC1r09Uh?=\n" +
        " =?us-ascii?Q?8RB/LYjo1UEHVX1+cbJhMa3LNYqEUoLC7uKUVDkW39YCSlCLIISd7zRFjXju?=\n" +
        " =?us-ascii?Q?5k9NjF5uYQe9FjbSoKG25YIw+Qfy7MrC65uEhwpJcTMEMam082jlYrjuM5M1?=\n" +
        " =?us-ascii?Q?n8o7qFlLdJOOsHckpiTRR0uO2C2xZew2FeZmFqHvsrwTgUykhyta5U109UxU?=\n" +
        " =?us-ascii?Q?e6C+SKWfGqdtAHJYXzE8TkPtuLUbIhpDj/1KCmjCnQfqBLgsLf3YKjs/XHH3?=\n" +
        " =?us-ascii?Q?jZapUUeFMu1JPjY1H7SI7qZYxkRMXi73xtnONRaRjJP7QhOZ+z2RmaOzf4eh?=\n" +
        " =?us-ascii?Q?yRknnr9cw9mFk72T6z2Ul2LZYL/Ebw=3D=3D?=\n";

    var goodCaseHeaderModel = HeaderModel(goodCaseHeaders);
    assert.arrayEqual(goodCaseHeaderModel.summary.summaryRows, summaryRows, "summaryRows-good-casing");
    assert.arrayEqual(goodCaseHeaderModel.receivedHeaders.receivedRows, receivedRows, "receivedRows-good-casing");
    assert.arrayEqual(goodCaseHeaderModel.antiSpamReport.antiSpamRows, antiSpamRows, "antiSpamRows-good-casing");
    assert.arrayEqual(goodCaseHeaderModel.forefrontAntiSpamReport.forefrontAntiSpamRows, forefrontAntiSpamRows, "forefrontAntiSpamRows-good-casing");

    var badCaseHeaders = "received: from HE1EUR04HT207.eop-eur04.prod.protection.outlook.com\n" +
        " (2603:10b6:408:c0::39) by BN8PR19MB2915.namprd19.prod.outlook.com with HTTPS\n" +
        " via BN8PR15CA0026.NAMPRD15.PROD.OUTLOOK.COM; Tue, 14 Jul 2020 18:41:23 +0000\n" +
        "received: from HE1EUR04FT039.eop-eur04.prod.protection.outlook.com\n" +
        " (2a01:111:e400:7e0d::4f) by\n" +
        " HE1EUR04HT207.eop-eur04.prod.protection.outlook.com (2a01:111:e400:7e0d::405)\n" +
        " with Microsoft SMTP Server (version=TLS1_2,\n" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.3174.21; Tue, 14 Jul\n" +
        " 2020 18:41:22 +0000\n" +
        "authentication-results: spf=pass (sender IP is 208.75.123.162)\n" +
        " smtp.mailfrom=in.constantcontact.com; outlook.com; dkim=pass (signature was\n" +
        " verified) header.d=pbscharlotte.ccsend.com;outlook.com; dmarc=none\n" +
        " action=none header.from=wtvi.org;compauth=fail reason=001\n" +
        "received-spf: Pass (protection.outlook.com: domain of in.constantcontact.com\n" +
        " designates 208.75.123.162 as permitted sender)\n" +
        " receiver=protection.outlook.com; client-ip=208.75.123.162;\n" +
        " helo=ccm27.constantcontact.com;\n" +
        "received: from ccm27.constantcontact.com (208.75.123.162) by\n" +
        " HE1EUR04FT039.mail.protection.outlook.com (10.152.26.153) with Microsoft SMTP\n" +
        " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id\n" +
        " 15.20.3174.21 via Frontend Transport; Tue, 14 Jul 2020 18:41:21 +0000\n" +
        "x-incomingtopheadermarker:\n" +
        " OriginalChecksum:424E32F552252F90CC4D92C6DA02EB496153B34FF89C7DF12D0C33CF4543FE80;UpperCasedChecksum:D202FB6FC49EE6CAD8BC8DF97C1C80502ACFF17CE8D7B39B10BB310A45496E05;SizeAsReceived:2601;Count:24\n" +
        "return-path:\n" +
        " AqeHmUtTNRpaUZj9CNd6Rxg==_1115276745036_oCND0ALXEeiiWdSuUo6yew==@in.constantcontact.com\n" +
        "received: from [10.252.1.143] ([10.252.1.143:47944] helo=p2-jbemailsyndicator32.ctct.net)\n" +
        "	by 10.249.244.10 (envelope-from <AqeHmUtTNRpaUZj9CNd6Rxg==_1115276745036_oCND0ALXEeiiWdSuUo6yew==@in.constantcontact.com>)\n" +
        "	(ecelerity 4.3.1.69340 r(Core:4.3.1.0)) with ESMTP\n" +
        "	id C8/A8-65519-05CFD0F5; Tue, 14 Jul 2020 14:41:20 -0400\n" +
        "dkim-signature: v=1; q=dns/txt; a=rsa-sha256; c=relaxed/relaxed; s=1000126720; d=pbscharlotte.ccsend.com; h=date:mime-version:subject:X-Feedback-ID:X-250ok-CID:message-id:from:reply-to:list-unsubscribe:list-unsubscribe-post:to; bh=WHafE/x2EJSWCLU2YIR8W1io+dQKFZ/pUDVwHqQdiv0=; b=fG+TTOhTr4X4O/5754xsXVScAbBaBkjMKRtzUcIOytqszvhC/X+bxori5rY+RfvQBIU7AbvzNNXmtcmIsjrNDvF5O0RDvTuXgqZad0hyqCATHxpSgdlKs2UdIecj8CSFXuh5bfwEn2d3/j3RKH2CD9YYUCPQux+C8vT7SMd9XNA=\n" +
        "dkim-signature: v=1; q=dns/txt; a=rsa-sha256; c=relaxed/relaxed; s=1000073432; d=auth.ccsend.com; h=date:mime-version:subject:X-Feedback-ID:X-250ok-CID:message-id:from:reply-to:list-unsubscribe:list-unsubscribe-post:to; bh=WHafE/x2EJSWCLU2YIR8W1io+dQKFZ/pUDVwHqQdiv0=; b=iPEp4ThtBazoxYkcORXwk4tnNurm/IGWBf/pSj3cvBsb9Iz6CVMLVw6Bv7K+WZTD8jEfect+kCVDAzTBiy6z2XbXUf/6zGhlpdH9m/1AW41217Az9yKEmmWK8wxizj9clQyhA/EwCmdlEdGfZvyakKLDH9VlpdvJKhswl2+pT9M=\n" +
        "message-id: <1134542665376.1115276745036.1949397254.0.411440JL.2002@scheduler.constantcontact.com>\n" +
        "date: Tue, 14 Jul 2020 14:41:20 -0400 (EDT)\n" +
        "from: PBS Charlotte <memberservices@wtvi.org>\n" +
        "reply-to: memberservices@wtvi.org\n" +
        "sender: PBS Charlotte <natascha@pbscharlotte.ccsend.com>\n" +
        "to: test@outlook.com\n" +
        "subject: Hear Hamilton Anytime, Anywhere\n" +
        "archived-at: https://www.bing.com\n" +
        "mime-version: 1.0\n" +
        "content-type: multipart/alternative; \n" +
        "	boundary=\"----=_Part_636915194_1889124954.1594752080758\"\n" +
        "list-unsubscribe:\n" +
        " <https://eur04.safelinks.protection.outlook.com/?url=https%3A%2F%2Fvisitor.constantcontact.com%2Fdo%3Fp%3Dun%26m%3D001znV2qCNlC4q69jnKYsCZDw%253D%253D%26se%3D001ux4it_8ZgYXx3D-UkRvBXQ%253D%253D%26t%3D001EkZLEx15CcE%253D%26llr%3Dmkgz9voab&amp;data=02%7C01%7C%7C42e4fc51d2dd490c433d08d828258159%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C637303488827969246&amp;sdata=R18jtujsqi9qwNLx%2B%2BkHr%2FIl14CeUgUOttipQOoPTS4%3D&amp;reserved=0>\n" +
        "list-unsubscribe-post: List-Unsubscribe=One-Click\n" +
        "x-campaign-activity-id: a9e1e652-d4cd-4696-9466-3f4235de91c6\n" +
        "x-250ok-cid: a9e1e652-d4cd-4696-9466-3f4235de91c6\n" +
        "x-channel-id: a02343d0-02d7-11e8-a259-d4ae528eb27b\n" +
        "x-mailer: Roving Constant Contact 2012 (http://www.constantcontact.com)\n" +
        "x-return-path-hint: AqeHmUtTNRpaUZj9CNd6Rxg==_1115276745036_oCND0ALXEeiiWdSuUo6yew==@in.constantcontact.com\n" +
        "x-roving-campaignid: 1134542665376\n" +
        "x-roving-id: 1115276745036.1949397254\n" +
        "x-feedback-id: a02343d0-02d7-11e8-a259-d4ae528eb27b:a9e1e652-d4cd-4696-9466-3f4235de91c6:1115276745036:CTCT\n" +
        "x-ctct-id: 9fe7e880-02d7-11e8-a24b-d4ae528eb27b\n" +
        "x-incomingheadercount: 24\n" +
        "x-ms-exchange-organization-expirationstarttime: 14 Jul 2020 18:41:22.1936\n" +
        " (UTC)\n" +
        "x-ms-exchange-organization-expirationstarttimereason: OriginalSubmit\n" +
        "x-ms-exchange-organization-expirationinterval: 1:00:00:00.0000000\n" +
        "x-ms-exchange-organization-expirationintervalreason: OriginalSubmit\n" +
        "x-ms-exchange-organization-network-message-id:\n" +
        " 42e4fc51-d2dd-490c-433d-08d828258159\n" +
        "x-eopattributedmessage: 0\n" +
        "x-eoptenantattributedmessage: 84df9e7f-e9f6-40af-b435-aaaaaaaaaaaa:0\n" +
        "x-ms-exchange-organization-messagedirectionality: Incoming\n" +
        "x-forefront-antispam-report:\n" +
        " CIP:208.75.123.162;CTRY:US;LANG:en;SCL:0;SRV:;IPV:NLI;SFV:NSPM;H:ccm27.constantcontact.com;PTR:ccm27.constantcontact.com;CAT:NONE;SFTY:;SFS:;DIR:INB;SFP:;\n" +
        "x-ms-publictraffictype: Email\n" +
        "x-ms-exchange-organization-authsource:\n" +
        " HE1EUR04FT039.eop-eur04.prod.protection.outlook.com\n" +
        "x-ms-exchange-organization-authas: Anonymous\n" +
        "x-ms-userlastlogontime: 7/14/2020 6:34:06 PM\n" +
        "x-ms-office365-filtering-correlation-id: 42e4fc51-d2dd-490c-433d-08d828258159\n" +
        "x-ms-traffictypediagnostic: HE1EUR04HT207:\n" +
        "x-ms-exchange-eopdirect: true\n" +
        "x-sender-ip: 208.75.123.162\n" +
        "x-sid-pra: NATASCHA@PBSCHARLOTTE.CCSEND.COM\n" +
        "x-sid-result: PASS\n" +
        "x-ms-exchange-organization-pcl: 2\n" +
        "x-ms-exchange-atpmessageproperties: SA|SL\n" +
        "x-ms-exchange-organization-scl: 0\n" +
        "x-microsoft-antispam: BCL:1;\n" +
        "x-ms-exchange-safelinks-url-keyver: 1\n" +
        "x-ms-exchange-atpsafelinks-stat: 0\n" +
        "x-ms-exchange-safelinks-url-keyver: 1\n" +
        "x-ms-exchange-atpsafelinks-bitvector: 3000:0x0|0x0|0x3000;\n" +
        "x-originatororg: outlook.com\n" +
        "x-ms-exchange-crosstenant-originalarrivaltime: 14 Jul 2020 18:41:21.6249\n" +
        " (UTC)\n" +
        "x-ms-exchange-crosstenant-network-message-id: 42e4fc51-d2dd-490c-433d-08d828258159\n" +
        "x-ms-exchange-crosstenant-id: 84df9e7f-e9f6-40af-b435-aaaaaaaaaaaa\n" +
        "x-ms-exchange-crosstenant-authsource:\n" +
        " HE1EUR04FT039.eop-eur04.prod.protection.outlook.com\n" +
        "x-ms-exchange-crosstenant-authas: Anonymous\n" +
        "x-ms-exchange-crosstenant-fromentityheader: Internet\n" +
        "x-ms-exchange-crosstenant-rms-persistedconsumerorg:\n" +
        " 00000000-0000-0000-0000-000000000000\n" +
        "x-ms-exchange-transport-crosstenantheadersstamped: HE1EUR04HT207\n" +
        "x-ms-exchange-transport-endtoendlatency: 00:00:01.3895325\n" +
        "x-ms-exchange-processed-by-bccfoldering: 15.20.3174.025\n" +
        "x-message-info:\n" +
        "	5vMbyqxGkdebmBIBmsJrnP7JQx6T4ncINFmhrDtAlWDrNbPDThcg9BY+ctBPmd2uI3vzEp0Q3MJyf8G/Sw3J5rgh1U92Ex6RDNm4WqBnbBugwTyLdFcM5EzV1KVhT41tI7B5k/vPVb/lprrteekIn1DoPLVcQjw909dbQUo9E0WbxcCxDNGR3H/Jxn1s5bn4KcFfSPX5CCdf3gjE3VOjHQ==\n" +
        "x-message-delivery: Vj0xLjE7dXM9MDtsPTA7YT0xO0Q9MTtHRD0xO1NDTD0z\n" +
        "x-microsoft-antispam-mailbox-delivery:\n" +
        "	abwl:0;wl:0;pcwl:0;kl:0;iwl:0;ijl:0;dwl:0;dkl:0;rwl:0;ucf:0;jmr:0;ex:0;auth:1;dest:I;ENG:(5062000282)(90000002)(90012020)(90026001)(9000001)(9050020)(9100021)(5061607266)(5061608174)(4900115)(98392012)(98391011)(4920090)(6516101)(6515079)(4950130)(4990090);\n" +
        "x-microsoft-antispam-message-info:\n" +
        "	=?us-ascii?Q?J/fdProDb0P+kdDhy53RsYRPiWQp/RyS7mq6bvKayvXe4WgmRvR4ZB42bboq?=\n" +
        " =?us-ascii?Q?e20fik78+Dv1fvddWoeuKBIt4QlGUGjqMOWTMBg5YH/SzbYWu/+jcafwoNk3?=\n" +
        " =?us-ascii?Q?XGcwj+KDJnDDkdeRepPMjhh2c4wEzheMKp5jLkmMbq3FU5C21U3rKGwmBUzr?=\n" +
        " =?us-ascii?Q?A3cqa9faFonmTXVK1WCuMO/jN1+GXnjWn1uEVJjCOGmzZqCz7vlAViYec31E?=\n" +
        " =?us-ascii?Q?TS7TrZgpyYm6FYQ2vJjV4OYK6CkWfIGsNmXAEcEDgrdSlkk2btQStBBKWpgI?=\n" +
        " =?us-ascii?Q?QR23ZGFGdo0O75P6ZtSUzLU9HwQkh7MWicf8V2b0QWqmQpPjdQmejHYjUX36?=\n" +
        " =?us-ascii?Q?Yik2MnJbgeaPBqVli9jN3T6Vi4nRuupiCgTI+XYg4X1+NkUEycfEyljvmCyy?=\n" +
        " =?us-ascii?Q?YIIv9gYWPdYBtet1ECgcmdO+k1rGRaNyCdfm3iane3mUQyIiqlWs4vUI2y7u?=\n" +
        " =?us-ascii?Q?r8r2rtZuha6Vys32qtvTM6q3++bHPBsdJs8EXladbysmx8Mx4mDFthRIjENQ?=\n" +
        " =?us-ascii?Q?1rkJNtCaReI9XZaabQcq/mNZsTLDQbIBfiOI04kfn3+e+c/Rd4cMzRUu57p7?=\n" +
        " =?us-ascii?Q?vM7WGSIGGa5juRjMZVcE1GsSBPNfFDmHzsXcB4ya0ehIRcQ8ngU0wa1AdVhR?=\n" +
        " =?us-ascii?Q?IR/dD1WsWYK9SQN5XB9DEG1BTBwHYHsxoY8jdYaJuis5aRaonJhDTs1KrZdw?=\n" +
        " =?us-ascii?Q?I+tZuAXzIkkna8P6JBRgXQgjCc7ooFawcQd+JfD1eIHTIm14IAO8vC1r09Uh?=\n" +
        " =?us-ascii?Q?8RB/LYjo1UEHVX1+cbJhMa3LNYqEUoLC7uKUVDkW39YCSlCLIISd7zRFjXju?=\n" +
        " =?us-ascii?Q?5k9NjF5uYQe9FjbSoKG25YIw+Qfy7MrC65uEhwpJcTMEMam082jlYrjuM5M1?=\n" +
        " =?us-ascii?Q?n8o7qFlLdJOOsHckpiTRR0uO2C2xZew2FeZmFqHvsrwTgUykhyta5U109UxU?=\n" +
        " =?us-ascii?Q?e6C+SKWfGqdtAHJYXzE8TkPtuLUbIhpDj/1KCmjCnQfqBLgsLf3YKjs/XHH3?=\n" +
        " =?us-ascii?Q?jZapUUeFMu1JPjY1H7SI7qZYxkRMXi73xtnONRaRjJP7QhOZ+z2RmaOzf4eh?=\n" +
        " =?us-ascii?Q?yRknnr9cw9mFk72T6z2Ul2LZYL/Ebw=3D=3D?=\n";

    var badCaseHeaderModel = HeaderModel(badCaseHeaders);
    assert.arrayEqual(badCaseHeaderModel.summary.summaryRows, summaryRows, "summaryRows-bad-casing");
    assert.arrayEqual(badCaseHeaderModel.receivedHeaders.receivedRows, receivedRows, "receivedRows-bad-casing");
    assert.arrayEqual(badCaseHeaderModel.antiSpamReport.antiSpamRows, antiSpamRows, "antiSpamRows-bad-casing");
    assert.arrayEqual(badCaseHeaderModel.forefrontAntiSpamReport.forefrontAntiSpamRows, forefrontAntiSpamRows, "forefrontAntiSpamRows-bad-casing");
});