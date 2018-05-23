/* global QUnit */
/* global extractHeadersFromXml */

QUnit.test("Received Tests", function (assert) {
    var xml1 =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Header><h:ServerVersionInfo MajorVersion=\"15\" MinorVersion=\"20\" MajorBuildNumber=\"797\" MinorBuildNumber=\"11\" Version=\"V2018_01_08\" xmlns:h=\"http://schemas.microsoft.com/exchange/services/2006/types\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"/></s:Header><s:Body><m:GetItemResponse xmlns:m=\"http://schemas.microsoft.com/exchange/services/2006/messages\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"http://schemas.microsoft.com/exchange/services/2006/types\"><m:ResponseMessages><m:GetItemResponseMessage ResponseClass=\"Success\"><m:ResponseCode>NoError</m:ResponseCode><m:Items><t:Message><t:ItemId Id=\"AQMkADAwATM0MDAAMS1hYzNiLWIzYjEtMDACLTAwCgBGAAADwxobsfxV00aTGGYxwhj+tgcAzcLQNcgKeEiqUypBuKrhfwAAAgEMAAAAtxZjPqJy40C2DTBmR6PgWgABJcrCkgAAAA==\" ChangeKey=\"CQAAABYAAAC3FmM+onLjQLYNMGZHo+BaAAEl980z\"/><t:ExtendedProperty><t:ExtendedFieldURI PropertyTag=\"0x7d\" PropertyType=\"String\"/><t:Value>Received: from BY2NAM01HT049.eop-nam01.prod.protection.outlook.com&#xD;" +
        " (2a01:111:e400:5a6b::50) by BY2PR16MB0487.namprd16.prod.outlook.com with&#xD;" +
        " HTTPS via BY2PR1001CA0082.NAMPRD10.PROD.OUTLOOK.COM; Mon, 21 May 2018&#xD;" +
        " 16:08:55 +0000&#xD;" +
        "Received: from BY2NAM01FT028.eop-nam01.prod.protection.outlook.com&#xD;" +
        " (10.152.68.57) by BY2NAM01HT049.eop-nam01.prod.protection.outlook.com&#xD;" +
        " (10.152.69.85) with Microsoft SMTP Server (version=TLS1_2,&#xD;" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.776.18; Mon, 21&#xD;" +
        " May 2018 16:08:54 +0000&#xD;" +
        "Received: from mail-ua0-f171.google.com (209.85.217.171) by&#xD;" +
        " BY2NAM01FT028.mail.protection.outlook.com (10.152.69.201) with Microsoft SMTP&#xD;" +
        " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA_P384) id&#xD;" +
        " 15.20.776.10 via Frontend Transport; Mon, 21 May 2018 16:08:54 +0000&#xD;" +
        "Received: by mail-ua0-f171.google.com with SMTP id g9-v6so10266038uak.7;&#xD;" +
        "        Mon, 21 May 2018 09:08:54 -0700 (PDT)&#xD;" +
        "Received: from [10.233.168.165] ([186.2.138.141])&#xD;" +
        "        by smtp.gmail.com with ESMTPSA id 72-v6sm5966316vko.20.2018.05.21.09.08.52&#xD;" +
        "        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);&#xD;" +
        "        Mon, 21 May 2018 09:08:53 -0700 (PDT)&#xD;" +
        "Subject: Re: Lake House&#xD;" +
        "From: Test User &lt;testuser@gmail.com&gt;&#xD;" +
        "Date: Mon, 21 May 2018 10:08:51 -0600&#xD;" +
        "Cc: Test User1 &lt;testuser1@gmail.com&gt;,&#xD;" +
        " Test User2 &lt;testuser2@outlook.com&gt;,&#xD;" +
        " Test User3 &lt;testuser3@microsoft.com&gt;&#xD;" +
        "To: Test User4 &lt;testuser4@gmail.com&gt;&#xD;" +
        "</t:Value></t:ExtendedProperty></t:Message></m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse></s:Body></s:Envelope>";
    var prop1 =
        "Received: from BY2NAM01HT049.eop-nam01.prod.protection.outlook.com\r" +
        " (2a01:111:e400:5a6b::50) by BY2PR16MB0487.namprd16.prod.outlook.com with\r" +
        " HTTPS via BY2PR1001CA0082.NAMPRD10.PROD.OUTLOOK.COM; Mon, 21 May 2018\r" +
        " 16:08:55 +0000\r" +
        "Received: from BY2NAM01FT028.eop-nam01.prod.protection.outlook.com\r" +
        " (10.152.68.57) by BY2NAM01HT049.eop-nam01.prod.protection.outlook.com\r" +
        " (10.152.69.85) with Microsoft SMTP Server (version=TLS1_2,\r" +
        " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.776.18; Mon, 21\r" +
        " May 2018 16:08:54 +0000\r" +
        "Received: from mail-ua0-f171.google.com (209.85.217.171) by\r" +
        " BY2NAM01FT028.mail.protection.outlook.com (10.152.69.201) with Microsoft SMTP\r" +
        " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA_P384) id\r" +
        " 15.20.776.10 via Frontend Transport; Mon, 21 May 2018 16:08:54 +0000\r" +
        "Received: by mail-ua0-f171.google.com with SMTP id g9-v6so10266038uak.7;\r" +
        "        Mon, 21 May 2018 09:08:54 -0700 (PDT)\r" +
        "Received: from [10.233.168.165] ([186.2.138.141])\r" +
        "        by smtp.gmail.com with ESMTPSA id 72-v6sm5966316vko.20.2018.05.21.09.08.52\r" +
        "        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);\r" +
        "        Mon, 21 May 2018 09:08:53 -0700 (PDT)\r" +
        "Subject: Re: Lake House\r" +
        "From: Test User <testuser@gmail.com>\r" +
        "Date: Mon, 21 May 2018 10:08:51 -0600\r" +
        "Cc: Test User1 <testuser1@gmail.com>,\r" +
        " Test User2 <testuser2@outlook.com>,\r" +
        " Test User3 <testuser3@microsoft.com>\r" +
        "To: Test User4 <testuser4@gmail.com>\r";

    assert.propEqual(extractHeadersFromXml(xml1),
        {
            "prop": prop1,
        });

    var xml2 =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Header><h:ServerVersionInfo MajorVersion=\"15\" MinorVersion=\"20\" MajorBuildNumber=\"797\" MinorBuildNumber=\"11\" Version=\"V2018_01_08\" xmlns:h=\"http://schemas.microsoft.com/exchange/services/2006/types\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"/></s:Header><s:Body><m:GetItemResponse xmlns:m=\"http://schemas.microsoft.com/exchange/services/2006/messages\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"http://schemas.microsoft.com/exchange/services/2006/types\"><m:ResponseMessages><m:GetItemResponseMessage ResponseClass=\"Success\"><m:ResponseCode>NoError</m:ResponseCode><m:Items><t:Message><t:ItemId Id=\"AQMkADAwATM0MDAAMS1hYzNiLWIzYjEtMDACLTAwCgBGAAADwxobsfxV00aTGGYxwhj+tgcAzcLQNcgKeEiqUypBuKrhfwAAAgEMAAAAtxZjPqJy40C2DTBmR6PgWgABJcrCkgAAAA==\" ChangeKey=\"CQAAABYAAAC3FmM+onLjQLYNMGZHo+BaAAEl980z\"/><t:ExtendedProperty><t:ExtendedFieldURI PropertyTag=\"0x7d\" PropertyType=\"String\"/><t:Value>" +
        "Subject: Test message&#xD;" +
        "From: Test User &lt;testuser@gmail.com&gt;&#xD;" +
        "&#x0;</t:Value></t:ExtendedProperty></t:Message></m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse></s:Body></s:Envelope>";
    var prop2 =
        "Subject: Test message\r" +
        "From: Test User <testuser@gmail.com>\r";
    assert.propEqual(extractHeadersFromXml(xml2),
        {
            "prop": prop2,
        });

});