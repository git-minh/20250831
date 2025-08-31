const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  // Ignore patterns
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "convex/_generated/**",
      "*.config.js",
    ],
  },
  // Extend Next.js config and Prettier
  ...compat.extends("next/core-web-vitals", "prettier"),
  // Main configuration
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // General rules
      "no-console": "warn",
      "no-debugger": "error",
      "no-alert": "warn",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-unused-vars": "off", // Handled by TypeScript
    },
  },
  // Test files overrides
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}", "tests/**/*"],
    rules: {
      "no-console": "off",
    },
  },
  // Convex files overrides
  {
    files: ["convex/**/*"],
    rules: {
      "no-console": "off",
    },
  },
  // Config files overrides
  {
    files: ["*.config.{js,ts}", "**/*.config.{js,ts}"],
    rules: {
      "no-console": "off",
    },
  },
];
