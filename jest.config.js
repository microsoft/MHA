/** @type {import('ts-jest').JestConfigWithTsJest} **/
// https://github.com/jest-community/awesome-jest
module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+.tsx?$": ["ts-jest",{ diagnostics: { ignoreCodes: ["TS151001"] } }],
    },
    collectCoverage: false, // TODO: turn off after most tests migrated
    collectCoverageFrom: ["./src/**"],
    coverageDirectory: "./Pages/coverage",
    coverageReporters: ["json", "lcov", "text", "clover"],
    coverageThreshold: {
        global: {
            lines: 90
        }
    },
    reporters: [
        "default",
        ["jest-html-reporters", {
            "publicPath": "./Pages/test",
            "filename": "index.html"
        }]
    ],
};