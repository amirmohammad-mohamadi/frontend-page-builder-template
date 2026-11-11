import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";
import { defineConfig } from "eslint/config";

/**
 * Module-boundary rules by lib type. Each pattern names what a layer must not
 * import; the direction of allowed dependencies is documented in AGENTS.md.
 */
const boundary = (files: string[], forbidden: { group: string[]; message: string }[]) => ({
  files,
  rules: {
    "no-restricted-imports": ["error", { patterns: forbidden }],
  },
});

const UI_LAYER = {
  group: ["@components", "@components/*"],
  message: "Services and lower layers must not import UI.",
};
const SERVICE_LAYER = {
  group: ["@services", "@services/*"],
  message: "Only apps may import @services.",
};
const DEEP_IMPORT = {
  group: [
    "@services/lib/*",
    "@models/lib/*",
    "@dtos/lib/*",
    "@utils/lib/*",
    "@enums/lib/*",
    "@assets/lib/*",
  ],
  message: "Import from the lib root alias, not a deep path.",
};

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.nx/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { js },
    rules: { ...js.configs.recommended.rules },
  },
  {
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: { parser: tsParser },
    plugins: { "@typescript-eslint": tsPlugin as any },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { react: reactPlugin },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
    },
    settings: { react: { version: "detect" } },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "react-hooks": reactHooks as any },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["apps/**/*.{js,jsx,ts,tsx}"],
    plugins: { "@next/next": nextPlugin as any },
    rules: { ...(nextPlugin as any).configs.recommended.rules },
    settings: { next: { rootDir: ["apps/web", "apps/admin"] } },
  },
  // Layer boundaries (see AGENTS.md). Apps may import every lib.
  boundary(["libs/**/*.{ts,tsx}"], [DEEP_IMPORT]),
  boundary(["libs/services/**/*.{ts,tsx}"], [UI_LAYER]),
  boundary(["libs/components/**/*.{ts,tsx}"], [SERVICE_LAYER]),
  boundary(
    ["libs/models/**/*.{ts,tsx}", "libs/dtos/**/*.{ts,tsx}"],
    [
      UI_LAYER,
      SERVICE_LAYER,
      { group: ["@utils", "@utils/*"], message: "Models and DTOs stay pure." },
    ]
  ),
  boundary(
    ["libs/utils/**/*.{ts,tsx}", "libs/enums/**/*.{ts,tsx}"],
    [
      UI_LAYER,
      SERVICE_LAYER,
      {
        group: ["@models", "@models/*", "@dtos", "@dtos/*", "@assets", "@assets/*"],
        message: "utils and enums are leaf libraries.",
      },
    ]
  ),
  // Tooling scripts and mock API run in Node and may log.
  {
    files: [
      "tools/**/*.{js,mjs,ts}",
      "**/next.config.js",
      "**/postcss.config.js",
      "**/jest.config.cjs",
    ],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off" },
  },
  // Third-party plugin objects are untyped for flat config; this file alone may cast them.
  {
    files: ["eslint.config.mts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
]);
