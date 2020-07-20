/* global QUnit */
/* global AntiSpamReport */
/* global ForefrontAntiSpamReport */

QUnit.test("antiSpam Tests", function (assert) {
    var header = "BCL:1;";
    var unparsed = "";
    var antiSpamRows = [
        {
            "header": "BCL",
            "label": "Bulk Complaint Level",
            "url": "X-Microsoft-Antispam",
            "value": "1"
        },
        {
            "header": "PCL",
            "label": "Phishing Confidence Level",
            "url": "X-Microsoft-Antispam",
            "value": ""
        },
        {
            "header": "source",
            "label": "Source header",
            "url": "X-Microsoft-Antispam",
            "value": header
        },
        {
            "header": "unparsed",
            "label": "Unknown fields",
            "url": "X-Microsoft-Antispam",
            "value": unparsed
        }
    ];

    var antiSpamReport = AntiSpamReport();
    antiSpamReport.init(header);
    assert.propEqual(antiSpamReport.antiSpamRows, antiSpamRows, "antiSpamRows");
    assert.propEqual(antiSpamReport.source, header, "antiSpamRows-sourceHeader");
    assert.propEqual(antiSpamReport.unparsed, unparsed, "antiSpamRows-unparsed");
});

QUnit.test("forefront antiSpam Tests", function (assert) {
    var header =
        "CIP:208.75.123.162;CTRY:US;LANG:en;SCL:0;SRV:;IPV:NLI;SFV:NSPM;H:ccm27.constantcontact.com;PTR:ccm27.constantcontact.com;CAT:NONE;SFTY:;SFS:;DIR:INB;SFP:;";
    var unparsed = "DIR:INB;SFP:;";
    var forefrontAntiSpamRows = [
        {
            "header": "ARC",
            "label": "ARC protocol",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "CTRY",
            "label": "Country/Region",
            "url": "X-Forefront-Antispam-Report",
            "value": "US"
        },
        {
            "header": "LANG",
            "label": "Language",
            "url": "X-Forefront-Antispam-Report",
            "value": "en"
        },
        {
            "header": "SCL",
            "label": "Spam Confidence Level",
            "url": "X-MS-Exchange-Organization-SCL",
            "value": "0"
        },
        {
            "header": "PCL",
            "label": "Phishing Confidence Level",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "SFV",
            "label": "Spam Filtering Verdict",
            "url": "X-Forefront-Antispam-Report",
            "value": "NSPM"
        },
        {
            "header": "IPV",
            "label": "IP Filter Verdict",
            "url": "X-Forefront-Antispam-Report",
            "value": "NLI"
        },
        {
            "header": "H",
            "label": "HELO/EHLO String",
            "url": "X-Forefront-Antispam-Report",
            "value": "ccm27.constantcontact.com"
        },
        {
            "header": "PTR",
            "label": "PTR Record",
            "url": "X-Forefront-Antispam-Report",
            "value": "ccm27.constantcontact.com"
        },
        {
            "header": "CIP",
            "label": "Connecting IP Address",
            "url": "X-Forefront-Antispam-Report",
            "value": "208.75.123.162"
        },
        {
            "header": "CAT",
            "label": "Protection Policy Category",
            "url": "X-Forefront-Antispam-Report",
            "value": "NONE"
        },
        {
            "header": "SFTY",
            "label": "Phishing message",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "SRV",
            "label": "Bulk email status",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "X-CustomSpam",
            "label": "Advanced Spam Filtering",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "SFS",
            "label": "Spam rules",
            "url": "SFS",
            "value": ""
        },
        {
            "header": "source",
            "label": "Source header",
            "url": "X-Microsoft-Antispam",
            "value": header
        },
        {
            "header": "unparsed",
            "label": "Unknown fields",
            "url": "X-Microsoft-Antispam",
            "value": unparsed
        }];

    var forefrontAntiSpamReport = ForefrontAntiSpamReport();
    forefrontAntiSpamReport.init(header);
    assert.propEqual(forefrontAntiSpamReport.forefrontAntiSpamRows, forefrontAntiSpamRows, "forefrontAntiSpamRows");
    assert.propEqual(forefrontAntiSpamReport.source, header, "forefrontAntiSpamRows-sourceHeader");
    assert.propEqual(forefrontAntiSpamReport.unparsed, unparsed, "forefrontAntiSpamReport-unparsed");
});

QUnit.test("antiSpam nulls", function (assert) {
    var header = "UIP:(null);(null);(null)SFV:SKI";
    var unparsed = "UIP:;SFV:SKI;";
    var antiSpamRows = [
        {
            "header": "BCL",
            "label": "Bulk Complaint Level",
            "url": "X-Microsoft-Antispam",
            "value": ""
        },
        {
            "header": "PCL",
            "label": "Phishing Confidence Level",
            "url": "X-Microsoft-Antispam",
            "value": ""
        },
        {
            "header": "source",
            "label": "Source header",
            "url": "X-Microsoft-Antispam",
            "value": header
        },
        {
            "header": "unparsed",
            "label": "Unknown fields",
            "url": "X-Microsoft-Antispam",
            "value": unparsed
        }
    ];

    var antiSpamReport = AntiSpamReport();
    antiSpamReport.init(header);
    assert.propEqual(antiSpamReport.antiSpamRows, antiSpamRows, "antiSpamRows nulls");
    assert.propEqual(antiSpamReport.source, header, "antiSpamRows-sourceHeader nulls");
    assert.propEqual(antiSpamReport.unparsed, unparsed, "antiSpamRows-unparsed nulls");
});

