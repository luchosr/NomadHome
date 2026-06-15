import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * Shared flat ESLint config for the NomadHome workspace.
 * Consumers re-export this and may append package-specific overrides.
 * Lint is run with `--max-warnings 0`, so any warning fails the gate.
 */
export default tseslint.config(
  {
    ignores: ["dist/**", "build/**", "node_modules/**", ".turbo/**", "coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // TypeScript resolves identifiers; core no-undef is redundant and would
      // flag DOM/Node globals that vary per package.
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
);
