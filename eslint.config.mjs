import typescriptEslint from "@typescript-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import node from "eslint-plugin-node";
import _import from "eslint-plugin-import";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    files: ["**/*.ts","**/*.js"],
    ignores: ["Pages"],
}, ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "@stylistic": stylistic,
        node,
        import: fixupPluginRules(_import),
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
        }, {
            selector: "typeLike",
            format: ["PascalCase"],
        }, {
            selector: "enumMember",
            format: ["PascalCase"],
        }, {
            selector: "property",
            format: ["camelCase"],
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