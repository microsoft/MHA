import { GetHeadersEWS } from "./GetHeadersEWS";

describe("XML Tests", () => {
    test("extractHeadersFromXml 1", () => {
        const xml1 =
            "<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Header><h:ServerVersionInfo MajorVersion=\"15\" MinorVersion=\"20\" MajorBuildNumber=\"797\" MinorBuildNumber=\"11\" Version=\"V2018_01_08\" xmlns:h=\"http://schemas.microsoft.com/exchange/services/2006/types\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"/></s:Header><s:Body><m:GetItemResponse xmlns:m=\"http://schemas.microsoft.com/exchange/services/2006/messages\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"http://schemas.microsoft.com/exchange/services/2006/types\"><m:ResponseMessages><m:GetItemResponseMessage ResponseClass=\"Success\"><m:ResponseCode>NoError</m:ResponseCode><m:Items><t:Message><t:ItemId Id=\"AQMkADAwATM0MDAAMS1hYzNiLWIzYjEtMDACLTAwCgBGAAADwxobsfxV00aTGGYxwhj+tgcAzcLQNcgKeEiqUypBuKrhfwAAAgEMAAAAtxZjPqJy40C2DTBmR6PgWgABJcrCkgAAAA==\" ChangeKey=\"CQAAABYAAAC3FmM+onLjQLYNMGZHo+BaAAEl980z\"/><t:ExtendedProperty><t:ExtendedFieldURI PropertyTag=\"0x7d\" PropertyType=\"String\"/><t:Value>Received: from BY2NAM01HT049.eop-nam01.prod.protection.outlook.com&#xD;" +
            " (2a01:111:e400:5a6b::50) by BY2PR16MB0487.namprd16.prod.outlook.com with&#xD;" +
            " HTTPS via BY2PR1001CA0082.NAMPRD10.PROD.OUTLOOK.COM; Mon, 21 May 2018&#xD;" +
            " 16:08:55 +0000&#xD;" +
            "Received: from BY2NAM01FT028.eop-nam01.prod.protection.outlook.com&#xD;" +
            " (10.152.68.57) by BY2NAM01HT049.eop-nam01.prod.protection.outlook.com&#xD;" +
            " (10.152.69.85) with Microsoft SMTP Server (version=TLS1_2,&#xD;" + // DevSkim: ignore DS440000
            " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.776.18; Mon, 21&#xD;" + // DevSkim: ignore DS440010
            " May 2018 16:08:54 +0000&#xD;" +
            "Received: from mail-ua0-f171.google.com (209.85.217.171) by&#xD;" +
            " BY2NAM01FT028.mail.protection.outlook.com (10.152.69.201) with Microsoft SMTP&#xD;" +
            " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA_P384) id&#xD;" + // DevSkim: ignore DS440000,DS440010
            " 15.20.776.10 via Frontend Transport; Mon, 21 May 2018 16:08:54 +0000&#xD;" +
            "Received: by mail-ua0-f171.google.com with SMTP id g9-v6so10266038uak.7;&#xD;" +
            "        Mon, 21 May 2018 09:08:54 -0700 (PDT)&#xD;" +
            "Received: from [10.233.168.165] ([186.2.138.141])&#xD;" +
            "        by smtp.gmail.com with ESMTPSA id 72-v6sm5966316vko.20.2018.05.21.09.08.52&#xD;" +
            "        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);&#xD;" + // DevSkim: ignore DS440000
            "        Mon, 21 May 2018 09:08:53 -0700 (PDT)&#xD;" +
            "Subject: Re: Lake House&#xD;" +
            "From: Test User &lt;testuser@gmail.com&gt;&#xD;" +
            "Date: Mon, 21 May 2018 10:08:51 -0600&#xD;" +
            "Cc: Test User1 &lt;testuser1@gmail.com&gt;,&#xD;" +
            " Test User2 &lt;testuser2@outlook.com&gt;,&#xD;" +
            " Test User3 &lt;testuser3@microsoft.com&gt;&#xD;" +
            "To: Test User4 &lt;testuser4@gmail.com&gt;&#xD;" +
            "</t:Value></t:ExtendedProperty></t:Message></m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse></s:Body></s:Envelope>";
        const prop1 =
            "Received: from BY2NAM01HT049.eop-nam01.prod.protection.outlook.com\n" +
            " (2a01:111:e400:5a6b::50) by BY2PR16MB0487.namprd16.prod.outlook.com with\n" +
            " HTTPS via BY2PR1001CA0082.NAMPRD10.PROD.OUTLOOK.COM; Mon, 21 May 2018\n" +
            " 16:08:55 +0000\n" +
            "Received: from BY2NAM01FT028.eop-nam01.prod.protection.outlook.com\n" +
            " (10.152.68.57) by BY2NAM01HT049.eop-nam01.prod.protection.outlook.com\n" +
            " (10.152.69.85) with Microsoft SMTP Server (version=TLS1_2,\n" + // DevSkim: ignore DS440000
            " cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P384) id 15.20.776.18; Mon, 21\n" + // DevSkim: ignore DS440010
            " May 2018 16:08:54 +0000\n" +
            "Received: from mail-ua0-f171.google.com (209.85.217.171) by\n" +
            " BY2NAM01FT028.mail.protection.outlook.com (10.152.69.201) with Microsoft SMTP\n" +
            " Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA_P384) id\n" + // DevSkim: ignore DS440000,DS440010
            " 15.20.776.10 via Frontend Transport; Mon, 21 May 2018 16:08:54 +0000\n" +
            "Received: by mail-ua0-f171.google.com with SMTP id g9-v6so10266038uak.7;\n" +
            "        Mon, 21 May 2018 09:08:54 -0700 (PDT)\n" +
            "Received: from [10.233.168.165] ([186.2.138.141])\n" +
            "        by smtp.gmail.com with ESMTPSA id 72-v6sm5966316vko.20.2018.05.21.09.08.52\n" +
            "        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);\n" + // DevSkim: ignore DS440000
            "        Mon, 21 May 2018 09:08:53 -0700 (PDT)\n" +
            "Subject: Re: Lake House\n" +
            "From: Test User <testuser@gmail.com>\n" +
            "Date: Mon, 21 May 2018 10:08:51 -0600\n" +
            "Cc: Test User1 <testuser1@gmail.com>,\n" +
            " Test User2 <testuser2@outlook.com>,\n" +
            " Test User3 <testuser3@microsoft.com>\n" +
            "To: Test User4 <testuser4@gmail.com>\n";

        expect(GetHeadersEWS.extractHeadersFromXml(xml1)).toEqual(
            {
                "prop": prop1
            });
    });

    test("extractHeadersFromXml 2", () => {
        const xml2 =
            "<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Header><h:ServerVersionInfo MajorVersion=\"15\" MinorVersion=\"20\" MajorBuildNumber=\"797\" MinorBuildNumber=\"11\" Version=\"V2018_01_08\" xmlns:h=\"http://schemas.microsoft.com/exchange/services/2006/types\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"/></s:Header><s:Body><m:GetItemResponse xmlns:m=\"http://schemas.microsoft.com/exchange/services/2006/messages\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"http://schemas.microsoft.com/exchange/services/2006/types\"><m:ResponseMessages><m:GetItemResponseMessage ResponseClass=\"Success\"><m:ResponseCode>NoError</m:ResponseCode><m:Items><t:Message><t:ItemId Id=\"AQMkADAwATM0MDAAMS1hYzNiLWIzYjEtMDACLTAwCgBGAAADwxobsfxV00aTGGYxwhj+tgcAzcLQNcgKeEiqUypBuKrhfwAAAgEMAAAAtxZjPqJy40C2DTBmR6PgWgABJcrCkgAAAA==\" ChangeKey=\"CQAAABYAAAC3FmM+onLjQLYNMGZHo+BaAAEl980z\"/><t:ExtendedProperty><t:ExtendedFieldURI PropertyTag=\"0x7d\" PropertyType=\"String\"/><t:Value>" +
            "Subject: Test message&#xD;" +
            "From: Test User &lt;testuser@gmail.com&gt;&#xD;" +
            "&#x0;</t:Value></t:ExtendedProperty></t:Message></m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse></s:Body></s:Envelope>";
        const prop2 =
            "Subject: Test message\n" +
            "From: Test User <testuser@gmail.com>\n";
        expect(GetHeadersEWS.extractHeadersFromXml(xml2)).toEqual(
            {
                "prop": prop2
            });
        expect(GetHeadersEWS.extractHeadersFromXml("Not xml")).toEqual({});
    });

    test("extractHeadersFromXml 3", () => {
        const xml3 =
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
            "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
            "<s:Header>" +
            "<h:ServerVersionInfo MajorVersion=\"15\" MinorVersion=\"20\" MajorBuildNumber=\"5293\" MinorBuildNumber=\"19\" Version=\"V2018_01_08\" xmlns:h=\"http://schemas.microsoft.com/exchange/services/2006/types\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"/>" +
            "</s:Header>" +
            "<s:Body>" +
            "<m:GetItemResponse xmlns:m=\"http://schemas.microsoft.com/exchange/services/2006/messages\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:t=\"http://schemas.microsoft.com/exchange/services/2006/types\">" +
            "<m:ResponseMessages>" +
            "<m:GetItemResponseMessage ResponseClass=\"Error\">" +
            "<m:MessageText>" +
            "The extended property attribute combination is invalid.</m:MessageText>" +
            "<m:ResponseCode>" +
            "ErrorInvalidExtendedProperty</m:ResponseCode>" +
            "<m:DescriptiveLinkKey>" +
            "0</m:DescriptiveLinkKey>" +
            "<m:MessageXml/>" +
            "<m:Items/>" +
            "</m:GetItemResponseMessage>" +
            "</m:ResponseMessages>" +
            "</m:GetItemResponse>" +
            "</s:Body>" +
            "</s:Envelope>";
        expect(GetHeadersEWS.extractHeadersFromXml(xml3)).toEqual({ responseCode: "ErrorInvalidExtendedProperty" });
        expect(GetHeadersEWS.extractHeadersFromXml("Not xml")).toEqual({});
    });
});
