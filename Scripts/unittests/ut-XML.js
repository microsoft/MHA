/* global QUnit */
/* global extractHeadersFromXml */

QUnit.test("Received Tests", function (assert) {
    var xml1 =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Header><h:ServerVersionInfo MajorVersion=\"15\" MinorVersion=\"20\" MajorBuildNumber=\"797\" MinorBuildNumber=\"11\" Version=\"V2018_01_08\" xmlns:h=\"http://schemas.microsoft.com/exchange/services/2006/types\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"/></s:Header><s:Body><m:GetItemResponse xmlns:m=\"http://schemas.microsoft.com/exchange/services/2006/messages\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"http://schemas.microsoft.com/exchange/services/2006/types\"><m:ResponseMessages><m:GetItemResponseMessage ResponseClass=\"Success\"><m:ResponseCode>NoError</m:ResponseCode><m:Items><t:Message><t:ItemId Id=\"AQMkADAwATM0MDAAMS1hYzNiLWIzYjEtMDACLTAwCgBGAAADwxobsfxV00aTGGYxwhj+tgcAzcLQNcgKeEiqUypBuKrhfwAAAgEMAAAAtxZjPqJy40C2DTBmR6PgWgABJcrCkgAAAA==\" ChangeKey=\"CQAAABYAAAC3FmM+onLjQLYNMGZHo+BaAAEl980z\"/><t:ExtendedProperty><t:ExtendedFieldURI PropertyTag=\"0x7d\" PropertyType=\"String\"/><t:Value>Received: from BY2NAM01HT049.eop-nam01.prod.protection.outlook.com&#xD;\n" +
        " (2a01:111:e400:5a6b::50) by BY2PR16MB0487.namprd16.prod.outlook.com with&#xD;\n" +
        " HTTPS via BY2PR1001CA0082.NAMPRD10.PROD.OUTLOOK.COM; Mon, 21 May 2018&#xD;\n" +
        " 16:08:55 +0000&#xD;\n" +
        "Received: from BY2NAM01FT028.eop-nam01.prod.protection.outlook.com&#xD;\n" +
        " (10.152.68.57) by BY2NAM01HT049.eop-nam01.prod.protection.outlook.com&#xD;\n" +
        " (10.152.69.85) with Microsoft SMTP Server (version=TLS1_2,&#xD;\n" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.776.18; Mon, 21&#xD;\n" +
        " May 2018 16:08:54 +0000&#xD;\n" +
        "Received: from mail-ua0-f171.google.com (209.85.217.171) by&#xD;\n" +
        " BY2NAM01FT028.mail.protection.outlook.com (10.152.69.201) with Microsoft SMTP&#xD;\n" +
        " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA_P384) id&#xD;\n" +
        " 15.20.776.10 via Frontend Transport; Mon, 21 May 2018 16:08:54 +0000&#xD;\n" +
        "Received: by mail-ua0-f171.google.com with SMTP id g9-v6so10266038uak.7;&#xD;\n" +
        "        Mon, 21 May 2018 09:08:54 -0700 (PDT)&#xD;\n" +
        "Received: from [10.233.168.165] ([186.2.138.141])&#xD;\n" +
        "        by smtp.gmail.com with ESMTPSA id 72-v6sm5966316vko.20.2018.05.21.09.08.52&#xD;\n" +
        "        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);&#xD;\n" +
        "        Mon, 21 May 2018 09:08:53 -0700 (PDT)&#xD;\n" +
        "Subject: Re: Lake House&#xD;\n" +
        "From: Test User &lt;testuser@gmail.com&gt;&#xD;\n" +
        "Date: Mon, 21 May 2018 10:08:51 -0600&#xD;\n" +
        "Cc: Test User1 &lt;testuser1@gmail.com&gt;,&#xD;\n" +
        " Test User2 &lt;testuser2@outlook.com&gt;,&#xD;\n" +
        " Test User3 &lt;testuser3@microsoft.com&gt;&#xD;\n" +
        "To: Test User4 &lt;testuser4@gmail.com&gt;&#xD;\n" +
        "</t:Value></t:ExtendedProperty></t:Message></m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse></s:Body></s:Envelope>";
    var prop1 =
        "Received: from BY2NAM01HT049.eop-nam01.prod.protection.outlook.com\r\n" +
        " (2a01:111:e400:5a6b::50) by BY2PR16MB0487.namprd16.prod.outlook.com with\r\n" +
        " HTTPS via BY2PR1001CA0082.NAMPRD10.PROD.OUTLOOK.COM; Mon, 21 May 2018\r\n" +
        " 16:08:55 +0000\r\n" +
        "Received: from BY2NAM01FT028.eop-nam01.prod.protection.outlook.com\r\n" +
        " (10.152.68.57) by BY2NAM01HT049.eop-nam01.prod.protection.outlook.com\r\n" +
        " (10.152.69.85) with Microsoft SMTP Server (version=TLS1_2,\r\n" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.776.18; Mon, 21\r\n" +
        " May 2018 16:08:54 +0000\r\n" +
        "Received: from mail-ua0-f171.google.com (209.85.217.171) by\r\n" +
        " BY2NAM01FT028.mail.protection.outlook.com (10.152.69.201) with Microsoft SMTP\r\n" +
        " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA_P384) id\r\n" +
        " 15.20.776.10 via Frontend Transport; Mon, 21 May 2018 16:08:54 +0000\r\n" +
        "Received: by mail-ua0-f171.google.com with SMTP id g9-v6so10266038uak.7;\r\n" +
        "        Mon, 21 May 2018 09:08:54 -0700 (PDT)\r\n" +
        "Received: from [10.233.168.165] ([186.2.138.141])\r\n" +
        "        by smtp.gmail.com with ESMTPSA id 72-v6sm5966316vko.20.2018.05.21.09.08.52\r\n" +
        "        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);\r\n" +
        "        Mon, 21 May 2018 09:08:53 -0700 (PDT)\r\n" +
        "Subject: Re: Lake House\r\n" +
        "From: Test User <testuser@gmail.com>\r\n" +
        "Date: Mon, 21 May 2018 10:08:51 -0600\r\n" +
        "Cc: Test User1 <testuser1@gmail.com>,\r\n" +
        " Test User2 <testuser2@outlook.com>,\r\n" +
        " Test User3 <testuser3@microsoft.com>\r\n" +
        "To: Test User4 <testuser4@gmail.com>\r\n";

    assert.propEqual(extractHeadersFromXml(xml1),
        {
            "prop": prop1,
        });
    //assert.equal(received.exists(), true);
    //assert.propEqual(received.receivedRows[0],
    //    {
    //        "by": "vmta6.response.nfcu.org (PowerMTA(TM) v3.5r17)",
    //        "percent": 0,
    //        "sourceHeader": header4,
    //    });
});