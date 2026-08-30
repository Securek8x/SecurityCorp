# Publication Safety Policy

## Purpose and scope

This is the authoritative publication-safety policy for SecurityCorp. It governs all research, planning, Beads, drafts, articles, guides, project pages, diagrams, screenshots, metadata, feeds, social previews, generated content, and any material derived from a repository or Bead.

Its purpose is to make useful security education possible without exposing personal, employer, infrastructure, account, operational, or other sensitive information. A lesson may be published only when its public form is safe on its own.

## Classification and lifecycle

All material starts as **internal-source**. This is the default classification for repository content, Beads, notes, screenshots, logs, generated output, and research.

Material may move through this lifecycle only in order:

`internal-source → sanitized-draft → approved-public`

- **internal-source** — not approved for public use. It may contain context that needs review even when it appears harmless.
- **sanitized-draft** — a deliberately generalized version prepared for review. It is still not approved for publication.
- **approved-public** — explicitly reviewed and approved for the intended public surface.

Existing information in a repository or Bead is not automatically approved for website publication. Publication requires sanitization review and explicit `approved-public` status.

## Prohibited public disclosures

Do not publish or expose information that identifies or materially helps target a person, employer, account, system, network, location, or unresolved weakness. This includes credentials; tokens; keys; cookies; account identifiers; hostnames; real domains or addresses; network ranges; ports; filesystem paths; hardware identifiers; raw logs; screenshots with identifying metadata; internal controls; employer information; and unresolved vulnerabilities.

Do not publish, recommend, imply, or illustrate excluded acquisition, download-automation, copyright-infringement, restriction-bypass, or related activity. Do not turn an excluded product into an obvious substitute through generic wording.

Offensive-security material must be limited to authorized systems or isolated labs, state its scope and rules of engagement, avoid destructive or unnecessarily operational instructions, and include defensive detection and remediation context.

## Permitted sanitized educational use

Educational material may explain defensive principles, reproducible methods, threat models, failure modes, and isolated-lab exercises. Use clearly fictional examples, documentation ranges, placeholder identities, and placeholder secrets. Label hypothetical or simulated results as such.

Examples may use values such as `lab.example.com`, `git.example.com/security/lab`, `lab-admin`, `storage-node`, `${API_TOKEN}`, `<redacted>`, `192.0.2.0/24`, `198.51.100.0/24`, and `203.0.113.0/24`.

Defensive file scanning may be discussed only for authorized, synthetic, uploaded, or isolated test files. It must not be connected to excluded applications or acquisition activity.

## Repository-public versus website-public exposure

Repository visibility and website visibility are separate decisions. A public repository can still contain material that is unsuitable for a public website, feed, metadata field, social preview, image, diagram, or generated asset. Conversely, an `approved-public` website item must remain safe when copied into every public surface generated from it.

Do not assume that a Git history entry, issue tracker record, source comment, build artifact, or preview deployment is an approved publication channel.

## Beads and repository-derived source material

Treat every Bead and repository-derived item as **internal-source** unless it records an explicit `approved-public` decision. Beads may preserve work context; they are not a publication queue or a source of automatically reusable prose.

When creating or updating a content-related Bead:

1. Record only sanitized planning information.
2. Reference this policy and the required review state.
3. Do not copy logs, configuration, screenshots, identifiers, credentials, or real incident details into the Bead.
4. Require `approved-public` status before any associated material is published.

## Sanitization requirements

Sanitize before drafting for public use, not just before release. Replace real-world details with fictional equivalents; remove identifying metadata; generalize architecture; and teach the underlying principle instead of the deployment.

Manually review images, screenshots, diagrams, logs, filenames, EXIF data, browser tabs, notifications, avatars, generated metadata, links, alt text, and social-preview text. Do not rely only on automated redaction or scanning.

Separate observation from verification. Do not claim a control is effective merely because a process started, a configuration exists, or a log line reports success.

## Publication review checklist

Before an item can receive `approved-public` status, confirm all of the following:

- The source material was classified and sanitized.
- No personal, employer, account, infrastructure, location, credential, or identifying metadata remains.
- No prohibited activity, excluded technology, copyright-infringement implication, or restriction-bypass guidance appears directly or indirectly.
- No unresolved real vulnerability or unsafe real configuration is described.
- Examples, logs, addresses, identities, and secrets are fictional, synthetic, or documentation-safe.
- Claims are supported, clearly scoped, and distinguish observation from verification.
- Diagrams, screenshots, metadata, feeds, social previews, and generated output received the same review as body copy.
- Technical and privacy reviewers recorded an explicit approval.

## Standing publication authorization and mandatory gates

Ravi Teja Thota grants agents standing authority to publish a **requested**
SecurityCorp article without a second per-article approval only after every
mandatory gate in this section has recorded passing evidence. This authority is
the explicit human authorization required for `approved-public`; record it as
`Ravi Teja Thota — standing publication authorization` with the truthful date.
It never authorizes invented evidence, publication outside a requested scope,
or bypassing a failed gate.

`drafting`, missing publication dates, and pending review records are workflow
stages, not permanent blockers. Agents must correct safe, article-scoped
defects and repeat the affected reviews. An article remains unpublished only
when a mandatory gate has an unresolved failure or cannot produce usable
evidence.

Before publication, record all of the following:

