/* global QUnit */
/* global AntiSpamReport */
/* global ForefrontAntiSpamReport */

QUnit.test("antiSpam Tests", function (assert) {
    var header = "BCL:1;";
    var unparsed = "";
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
            "label": "Phishing Confidence Level",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "source",
            "headerName": "X-Microsoft-Antispam",
            "label": "Source header",
            "value": header,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>BCL:1;</a>"
        },
        {
            "header": "unparsed",
            "headerName": "X-Microsoft-Antispam",
            "label": "Unknown fields",
            "value": unparsed,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>X-Microsoft-Antispam</a>"
        }
    ];

    var antiSpamReport = AntiSpamReport();
    antiSpamReport.add(header);
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
            "headerName": "X-Forefront-Antispam-Report",
            "label": "ARC protocol",
            "value": "",
            "valueUrl": ""
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
            "label": "Phishing Confidence Level",
            "value": "",
            "valueUrl": ""
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
            "value": "",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>X-Forefront-Antispam-Report</a>"
        },
        {
            "header": "SRV",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Bulk email status",
            "value": "",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>X-Forefront-Antispam-Report</a>"
        },
        {
            "header": "X-CustomSpam",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Advanced Spam Filtering",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "SFS",
            "headerName": "SFS",
            "label": "Spam rules",
            "value": "",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/exchange/monitoring/trace-an-email-message/run-a-message-trace-and-view-results' target = '_blank'>SFS</a>"
        },
        {
            "header": "source",
            "headerName": "X-Microsoft-Antispam",
            "label": "Source header",
            "value": header,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>CIP:208.75.123.162;CTRY:US;LANG:en;SCL:0;SRV:;IPV:NLI;SFV:NSPM;H:ccm27.constantcontact.com;PTR:ccm27.constantcontact.com;CAT:NONE;SFTY:;SFS:;DIR:INB;SFP:;</a>"
        },
        {
            "header": "unparsed",
            "headerName": "X-Microsoft-Antispam",
            "label": "Unknown fields",
            "value": unparsed,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>DIR:INB;SFP:;</a>"
        }
    ];

    var forefrontAntiSpamReport = ForefrontAntiSpamReport();
    forefrontAntiSpamReport.add(header);
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
            "headerName": "X-Microsoft-Antispam",
            "label": "Bulk Complaint Level",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "PCL",
            "headerName": "X-Microsoft-Antispam",
            "label": "Phishing Confidence Level",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "source",
            "headerName": "X-Microsoft-Antispam",
            "label": "Source header",
            "value": header,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>UIP:(null);(null);(null)SFV:SKI</a>"
        },
        {
            "header": "unparsed",
            "headerName": "X-Microsoft-Antispam",
            "label": "Unknown fields",
            "value": unparsed,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>UIP:;SFV:SKI;</a>"
        }
    ];

    var antiSpamReport = AntiSpamReport();
    antiSpamReport.add(header);
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
            "headerName": "X-Forefront-Antispam-Report",
            "label": "ARC protocol",
            "value": "",
            "valueUrl": ""
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
            "value": "1",
            "valueUrl": "<a href = 'https://technet.microsoft.com/en-us/library/aa996878' target = '_blank'>1</a>"
        },
        {
            "header": "PCL",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Phishing Confidence Level",
            "value": "",
            "valueUrl": ""
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
            "value": "NAM04-BN3-obe.outbound.protection.outlook.com",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>NAM04-BN3-obe.outbound.protection.outlook.com</a>"
        },
        {
            "header": "PTR",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "PTR Record",
            "value": "mail-eopbgr680131.outbound.protection.outlook.com",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>mail-eopbgr680131.outbound.protection.outlook.com</a>"
        },
        {
            "header": "CIP",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Connecting IP Address",
            "value": "40.107.68.131",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>40.107.68.131</a>"
        },
        {
            "header": "CAT",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Protection Policy Category",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "SFTY",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Phishing message",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "SRV",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Bulk email status",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "X-CustomSpam",
            "headerName": "X-Forefront-Antispam-Report",
            "label": "Advanced Spam Filtering",
            "value": "",
            "valueUrl": ""
        },
        {
            "header": "SFS",
            "headerName": "SFS",
            "label": "Spam rules",
            "value": "(2980300002)(199004)(189003)(53386004)(6916009)(21480400003)(6606003)(102836004)(6506007)(7116003)(14454004)(5660300001)(25786009)(567704001)(7636002)(7736002)(74316002)(26005)(6436002)(61614004)(606006)(8676002)(63106013)(5640700003)(8636004)(5000100001)(1096003)(246002)(33656002)(58800400003)(336012)(84326002)(7696005)(221733001)(356004)(66060400003)(2501003)(2351001)(106466001)(66066001)(3480700005)(106002)(16586007)(71190400001)(86362001)(568964002)(16003)(99286004)(236005)(3846002)(9686003)(6116002)(54896002)(6306002)(5024004)(2476003)(19627405001)(22186003)(99936001)(3672435006)(476003)(126002)(486006)(55016002)(28085005)",
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/exchange/monitoring/trace-an-email-message/run-a-message-trace-and-view-results' target = '_blank'>(2980300002)(199004)(189003)(53386004)(6916009)(21480400003)(6606003)(102836004)(6506007)(7116003)(14454004)(5660300001)(25786009)(567704001)(7636002)(7736002)(74316002)(26005)(6436002)(61614004)(606006)(8676002)(63106013)(5640700003)(8636004)(5000100001)(1096003)(246002)(33656002)(58800400003)(336012)(84326002)(7696005)(221733001)(356004)(66060400003)(2501003)(2351001)(106466001)(66066001)(3480700005)(106002)(16586007)(71190400001)(86362001)(568964002)(16003)(99286004)(236005)(3846002)(9686003)(6116002)(54896002)(6306002)(5024004)(2476003)(19627405001)(22186003)(99936001)(3672435006)(476003)(126002)(486006)(55016002)(28085005)</a>"
        },
        {
            "header": "source",
            "headerName": "X-Microsoft-Antispam",
            "label": "Source header",
            "value": header,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>CIP:40.107.68.131;IPV:NLI;CTRY:US;EFV:NLI;SFV:NSPM;SFS:(2980300002)(199004)(189003)(53386004)(6916009)(21480400003)(6606003)(102836004)(6506007)(7116003)(14454004)(5660300001)(25786009)(567704001)(7636002)(7736002)(74316002)(26005)(6436002)(61614004)(606006)(8676002)(63106013)(5640700003)(8636004)(5000100001)(1096003)(246002)(33656002)(58800400003)(336012)(84326002)(7696005)(221733001)(356004)(66060400003)(2501003)(2351001)(106466001)(66066001)(3480700005)(106002)(16586007)(71190400001)(86362001)(568964002)(16003)(99286004)(236005)(3846002)(9686003)(6116002)(54896002)(6306002)(5024004)(2476003)(19627405001)(22186003)(99936001)(3672435006)(476003)(126002)(486006)(55016002)(28085005);DIR:INB;SFP:;SCL:1;SRVR:DM5PR1501MB1992;H:NAM04-BN3-obe.outbound.protection.outlook.com;FPR:;SPF:Pass;LANG:en;PTR:mail-eopbgr680131.outbound.protection.outlook.com;A:1;MX:1;</a>"
        },
        {
            "header": "unparsed",
            "headerName": "X-Microsoft-Antispam",
            "label": "Unknown fields",
            "value": unparsed,
            "valueUrl": "<a href = 'https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers' target = '_blank'>EFV:NLI;DIR:INB;SFP:;SRVR:DM5PR1501MB1992;FPR:;SPF:Pass;A:1;MX:1;</a>"
        }
    ];

    var forefrontAntiSpamReport = ForefrontAntiSpamReport();
    forefrontAntiSpamReport.add(header);
    assert.propEqual(forefrontAntiSpamReport.forefrontAntiSpamRows, forefrontAntiSpamRows, "antiSpamRows spam");
    assert.propEqual(forefrontAntiSpamReport.source, header, "antiSpamRows-sourceHeader spam");
    assert.propEqual(forefrontAntiSpamReport.unparsed, unparsed, "antiSpamRows-unparsed spam");
});