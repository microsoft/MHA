import type {Config} from "jest";
// https://github.com/jest-community/awesome-jest
const config: Config = {
    testEnvironment: "jsdom",
    globalSetup: "./global-setup.js",
    transform: {
        "^.+.tsx?$": ["ts-jest",{ diagnostics: { ignoreCodes: ["TS151001"] } }],
    },
    globals: {
        // Stand-ins for webpack DefinePlugin constants so code runs under Jest.
        "__AIKEY__": "",
        "mhaBuildInfo": {
            buildNumber: "local",
            commit: "0".repeat(40),
            builtAt: "1970-01-01T00:00:00.000Z"
        }
    },
    collectCoverage: true,
    collectCoverageFrom: ["./src/**"],
    coverageDirectory: "./Pages/coverage",
    coverageReporters: ["json", "lcov", "text", "clover", "text-summary"],
    coverageThreshold: {
        global: {
            branches: 35,
            functions: 40,
            lines: 40,
            statements: 40,
        },
    },
    reporters: [
        "default",
        ["jest-html-reporters", {
            "publicPath": "./Pages/test",
            "filename": "index.html"
        }]
    ]
};

export default config;