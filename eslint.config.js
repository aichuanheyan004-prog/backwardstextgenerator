import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist", "node_modules", "coverage"]
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        ClipboardItem: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Blob: "readonly",
        CanvasRenderingContext2D: "readonly",
        HTMLDivElement: "readonly",
        HTMLTextAreaElement: "readonly",
        Intl: "readonly",
        URL: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules
    }
  },
  {
    files: ["**/*.mjs", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        fetch: "readonly",
        setTimeout: "readonly"
      }
    }
  }
];
