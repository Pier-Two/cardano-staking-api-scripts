/* eslint-disable @typescript-eslint/no-require-imports */
const tseslint = require("typescript-eslint");
const prettierPlugin = require("eslint-plugin-prettier");
const eslintJs = require("@eslint/js");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  // Ignore the eslint config file itself
  {
    ignores: ["eslint.config.js"],
  },
  // Config for TypeScript files
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "no-console": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  // Apply only Prettier rules to eslint config
  {
    files: ["eslint.config.js"],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    }
  }
];
