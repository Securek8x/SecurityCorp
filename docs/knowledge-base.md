# Knowledge-base content model

This is the foundation for SecurityCorp's cybersecurity knowledge base
(Bead `securitycorp-source-4zl`): taxonomy, metadata schema, universal
article shell, and the pillar/category/catalog pages that read from them.
It ships with **zero real articles** — that's deliberate. This document is
how a future article actually gets added.

Every rule here is governed by the
[publication-safety policy](publication-safety-policy.md). The local
[content workflow](content-workflow/README.md) defines the required research,
verification, review, and human-approval stages before an article reaches
this registry.

## Files

| File | Purpose |
| --- | --- |
| `lib/taxonomy.ts` | The 6 pillars and 21 categories. Source of truth: Beads `securitycorp-source-4zl.54`–`.59` and their `.N` children. |
| `lib/knowledge-schema.ts` | The `KnowledgeArticleMeta` type and all validation (`validateArticleMeta`, `validateCatalogIntegrity`, `isPubliclyVisible`). |
| `lib/knowledge-content-types.ts` | The article body shape: universal optional sections + one content-type-specific module. |
| `content/drafts/` | Private editorial workspace. Drafts and review records live here, never in the production registry. |
| `lib/knowledge-content.ts` | The published catalog (`knowledgeArticles`). Add an article object only after human approval. |
| `lib/knowledge-catalog.ts` | Server-side card projection + filtering helpers used by pillar/category/catalog pages. |
| `lib/knowledge-tags.ts` | The controlled tag vocabulary — canonical ids, display labels, groups, and known aliases. Source of truth for `meta.tags`; see "Tags" below. |
| `components/knowledge-article-shell.tsx` | The one reusable article template. Renders whichever sections/module fields are present; empty ones don't render. |
| `components/knowledge-catalog-filter.tsx` | Client-side filter UI (pillar, category, content type, difficulty, audience, evidence state, tag, search). |

## Adding one article

1. **Pick exactly one pillar and one primary category** from `lib/taxonomy.ts`. The primary category must belong to the chosen pillar — `validateArticleMeta` rejects a mismatch. A secondary category is optional and must differ from the primary one.
2. **Develop the article in `content/drafts/<slug>/`** using the content-workflow templates. Drafts must not be added to `knowledgeArticles`, even with a non-public status.
3. **Write the metadata and body** (`KnowledgeArticleMeta` and `UniversalSections`) only after the human approval gate. All 14 body sections are optional — only fill in the ones that apply.
4. **Add a content-type module if useful** — one of `GuideModule`, `LabModule`, `DetectionModule`, `PlaybookModule`, `FieldNoteModule`, `DeepDiveModule`, `ChecklistModule`, `CaseStudyModule`, `ToolReviewModule`, matching `meta.contentType`.
5. **Set `status: "published"` only once all of the following are true** (enforced by `validateArticleMeta`, not just convention):
   - `tags` has 2–4 entries, each a canonical id from `lib/knowledge-tags.ts` (see "Tags" below)
   - `publishedAt` and `lastReviewedAt` are set
   - `privacyReview.status === "approved"` and `technicalReview.status === "approved"`
   - `publicationApproval.status === "approved"`, with a named human reviewer and valid review date
   - the exact evidence label remains accurate (`VALIDATED`, `DESIGN ONLY`, or `UNVERIFIED`)
6. **Add the object to `knowledgeArticles`** in `lib/knowledge-content.ts` (next to the `STATIC_EXPORT_PLACEHOLDER` — leave that one alone; see the comment above it).
7. **Run `npm run check`** (lint, typecheck, tests, static export, and draft isolation). `validateArticleMeta`/`validateCatalogIntegrity` catch most mistakes before the build does.

The article then appears automatically at `/knowledge/<slug>/`, on its pillar and category pages, in `/knowledge` catalog filtering, in the sitemap, and in the RSS feed — nothing else needs to be touched by hand.

## Tags

