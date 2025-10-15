#!/usr/bin/env node

const http = require("http");
const url = require("url");

// Mock data for development
const mockRules = {
    IsError: false,
    Message: "Rules retrieved successfully",
    SimpleRules: [
        {
            RuleType: "SimpleRule",
            SectionToCheck: "Date",
            PatternToCheckFor: ".*",
            MessageWhenPatternFails: "Date header detected (this will always trigger for demonstration)",
            SectionsInHeaderToShowError: ["Date"],
            CssPrefix: "info"
        },
        {
            RuleType: "SimpleRule",
            SectionToCheck: "Message-ID",
            PatternToCheckFor: ".*@.*",
            MessageWhenPatternFails: "Message-ID contains @ symbol (normal pattern)",
            SectionsInHeaderToShowError: ["Message-ID"],
            CssPrefix: "info"
        },
        {
            RuleType: "SimpleRule",
            SectionToCheck: "Content-Type",
            PatternToCheckFor: "text/html",
            MessageWhenPatternFails: "HTML content detected",
            SectionsInHeaderToShowError: ["Content-Type"],
            CssPrefix: "warning"
        },
        {
            RuleType: "SimpleRule",
            SectionToCheck: "From",
            PatternToCheckFor: "@.*\\.(com|org|net)",
            MessageWhenPatternFails: "From address uses common TLD (.com/.org/.net)",
            SectionsInHeaderToShowError: ["From"],
            CssPrefix: "info"
        },
        // ALWAYS TRIGGER RULE - This should always match
        {
            RuleType: "SimpleRule",
            SectionToCheck: "Received",
            PatternToCheckFor: ".",
            MessageWhenPatternFails: "🔥 ALWAYS TRIGGER: This rule always fires (testing rule validation)",
            SectionsInHeaderToShowError: ["Received"],
            CssPrefix: "error"
        },
        {
            RuleType: "HeaderMissingRule",
            SectionToCheck: "X-Nonexistent-Header",
            MessageWhenPatternFails: "Missing custom header (this will always trigger)",
            SectionsInHeaderToShowError: ["X-Nonexistent-Header"],
            CssPrefix: "warning"
        },
        {
            RuleType: "SimpleRule",
            SectionToCheck: "Subject",
            PatternToCheckFor: ".+",
            MessageWhenPatternFails: "Subject contains content (normal)",
            SectionsInHeaderToShowError: ["Subject"],
            CssPrefix: "info"
        }
    ],
    AndRules: [
        {
            Message: "Standard email pattern detected (demonstration rule)",
            SectionsInHeaderToShowError: ["From", "Date"],
            CssPrefix: "info",
            RulesToAnd: [
                {
                    SectionToCheck: "From",
                    PatternToCheckFor: "@.*",
                    MessageWhenPatternFails: "From field contains @ symbol",
                    SectionsInHeaderToShowError: ["From"],
                    CssPrefix: "info"
                },
                {
                    SectionToCheck: "Date",
                    PatternToCheckFor: ".*",
                    MessageWhenPatternFails: "Date field is present",
                    SectionsInHeaderToShowError: ["Date"],
                    CssPrefix: "info"
                }
            ]
        },
        {
            Message: "HTML email with Message-ID (common pattern)",
            SectionsInHeaderToShowError: ["Content-Type", "Message-ID"],
            CssPrefix: "warning",
            RulesToAnd: [
                {
                    SectionToCheck: "Content-Type",
                    PatternToCheckFor: "text/html",
                    MessageWhenPatternFails: "HTML content detected",
                    SectionsInHeaderToShowError: ["Content-Type"],
                    CssPrefix: "warning"
                },
                {
                    SectionToCheck: "Message-ID",
                    PatternToCheckFor: "<.*@.*>",
                    MessageWhenPatternFails: "Standard Message-ID format",
                    SectionsInHeaderToShowError: ["Message-ID"],
                    CssPrefix: "info"
                }
            ]
        }
    ]
};

const mockAttachments = {
    IsError: false,
    Message: "Success",
    attachments: []
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`📡 ${req.method} ${req.url}`);
    console.log("📡 Headers:", req.headers);

    if (parsedUrl.pathname === "/api/RulesService") {
        console.log("🎯 Rules service requested!");

        if (req.method === "POST") {
            // Handle POST rules request
            let body = "";
            req.on("data", chunk => {
                body += chunk.toString();
            });

            req.on("end", () => {
                console.log("📨 Rules POST request body:", body);
                console.log("✅ Returning mock rules (POST)");
                res.setHeader("Content-Type", "application/json");
                res.writeHead(200);
                res.end(JSON.stringify(mockRules));
            });

        } else if (req.method === "GET") {
            // Handle GET rules request (fallback)
            console.log("✅ Returning mock rules (GET)");
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(mockRules));
        } else {
            console.log("❌ Unsupported method for RulesService:", req.method);
            res.writeHead(405, {"Content-Type": "text/plain"});
            res.end("Method Not Allowed");
        }

    } else if (parsedUrl.pathname === "/api/AttachmentService" && req.method === "POST") {
        // Handle attachment request
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            console.log("Attachment request body:", body);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(mockAttachments));
        });

    } else if (parsedUrl.pathname === "/api/TokenIn") {
        // Handle token redirect
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end("<html><head><title>Token Received</title></head><body><h1>Token received successfully</h1><script>window.close();</script></body></html>");

    } else {
        // 404 for other paths
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.end("Not Found");
    }
});

const PORT = process.env.PORT || 44337;
server.listen(PORT, () => {
    console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
    console.log("📡 Available endpoints:");
    console.log("   POST /api/RulesService - Returns mock validation rules");
    console.log("   POST /api/AttachmentService - Returns mock attachment data");
    console.log("   GET  /api/TokenIn - Token redirect endpoint");
});