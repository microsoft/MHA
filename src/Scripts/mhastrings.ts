export const mhaStrings = (function () {
    return {
        // REST
        mhaLoading: "Loading...",
        mhaRequestSent: "Retrieving headers from server.",
        mhaFoundHeaders: "Found headers",
        mhaProcessingHeader: "Processing header",
        mhaHeadersMissing: "Message was missing transport headers. If this is a sent item this may be expected.",
        mhaMessageMissing: "Message not located.",
        mhaRequestFailed: "Failed to retrieve headers.",

        // Headers
        mhaNegative: "-",
        mhaMinute: "minute",
        mhaMinutes: "minutes",
        mhaSecond: "second",
        mhaSeconds: "seconds",
        mhaSummary: "Summary",
        mhaPrompt: "Insert the message header you would like to analyze",
        mhaReceivedHeaders: "Received headers",
        mhaForefrontAntiSpamReport: "Forefront Antispam Report Header",
        mhaAntiSpamReport: "Microsoft Antispam Header",
        mhaOtherHeaders: "Other headers",
        mhaOriginalHeaders: "Original headers",
        mhaDeliveredStart: "(Delivered after",
        mhaDeliveredEnd: ")",
        mhaParsingHeaders: "Parsing headers to tables",
        mhaProcessingReceivedHeader: "Processing received header ",

        // Summary
        mhaSubject: "Subject",
        mhaMessageId: "Message Id",
        mhaCreationTime: "Creation time",
        mhaFrom: "From",
        mhaReplyTo: "Reply to",
        mhaTo: "To",
        mhaCc: "Cc",
        mhaArchivedAt: "Archived at",

        // Received
        mhaReceivedHop: "Hop",
        mhaReceivedSubmittingHost: "Submitting host",
        mhaReceivedReceivingHost: "Receiving host",
        mhaReceivedTime: "Time",
        mhaReceivedDelay: "Delay",
        mhaReceivedType: "Type",
        mhaReceivedFrom: "From",
        mhaReceivedBy: "By",
        mhaReceivedWith: "With",
        mhaReceivedId: "Id",
        mhaReceivedFor: "For",
        mhaReceivedVia: "Via",
        mhaReceivedDate: "Date",
        mhaReceivedPercent: "Percent",

        // Other
        mhaNumber: "#",
        mhaHeader: "Header",
        mhaValue: "Value",

        // ForefrontAntiSpamReport
        mhaSource: "Source header",
        mhaUnparsed: "Unknown fields",
        mhaArc: "ARC protocol",
        mhaCountryRegion: "Country/Region",
        mhaLang: "Language",
        mhaScl: "Spam Confidence Level",
        mhaSfv: "Spam Filtering Verdict",
        mhaPcl: "Phishing Confidence Level",
        mhaIpv: "IP Filter Verdict",
        mhaHelo: "HELO/EHLO String",
        mhaPtr: "PTR Record",
        mhaCip: "Connecting IP Address",
        mhaCat: "Protection Policy Category",
        mhaSfty: "Phishing message",
        mhaSrv: "Bulk email status",
        mhaCustomSpam: "Advanced Spam Filtering",
        mhaSfs: "Spam rules",

        // AntiSpamReport
        mhaBcl: "Bulk Complaint Level"
    };
})();