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
        "@stylistic/js/no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0, "maxBOF": 0 }],
        "@stylistic/js/no-trailing-spaces": "error",
        "@typescript-eslint/no-explicit-any": "off", // TODO: consider removing this
        "@typescript-eslint/no-inferrable-types": "error", // TODO: consider removing this
    }
};