QUnit.test("forefront antiSpam spam", function (assert) {
    var header = "CIP:40.107.68.131;IPV:NLI;CTRY:US;EFV:NLI;SFV:NSPM;SFS:(2980300002)(199004)(189003)(53386004)(6916009)(21480400003)(6606003)(102836004)(6506007)(7116003)(14454004)(5660300001)(25786009)(567704001)(7636002)(7736002)(74316002)(26005)(6436002)(61614004)(606006)(8676002)(63106013)(5640700003)(8636004)(5000100001)(1096003)(246002)(33656002)(58800400003)(336012)(84326002)(7696005)(221733001)(356004)(66060400003)(2501003)(2351001)(106466001)(66066001)(3480700005)(106002)(16586007)(71190400001)(86362001)(568964002)(16003)(99286004)(236005)(3846002)(9686003)(6116002)(54896002)(6306002)(5024004)(2476003)(19627405001)(22186003)(99936001)(3672435006)(476003)(126002)(486006)(55016002)(28085005);DIR:INB;SFP:;SCL:1;SRVR:DM5PR1501MB1992;H:NAM04-BN3-obe.outbound.protection.outlook.com;FPR:;SPF:Pass;LANG:en;PTR:mail-eopbgr680131.outbound.protection.outlook.com;A:1;MX:1;";
    var unparsed = "EFV:NLI;DIR:INB;SFP:;SRVR:DM5PR1501MB1992;FPR:;SPF:Pass;A:1;MX:1;";
    var forefrontAntiSpamRows = [
        {
            "header": "ARC",
            "label": "ARC protocol",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "CTRY",
            "label": "Country/Region",
            "url": "X-Forefront-Antispam-Report",
            "value": "US"
        },
        {
            "header": "LANG",
            "label": "Language",
            "url": "X-Forefront-Antispam-Report",
            "value": "en"
        },
        {
            "header": "SCL",
            "label": "Spam Confidence Level",
            "url": "X-MS-Exchange-Organization-SCL",
            "value": "1"
        },
        {
            "header": "PCL",
            "label": "Phishing Confidence Level",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "SFV",
            "label": "Spam Filtering Verdict",
            "url": "X-Forefront-Antispam-Report",
            "value": "NSPM"
        },
        {
            "header": "IPV",
            "label": "IP Filter Verdict",
            "url": "X-Forefront-Antispam-Report",
            "value": "NLI"
        },
        {
            "header": "H",
            "label": "HELO/EHLO String",
            "url": "X-Forefront-Antispam-Report",
            "value": "NAM04-BN3-obe.outbound.protection.outlook.com"
        },
        {
            "header": "PTR",
            "label": "PTR Record",
            "url": "X-Forefront-Antispam-Report",
            "value": "mail-eopbgr680131.outbound.protection.outlook.com"
        },
        {
            "header": "CIP",
            "label": "Connecting IP Address",
            "url": "X-Forefront-Antispam-Report",
            "value": "40.107.68.131"
        },
        {
            "header": "CAT",
            "label": "Protection Policy Category",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "SFTY",
            "label": "Phishing message",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "SRV",
            "label": "Bulk email status",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "X-CustomSpam",
            "label": "Advanced Spam Filtering",
            "url": "X-Forefront-Antispam-Report",
            "value": ""
        },
        {
            "header": "SFS",
            "label": "Spam rules",
            "url": "SFS",
            "value": "(2980300002)(199004)(189003)(53386004)(6916009)(21480400003)(6606003)(102836004)(6506007)(7116003)(14454004)(5660300001)(25786009)(567704001)(7636002)(7736002)(74316002)(26005)(6436002)(61614004)(606006)(8676002)(63106013)(5640700003)(8636004)(5000100001)(1096003)(246002)(33656002)(58800400003)(336012)(84326002)(7696005)(221733001)(356004)(66060400003)(2501003)(2351001)(106466001)(66066001)(3480700005)(106002)(16586007)(71190400001)(86362001)(568964002)(16003)(99286004)(236005)(3846002)(9686003)(6116002)(54896002)(6306002)(5024004)(2476003)(19627405001)(22186003)(99936001)(3672435006)(476003)(126002)(486006)(55016002)(28085005)"
        },
        {
            "header": "source",
            "label": "Source header",
            "url": "X-Microsoft-Antispam",
            "value": header
        },
        {
            "header": "unparsed",
            "label": "Unknown fields",
            "url": "X-Microsoft-Antispam",
            "value": unparsed
        }
    ];

    var forefrontAntiSpamReport = ForefrontAntiSpamReport();
    forefrontAntiSpamReport.init(header);
    assert.propEqual(forefrontAntiSpamReport.forefrontAntiSpamRows, forefrontAntiSpamRows, "antiSpamRows spam");
    assert.propEqual(forefrontAntiSpamReport.source, header, "antiSpamRows-sourceHeader spam");
    assert.propEqual(forefrontAntiSpamReport.unparsed, unparsed, "antiSpamRows-unparsed spam");
});