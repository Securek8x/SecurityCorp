import { validateDraftIsolation, validateDraftsAbsentFromStaticOutput } from "../lib/draft-isolation.ts";

const errors = [...validateDraftIsolation(), ...validateDraftsAbsentFromStaticOutput()];
if (errors.length > 0) {
  console.error(`[draft-isolation] BLOCKED:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log("[draft-isolation] OK: no content/drafts article has a registry entry or static production route.");
