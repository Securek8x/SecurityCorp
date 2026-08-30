# SecurityCorp content workflow

Use this repository-local workflow for every new SecurityCorp article. It
implements the publication-safety policy. Working material lives in
`content/drafts/` until it is ready for the article-module/registry workflow.
For requested articles, Ravi Teja Thota's standing publication authorization
applies only after every mandatory gate in the policy has passing evidence.

## Invocation

Use this prompt for a new request:

> Use the SecurityCorp content workflow to develop an article about [topic]. Stop after the evidence-backed outline for approval.

The requested stopping point is binding. A draft may not become public until
the mandatory publication gates below are complete.

## Stages and roles

1. **Topic proposal and duplication check** — compare the proposal with
   published `/knowledge` content, `docs/knowledge-base.md`, and relevant
   open Beads; record the decision in the article brief.
2. **Primary-source research** — the **Researcher** uses authoritative
   primary sources and records URL, claim, access date, and supported article
   section in the source ledger.
3. **Evidence-backed outline** — the **Researcher** and **Technical writer**
   map each material claim to ledger entries and label it `VALIDATED`,
   `DESIGN ONLY`, or `UNVERIFIED`.
4. **Technical draft** — the **Technical writer** writes concise educational
   material for SecurityCorp's mixed audience, with no hype, filler, fake
   quotations, invented facts, or unsupported claims.
5. **Command and lab-result verification** — the **Lab verifier** records
   exact sanitized commands, configuration examples, expected versus observed
   output, security implications, and whether the result was actually
   reproduced. A command's apparent success is not validation by itself.
6. **Publication-safety and privacy review** — the **Publication-safety
   reviewer** applies `docs/publication-safety-policy.md`, removes or
   generalizes sensitive infrastructure details, and checks every public
   surface including metadata and visuals.
7. **Editorial and accessibility review** — the **Final editor** checks
   clarity, hierarchy, descriptive links, headings, code-language labels,
   alt text, terminology, and consistency with existing articles.
8. **Metadata, internal-link, and placeholder validation** — validate the
   schema, controlled tags, internal links, metadata, and placeholder policy
   with the repository checks.
9. **Standing authorization and release evidence** — after all prior gates
   pass, record Ravi Teja Thota's standing publication authorization,
   truthful review identities/dates, usable Ruflo/Impeccable evidence, and
   required PR/production evidence. A pending or unusable workflow is not a
   pass and blocks publication.
10. **Publication** — only then add the approved article object to
    `lib/knowledge-content.ts` with `status: "published"`, completed review
    records, and the recorded evidence label; rerun checks before release.

## Evidence labels

- `VALIDATED`: reproduced and supported by recorded evidence.
- `DESIGN ONLY`: proposed architecture or procedure that was not reproduced.
- `UNVERIFIED`: evidence is incomplete. It may be published only when all
  mandatory gates pass and the limitation remains visible and accurate.

These labels are exact values validated by `lib/knowledge-schema.ts`. Never
silently upgrade a label. A technical or editorial rewrite does not turn a
design or incomplete result into validation.

## Required records

Create one subdirectory under `content/drafts/<article-slug>/` and copy the
six templates there. Keep records sanitized: no credentials, internal hosts,
real addresses, raw logs, screenshots with metadata, or unresolved weakness
details. Use fictional or documentation-safe examples from the policy.

## Beads structure for one future article

Create one parent article Bead containing sanitized planning information and
the policy review state. Create only these child tasks as the article is
actually approved to proceed; do not pre-create a content backlog:

1. `Research and evidence-backed outline` (stages 1–3)
2. `Draft and lab verification` (stages 4–5), depends on 1
3. `Safety and editorial review` (stages 6–8), depends on 2
4. `Standing authorization and release evidence` (stage 9), depends on 3 and
   is marked `blocked` until every mandatory gate has usable passing evidence
5. `Publish approved article` (stage 10), depends on 4

Record the dependencies with `bd dep add <dependent> <prerequisite>`. The
approval child must state the owner's decision, reviewer identity, and date
without copying sensitive source material. Do not close the publishing child
or add registry content while it remains blocked.

## Publication handoff

For an approved article, the implementer records Ravi Teja Thota's standing
authorization in `publicationApproval` and moves only the sanitized, reviewed
article object into the registry. Run the policy's full QA and protected
deployment workflow; `npm run check`, `npm run check:draft-isolation`, and
`npm run guard:release` are required baseline checks for a deployment
candidate.
