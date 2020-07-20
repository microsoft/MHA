/* exported mhaStrings */

var mhaStrings = (function () {
    function htmlEncode(value) { return value ? $('<div />').text(value).html() : ''; }

    function mapHeaderToURL(headerName, text) {
        for (var i = 0; i < headerToURLMap.length; i++) {
            if (headerName.toLowerCase() === headerToURLMap[i][0].toLowerCase()) {
                return ["<a href = '", headerToURLMap[i][1], "' target = '_blank'>", htmlEncode(text || headerName), "</a>"].join("");
            }
        }

        return null;
    }

    function mapValueToURL(text) {
        try {
            return ["<a href='", text, "' target='_blank'>", htmlEncode(text), "</a>"].join("");
        } catch (e) {
            return text;
        }
    }

    var headerToURLMap = [
        ["Accept-Language", "https://tools.ietf.org/html/rfc3282"],
        ["Archived-At", "https://tools.ietf.org/html/rfc5064"],
        ["Authentication-Results", "https://tools.ietf.org/html/rfc7601"],
        ["BCC", "https://tools.ietf.org/html/rfc5322#section-3.6.3"],
        ["CC", "https://tools.ietf.org/html/rfc5322#section-3.6.3"],
        ["Content-Description", "https://tools.ietf.org/html/rfc2045#section-8"],
        ["Content-Disposition", "https://tools.ietf.org/html/rfc2183"],
        ["Content-Id", "https://tools.ietf.org/html/rfc2045#section-7"],
        ["Content-Language", "https://tools.ietf.org/html/rfc3282"],
        ["Content-Transfer-Encoding", "https://tools.ietf.org/html/rfc2045#section-6"],
        ["Content-Type", "https://tools.ietf.org/html/rfc2045#section-5"],
        ["Date", "https://tools.ietf.org/html/rfc5322#section-3.6.1"],
        ["Deferred-Delivery", "https://tools.ietf.org/html/rfc4021#section-2.1.65"],
        ["DKIM-Signature", "https://tools.ietf.org/html/rfc6376"],
        ["From", "https://tools.ietf.org/html/rfc5322#section-3.6.2"],
        ["In-Reply-To", "https://tools.ietf.org/html/rfc5322#section-3.6.4"],
        ["Importance", "https://tools.ietf.org/html/rfc2156#section-5.3"],
        ["List-Help", "https://tools.ietf.org/html/rfc2369"],
        ["List-ID", "https://tools.ietf.org/html/rfc2919"],
        ["List-Subscribe", "https://tools.ietf.org/html/rfc2369"],
        ["List-Unsubscribe", "https://tools.ietf.org/html/rfc2369"],
        ["Message-ID", "https://tools.ietf.org/html/rfc5322#section-3.6.4"],
        ["MIME-Version", "https://tools.ietf.org/html/rfc2045#section-4"],
        ["Received", "https://tools.ietf.org/html/rfc5321#section-4.4"],
        ["Received-SPF", "https://tools.ietf.org/html/rfc4408#section-7"],
        ["References", "https://tools.ietf.org/html/rfc5322#section-3.6.4"],
        ["Reply-To", "https://tools.ietf.org/html/rfc5322#section-3.6.2"],
        ["Return-Path", "https://tools.ietf.org/html/rfc5322#section-3.6.7"],
        ["Sender", "https://tools.ietf.org/html/rfc5322#section-3.6.2"],
        ["Subject", "https://tools.ietf.org/html/rfc5322#section-3.6.5"],
        ["Thread-Index", "https://msdn.microsoft.com/en-us/library/ms526219"],
        ["Thread-Topic", "https://msdn.microsoft.com/en-us/library/ms526986"],
        ["To", "https://tools.ietf.org/html/rfc5322#section-3.6.3"],
        ["X-Auto-Response-Suppress", "https://msdn.microsoft.com/en-us/library/ee219609"],
        ["X-Forefront-Antispam-Report", "https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers"],
        ["X-Forefront-Antispam-Report-Untrusted", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-Forefront-Prvs", "https://technet.microsoft.com/en-us/library/dd639361"],
        ["X-Message-Flag", "https://msdn.microsoft.com/en-us/library/exchange/ms875195"],
        ["X-Microsoft-Antispam", "https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-message-headers"],
        ["X-MS-Exchange-Organization-Antispam-Report", "https://technet.microsoft.com/en-us/library/aa996878"],
        ["X-MS-Exchange-Organization-AuthAs", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-AuthMechanism", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-AuthSource", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-AutoForwarded", "https://msdn.microsoft.com/en-us/library/ee178180"],
        ["X-MS-Exchange-Organization-AVStamp-Enterprise", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-AVStamp-Mailbox", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-Network-Message-Id", "https://technet.microsoft.com/en-us/library/bb232136"],
        ["X-MS-Exchange-Organization-PCL", "https://technet.microsoft.com/en-us/library/aa996878"],
        ["X-MS-Exchange-Organization-SCL", "https://technet.microsoft.com/en-us/library/aa996878"],
        ["X-MS-Exchange-Organization-SenderIdResult", "https://technet.microsoft.com/en-us/library/aa996878"],
        ["X-MS-Has-Attach", "https://msdn.microsoft.com/en-us/library/ee178420"],
        ["X-MS-TNEF-Correlator", "https://msdn.microsoft.com/en-us/library/ee219198"],
        ["X-Originating-IP", "https://en.wikipedia.org/wiki/X-Originating-IP"],
        ["X-Priority", "https://technet.microsoft.com/en-us/library/bb691107"],
        ["SFS", "https://docs.microsoft.com/en-us/exchange/monitoring/trace-an-email-message/run-a-message-trace-and-view-results"]
    ];

    return {
        mapHeaderToURL: mapHeaderToURL,
        mapValueToURL: mapValueToURL,
        // REST
        mha_loading: "Loading...",
        mha_RequestSent: "Retrieving headers from server.",
        mha_foundHeaders: "Found headers",
        mha_processingHeader: "Processing header",
        mha_headersMissing: "Message was missing transport headers. If this is a sent item this may be expected.",
        mha_messageMissing: "Message not located.",
        mha_requestFailed: "Failed to retrieve headers.",

        // Headers
        mha_negative: "-",
        mha_minute: "minute",
        mha_minutes: "minutes",
        mha_second: "second",
        mha_seconds: "seconds",
        mha_summary: "Summary",
        mha_prompt: "Insert the message header you would like to analyze",
        mha_receivedHeaders: "Received headers",
        mha_forefrontAntiSpamReport: "Forefront Antispam Report Header",
        mha_antiSpamReport: "Microsoft Antispam Header",
        mha_otherHeaders: "Other headers",
        mha_originalHeaders: "Original headers",
        mha_deliveredStart: "(Delivered after",
        mha_deliveredEnd: ")",
        mha_parsingHeaders: "Parsing headers to tables",
        mha_processingReceivedHeader: "Processing received header ",

        // Summary
        mha_subject: "Subject",
        mha_messageId: "Message Id",
        mha_creationTime: "Creation time",
        mha_from: "From",
        mha_replyTo: "Reply to",
        mha_to: "To",
        mha_cc: "Cc",
        mha_archivedAt: "Archived at",

        // Received
        mha_hop: "Hop",
        mha_submittingHost: "Submitting host",
        mha_receivingHost: "Receiving host",
        mha_time: "Time",
        mha_delay: "Delay",
        mha_type: "Type",
        mha_id: "ID",
        mha_for: "For",
        mha_via: "Via",

        // Other
        mha_number: "#",
        mha_header: "Header",
        mha_value: "Value",

        // ForefrontAntiSpamReport
        mha_source: "Source header",
        mha_unparsed: "Unknown fields",
        mha_arc: "ARC protocol",
        mha_countryRegion: "Country/Region",
        mha_lang: "Language",
        mha_scl: "Spam Confidence Level",
        mha_sfv: "Spam Filtering Verdict",
        mha_pcl: "Phishing Confidence Level",
        mha_ipv: "IP Filter Verdict",
        mha_h: "HELO/EHLO String",
        mha_ptr: "PTR Record",
        mha_cip: "Connecting IP Address",
        mha_cat: "Protection Policy Category",
        mha_sfty: "Phishing message",
        mha_srv: "Bulk email status",
        mha_customSpam: "Advanced Spam Filtering",
        mha_sfs: "Spam rules",

        // AntiSpamReport
        mha_bcl: "Bulk Complaint Level"
    }
})();