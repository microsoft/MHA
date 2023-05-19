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
        "node"
    ],
    "rules": {
        "indent": [
            "error",
            4,
            {
                "SwitchCase": 1,
            },
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/no-explicit-any": "off", // TODO: consider removing this
        "@typescript-eslint/ban-ts-comment": "off", // TODO: consider removing this  
        "@typescript-eslint/no-inferrable-types": "off", // TODO: consider removing this
    }
};
