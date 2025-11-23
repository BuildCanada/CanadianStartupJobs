const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

const compat = new FlatCompat();

module.exports = [
  js.configs.recommended,
  ...compat.extends( "prettier"),
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "prefer-const": "error",
      "no-var": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },
  {
    files: ["**/charts/**/*.{js,ts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
    ignores: ["**/charts/utils/**/*.{js,ts}"],
  },
];