1. **Editorial review.** Use the registered Ruflo editorial capability and
   obtain a usable passing result. It must cover substance, clarity, structure,
   title and conclusion, qualifications, citations, grammar, terminology, and
   the absence of filler, placeholders, repetition, and unsupported claims.
2. **Technical review.** Explicitly pass the article's commands, code,
   architectural and security claims, diagrams, and recommendations. Correct
   safe defects and rerun the review rather than treating the first ordinary
   defect as a terminal result.
3. **Security and privacy review.** Use registered Ruflo security review when
   available and run applicable repository safety/secret checks. Review the
   article and relevant Git history for credentials, tokens, keys, `.env`
   values, private IPs or hostnames, private infrastructure/repository detail,
   confidential information, and unsafe instruction outside authorized,
   bounded defensive context.
4. **Visual review.** Use registered Ruflo UI/UX review and the project
   Impeccable workflow when available. Reuse the shared article shell and
   established visual system; inspect desktop, tablet, and mobile rendering,
   semantics, labels, keyboard/focus behavior, diagrams, tables, callouts,
   code blocks, navigation, overflow, and layout stability. Do not create a
   parallel article template or unrelated design change.
5. **Repository QA.** Run the applicable formatting, lint, typecheck, tests,
   schema/registry integrity, tag/public-term or secret checks, link/citation
   review, and production static build. Verify real rendered content—not a
   draft 404—in the catalog, topic navigation, static route, sitemap, RSS,
   metadata, and social preview surfaces.
6. **Metadata.** Only after gates 1–5 pass, set `status: "published"`,
   `publishedAt`, `lastReviewedAt`, approved privacy and technical review
   records, and the standing publication authorization. The current schema has
   no editorial/visual-review fields; retain those workflow IDs and pass
   evidence in the PR and the related Bead until the schema gains fields.

For material based on real systems, incidents, or operational experience, the
review must still confirm it has been generalized sufficiently and contains no
unresolved real weakness.

### Capability evidence and remediation

Agents must discover the registered Ruflo tools, templates, and schemas before
invocation. A workflow that is pending, running at 0%, fails, times out, or
returns no usable result is **not** approval. Native review may supplement
Ruflo evidence but must never be represented as Ruflo evidence.

If a mandatory Ruflo or Impeccable capability is unavailable, preserve work,
record the exact failure, and retry safely when appropriate. Publication is
blocked until that gate has usable passing evidence. Stop only for an
unresolved accuracy concern, missing required capability or credential, policy
conflict, destructive operation, ambiguous scope, or another condition that
cannot be safely remediated. Independently passing articles may continue.

### Article-production definition of done

An article-production request is complete only when every mandatory gate has
recorded passing evidence; the article has truthful published metadata; the
protected PR is merged with required checks passing; Cloudflare Pages reports
Production for that exact `main` commit; and the live catalog, route,
navigation, sitemap, RSS, metadata, responsive layout, and production health
have been verified. Update the relevant Bead and operational documentation
without exposing sensitive information, and finish with Gitea and GitHub on
the same non-divergent commit.

### Protected publication workflow

Publication-ready work must follow the protected branch workflow in
`docs/knowledge-base.md` and `docs/cloudflare-pages.md`: start from compatible
current GitHub and Gitea history; use a focused feature branch; push it to
Gitea and confirm the GitHub mirror; open a GitHub PR to `main`; wait for all
required checks; commit with Ravi Teja Thota's configured Git identity and no
Codex or Claude attribution; merge by the approved method; confirm Cloudflare
Pages deploys the resulting GitHub `main` commit to Production; verify the
live article and all public surfaces; and fast-forward Gitea `main` when
needed without overwriting or forcing divergent history. A Cloudflare Preview
or local build is not publication.

## Handling ambiguous information

When classification or safety is uncertain, treat the information as **internal-source**. Omit it from public material, ask for human review, and teach a fictionalized principle instead. Do not infer permission from repository access, a Bead reference, prior publication, or partial redaction.

## Incident and remediation procedure

If a possible accidental disclosure is found:

1. Stop publication and distribution work for the affected material.
2. Classify the item as internal-source and restrict further copying.
3. Notify the responsible human reviewer with the affected surfaces and a concise risk summary.
4. Remove or replace the exposed material only with authorized human direction; preserve enough evidence for remediation without spreading the sensitive detail.
5. Review derived pages, feeds, previews, images, caches, and repository history for the same disclosure.
6. Document the remediation decision in a sanitized Bead or review record, then strengthen the relevant checklist or validation rule.

## Examples

| Source material | Unsafe public transformation | Safe public transformation |
| --- | --- | --- |
| A real host and network path | Publish the exact host, address, port, and path. | Describe a fictional service at `lab.example.com` with documentation-safe addresses. |
| A real incident log | Copy the raw log or screenshot. | Create a short synthetic event sequence and label it simulated. |
| A real access-control lesson | Publish account names, roles, and policy identifiers. | Explain least privilege using `lab-admin`, placeholder roles, and a fictional resource. |
| An unresolved weakness | Describe the live weakness and how to reach it. | Omit the live detail; publish a generic pattern only after remediation and review. |

## Enforcement and exceptions

This policy is mandatory for current and future content work. Content templates, Beads, review metadata, and publication checks must require `approved-public` status before release.

Exceptions require explicit written human approval before any public use. An exception request must state the intended public surface, why the material is necessary, the residual risk, the sanitization performed, and the expiry or review date. Silence, convenience, and prior repository availability are not exceptions.
