import type {Config} from "jest";
// https://github.com/jest-community/awesome-jest
const config: Config = {
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
            branches: 25,
            functions: 20,
            lines: 25,
            statements: 25,
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