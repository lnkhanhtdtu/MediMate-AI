import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Project-level rule tuning. These are kept as warnings (not build-breaking
    // errors) on purpose:
    //  - no-explicit-any: we intentionally use `any` at the boundaries with the
    //    Gemini SDK, Supabase auth user, and JSON-RPC payloads where precise types
    //    add noise without safety.
    //  - the React Compiler-era rules (set-state-in-effect, immutability) flag
    //    patterns we use deliberately (syncing state from the URL / localStorage on
    //    mount, mutating local Date cursors) — surfaced as warnings, not errors.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
