/* eslint-disable @typescript-eslint/naming-convention */
module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "@stylistic/js",
        "node"
    ],
    "rules": {
        "indent": ["error", 4, { "SwitchCase": 1, },],
        "linebreak-style": ["error", "windows"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "max-classes-per-file": ["error", 1],
        "no-duplicate-imports": "error",
        "no-inner-declarations": "error",
        "no-unmodified-loop-condition": "error",
        "block-scoped-var": "error",
        "camelcase": ["error", { "properties": "always" }],
        "@stylistic/js/no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0, "maxBOF": 0 }],
        "@stylistic/js/no-trailing-spaces": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/naming-convention": [
            "error",
            { "selector": "default", "format": ["camelCase"] },
            { "selector": "variableLike", "format": ["camelCase"] },
            { "selector": "typeLike", "format": ["PascalCase"] },
            { "selector": "enumMember", "format": ["PascalCase"] },
            { "selector": "property", "format": ["camelCase"] },
            { "selector": "method", "format": ["camelCase"] }
        ]
    }
};