`meta.tags` is not free text. `lib/knowledge-tags.ts` is the controlled
vocabulary — every entry in `meta.tags` must be a canonical id from
`TAG_VOCABULARY` there. `validateArticleMeta` rejects anything else,
including a casing variant of a real id (`"Docker"`), a known alias
(`"k8s"`), or a duplicate — the error message for an alias or casing
variant names the canonical id to use instead, so the fix is unambiguous.
Dynamically accepting whatever tag string an article happened to use is
not controlled tagging; grouping is for authoring/documentation
convenience only and never relaxes validation.

The vocabulary count is always `TAG_VOCABULARY.length`; do not copy a
number into documentation, reports, or UI. `lib/knowledge-tags.test.ts`
derives the same count from the collection while checking ID and label
uniqueness, valid groups, and alias collisions.

Canonical IDs are stable lowercase kebab-case identifiers. The current
groups are `technology`, `practice`, `control-type`, and `environment`.
An alias is an authoring aid only: it may represent a genuine abbreviation,
punctuation/casing variant, or equivalent term, but it is still rejected in
article metadata with the canonical ID to use. Product names, implementations
of a broader concept, and narrower or broader subjects are not aliases.

Important boundaries:

- `network-segmentation` divides systems into controlled zones; `network-isolation`
  prevents or severely restricts communication. They are separate controls.
- `application-security` covers application design and implementation risk;
  `secure-code-review` is the review practice applied to that work.
- `soc-operations` covers alert triage and escalation operations; `alert-tuning`
  is the narrower practice of improving alert signal quality.
- `ai-security` covers the security of AI-assisted systems and agents; it is
  distinct from the `ai-tooling` technology tag.

To request a new tag, first show that no canonical ID or permitted alias
already covers the concept, state the semantic boundary and closest group,
and obtain taxonomy/publication-safety review in the relevant Bead. Then add
one stable canonical ID, narrowly justified aliases if any, and integrity
tests. Do not add a tag merely to make an article reach a numeric target.

`lib/knowledge-tags.ts`'s own file header documents the full process for
adding a new approved tag (check for a near-miss first, add one
`TAG_VOCABULARY` entry with a stable id/label/group, add aliases if a
common variant exists, add a test case, and don't duplicate the list
anywhere else). `lib/knowledge-tags.test.ts` covers alias resolution,
casing-variant rejection, duplicate rejection, and unknown-tag rejection.

### Backlog coverage audit

Run `npm run audit:knowledge-tags` from a workspace with the local Beads
database available. The command is deliberately local-only: `.beads/` is
Git-excluded and is not a reliable CI input. It reads the article Beads,
collapses legacy duplicate records by title in favor of the structured
record, derives canonical tags from the category and title, and fails if an
identity cannot receive two to four canonical IDs.

The 2026-08-29 audit covered 99 unique article identities: 75 with structured
suggestions and 24 older-format identities mapped from title, category,
pillar, and intended outcome. The database also contains 20 legacy duplicate
article records (119 `article`-labeled records total); they are reported for
human cleanup and are not counted as separate article identities. The audit
does not approve publication or replace required human privacy, technical,
and publication review.

Run `npm run check:public-terms` separately after vocabulary changes. It scans
tracked and publishable candidate files while excluding Git-excluded local
Beads state, so local interaction history cannot mask or falsely fail the
public-source check.

## Evidence labels — what each one actually means

Defined in `lib/knowledge-schema.ts` (`EVIDENCE_STATES`), Bead
`securitycorp-source-4zl.76`:

- **`VALIDATED`** — reproduced and supported by the recorded evidence.
- **`DESIGN ONLY`** — a proposed architecture or procedure that was not
  reproduced.
- **`UNVERIFIED`** — incomplete evidence. It blocks publication unless the
  human owner explicitly approves publication with the limitation retained.

None of these may be inferred merely because a command exited zero, a
service started, a container reported healthy, a log line said "success,"
or a page returned HTTP 200. Never silently upgrade a label. See the
publication-safety policy's note on separating observation from verification.

## Editorial statuses (internal only)

