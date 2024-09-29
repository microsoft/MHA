/** @type {import('ts-jest').JestConfigWithTsJest} **/
// https://github.com/jest-community/awesome-jest
module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+.tsx?$": ["ts-jest",{ diagnostics: { ignoreCodes: ["TS151001"] } }],
    },
    globals: {
        "__AIKEY__": ""
    },
    collectCoverage: true,
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