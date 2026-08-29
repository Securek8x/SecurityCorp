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
    // Impeccable provider payloads are audited as third-party artifacts, not
    // application source; keep their upstream lint warnings out of CI.
    ".agents/skills/impeccable/**",
    ".claude/skills/impeccable/**",
  ]),
]);

export default eslintConfig;
