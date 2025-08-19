import path from "node:path";
import { fileURLToPath } from "node:url";

import { fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import node from "eslint-plugin-node";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["Pages/**"],
}, {
    files: ["**/*.ts","**/*.js"],
}, ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "@stylistic": stylistic,
        node,
        import: fixupPluginRules(importPlugin),
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
    },

    settings: {
        "import/resolver": {
            typescript: {
                project: "./tsconfig.json",
            },
        },
    },

    rules: {
        indent: ["error", 4, {
            SwitchCase: 1,
        }],

        "linebreak-style": ["error", "windows"],
        quotes: ["error", "double"],
        semi: ["error", "always"],
        "max-classes-per-file": ["error", 1],
        "no-duplicate-imports": "error",
        "no-inner-declarations": "error",
        "no-unmodified-loop-condition": "error",
        "block-scoped-var": "error",

        camelcase: ["error", {
            properties: "always",
        }],

        "sort-imports": ["error", {
            ignoreDeclarationSort: true,
        }],

        "@stylistic/no-multiple-empty-lines": ["error", {
            max: 1,
            maxEOF: 0,
            maxBOF: 0,
        }],

        "@stylistic/no-trailing-spaces": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-inferrable-types": "error",

        "@typescript-eslint/naming-convention": ["error", {
            selector: "default",
            format: ["camelCase"],
        }, {
            selector: "variableLike",
            format: ["camelCase"],
            filter: {
                regex: "^(__filename|__dirname)$",
                match: false
            }
        }, {
            selector: "variable",
            filter: {
                regex: "^(__filename|__dirname)$",
                match: true
            },
            format: null
        }, {
            selector: "import",
            format: ["camelCase", "PascalCase"]
        }, {
            selector: "typeLike",
            format: ["PascalCase"],
        }, {
            selector: "enumMember",
            format: ["PascalCase"],
        }, {
            selector: "property",
            format: ["camelCase"],
            filter: {
                regex: "^(@|import/|linebreak-style|max-classes-per-file|no-duplicate-imports|no-inner-declarations|no-unmodified-loop-condition|block-scoped-var|sort-imports|newlines-between|SwitchCase|__[A-Z_]+__|\\^.+\\$)",
                match: false
            }
        }, {
            selector: "property",
            filter: {
                regex: "^(@|import/|linebreak-style|max-classes-per-file|no-duplicate-imports|no-inner-declarations|no-unmodified-loop-condition|block-scoped-var|sort-imports|newlines-between|SwitchCase|__[A-Z_]+__|\\^.+\\$)",
                match: true
            },
            format: null
        }, {
            selector: "method",
            format: ["camelCase"],
        }],

        "import/no-unresolved": "error",
        "import/no-named-as-default-member": "off",

        "import/order": ["error", {
            groups: [
                "builtin",
                "external",
                "internal",
                ["sibling", "parent"],
                "index",
                "unknown",
            ],

            "newlines-between": "always",

            alphabetize: {
                order: "asc",
                caseInsensitive: true,
            },
        }],
    },
}];