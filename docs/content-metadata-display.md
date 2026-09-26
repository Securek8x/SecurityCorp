# Content metadata display policy

How learning-material metadata (legacy guides and knowledge articles, shown
on the homepage as field notes) is stored and displayed. Tracked by
`securitycorp-source-s41.20.11`; the storage contract is `s41.20.14`.

## Dates

- **Stored:** canonical `YYYY-MM-DD` (`IsoDate`), validated at build time —
  guides `publishedAt`/`lastReviewedAt` in `lib/content.ts`, knowledge
  `publishedAt`/`updatedAt`/`lastReviewedAt` in `lib/knowledge-schema.ts`.
  Never invent, backfill, or "round" a date; a missing date stays missing.
- **Displayed:** only through `components/content-date.tsx`, which renders
  `<time dateTime="YYYY-MM-DD">` with the deterministic UTC display format
  from `lib/content-dates.ts` (`Aug 28, 2026`). Raw ISO strings are not shown
  to readers.
- **Machine output** (JSON-LD, RSS, sitemap) uses `toIsoTimestamp` /
  `parseIsoDate`, never `new Date(displayString)`.

## Where each field appears

| Surface | Date | Reading time | Difficulty | Category/topic |
|---|---|---|---|---|
| Homepage guide rows | published | yes | yes | category |
| `/guides` cards | published | yes | yes | category |
| Guide article byline | published; last reviewed when it differs | yes | — | category label |
| Knowledge article byline | published; last reviewed when it differs; "what changed" date with a change note | yes | yes | pillar / category |
| Knowledge catalog cards | not shown (sorting/filtering surface) | yes | yes | pillar / category |

## Evidence on learning material

Field notes are learning content, not evidence records. They never inherit
the evidence maturity of the systems or projects they discuss: no
Design/Documented/Validated marks and no project evidence distributions on
guide or article metadata. Project evidence is shown only on project surfaces
(Systems under test, `/projects`, case studies) and the Failure Lab.

Knowledge articles still show their own article-level evidence label
(`VALIDATED` / `DESIGN ONLY` / `UNVERIFIED`); how that vocabulary relates to
the project maturity model is decided separately (`s41.20.15`) and is not
changed by this policy.