`idea → planned → drafting → technical-review → privacy-review → ready →
published`, plus `needs-update` and `retired` as terminal/re-entry states.
Only `published` is public-facing. `ready` means review passed but the
piece hasn't been released — it is still invisible on every public
surface. This mirrors the Bead lifecycle
(`internal-source → sanitized-draft → approved-public`) at the article
level.

## Why hand-written validation instead of a schema library

The repository has no existing runtime-validation dependency (no zod, no
yup, no ajv). The rule set here — enums, a couple of cross-field checks,
one uniqueness check — doesn't need one; `lib/knowledge-schema.ts` is
~100 lines of plain functions with no new dependency and no bundle-size
cost. If the rules grow substantially more complex later, revisit this
decision explicitly rather than defaulting to a library.

## Why `lib/*.ts` files use relative imports between each other

`lib/knowledge-schema.ts`, `lib/knowledge-content.ts`, and
`lib/knowledge-catalog.ts` import each other with relative,
extension-explicit paths (`./taxonomy.ts`) instead of the `@/lib/...`
alias used everywhere else in the app. That alias is resolved by Next's
bundler via `tsconfig.json`'s `paths`, which plain `node --test` doesn't
understand — the taxonomy/schema tests (`lib/*.test.ts`) run directly
under Node, not through Next, so their import chain has to resolve
without a bundler. Component and page files still use `@/lib/...` as
normal.

## Information architecture and URL decisions

- `/topics` is the six-pillar landing page; `/topics/[pillar]` and
  `/topics/[pillar]/[category]` are pillar and category pages, matching
  the brief's example URLs (`/topics/build-securely/application-code-security`,
  etc.). "Authorized Offensive Security" uses the slug `offensive-security`
  to match the brief's own example URL rather than a literal slugification
  of its full Bead title.
- `/knowledge/[slug]` is the universal article route. `/knowledge` (a
  catalog listing with the same filters as pillar/category pages) exists
  but is **not** in the top navigation — the brief asks for a compact main
  nav and explicitly warns against putting all categories there; `/knowledge`
  is reachable from `/topics` and from any pillar/category page instead.
- The top navigation gained one link — "Topics" — added before the
  existing "Guides" link. "Learning Paths" was intentionally left out of
  the top nav for the same compactness reason; `/learning-paths` exists
  as its own route (per the required IA) with a placeholder page, since
  no learning path can be published until enough articles exist to
  sequence into one.
- The existing `/guides` route and its three articles are **unchanged**
  and **not** migrated into the knowledge base in this phase — see
  "Existing-content safety audit" below. They continue to work exactly as
  before; nothing about them was silently altered.

## `/knowledge/__static-export-placeholder`

This static-export build (`output: "export"`) requires every dynamic
route to generate at least one path. With zero real articles, that's a
hard build failure for `/knowledge/[slug]` unless something exists. The
placeholder in `lib/knowledge-content.ts` is not published, is not
schema-valid enough to be published, is not linked from anywhere, does
not appear in the sitemap/RSS/catalog, and its page renders as a plain
404 (`findKnowledgeArticle` only ever resolves *published* articles).
**Delete it in the same change that adds the first real published
article** — it stops being necessary the moment `knowledgeArticles` has
one entry that reaches `status: "published"`.

**This placeholder is approved for local development only. It must not
reach production.** A statically generated document that renders as a 404
at a real, guessable-shaped URL is a soft-404 risk if it's ever deployed —
being excluded from the sitemap, RSS, catalog, and structured data reduces
discovery risk but does not eliminate the underlying problem of a "real"
page that isn't real content.

This is enforced, not just documented: `npm run guard:release`
(`scripts/check-release-guard.ts`) fails the build if the placeholder is
still the only entry in `knowledgeArticles` and no article has reached
`isPubliclyVisible`. It runs as a required step in the `build` job in
`.github/workflows/ci.yml` on every push and pull request to `main`, so it
blocks merge and deployment — not just local `npm run check` — until the
first policy-approved article is published and the placeholder is removed.
