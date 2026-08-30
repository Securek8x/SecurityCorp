# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

Before drafting, reviewing, or publishing repository- or Bead-derived content, agents must read and follow [the publication-safety policy](docs/publication-safety-policy.md). Repository or Bead material is not public-ready without explicit `approved-public` status.

## Standing article-publication authority

For a requested article, Ravi Teja Thota's standing authorization in
`docs/publication-safety-policy.md` replaces a separate per-article approval
request only after every mandatory editorial, technical, security/privacy,
visual, repository-QA, and metadata gate has recorded passing evidence.
`drafting`, pending reviews, and absent publication dates are workflow stages:
correct safe defects, rerun the affected gates, and publish only after they
pass. Discover and use the actual registered Ruflo and Impeccable capabilities;
a pending, failed, or unusable workflow is not approval and blocks publication.
Record only truthful identities, workflow IDs, dates, results, and deployment
evidence. Follow the protected PR, Cloudflare Production, live-site, and
Gitea/GitHub synchronization workflow in the policy and its linked documents.

## Mandatory frontend design workflow

For every frontend-design task, Claude Code MUST load the project-local
`.claude/skills/impeccable/` skill and read the shared `PRODUCT.md`,
`DESIGN.md`, and `.impeccable/config.json` before planning. Frontend-design
includes pages/layouts, rendered React components, CSS/Tailwind/tokens/themes,
typography/color/spacing/responsive rules, navigation/forms/article
presentation/knowledge discovery, diagrams, animation/motion/Three.js, visual
assets, accessibility behavior, content hierarchy, empty/loading/error/
onboarding states, and user-facing performance.

Inspect the incumbent implementation and representative screenshots before
editing. Preserve the current layout and SecurityCorp visual system unless the
user explicitly authorizes a redesign. Use `shape` only for net-new surfaces or
material interaction changes; run `critique` before material visual changes.
Implement the smallest coherent change, then run `audit`, `adapt` when
responsive behavior is affected, `optimize` when images/motion/JavaScript/
Three.js/loading is affected, `harden` for overflow/edge/loading/error/
keyboard/reduced-motion behavior, and `polish` only after functional
validation. Run the deterministic local detector before completion, capture
desktop/tablet/mobile evidence for material visual changes, compare with the
pre-change baseline, and run repository lint, typecheck, tests, and production
build. Report commands, findings, narrow waivers, evidence, and risks.

Claude Code MUST NOT use `craft`, `bolder`, `overdrive`, `redo`, design-system
regeneration, palette/typography replacement, major layout changes, new
animation systems, or new visual dependencies without explicit user
authorization. Claiming completion without the Impeccable checks is a
repository-policy violation. Do not apply this workflow to backend-only,
infrastructure-only, documentation-only, or nonvisual security work.

The Impeccable hook is project-local in `.claude/settings.local.json`; it is
machine-local by design and MUST preserve unrelated Claude settings. Do not
move it into a shared machine configuration without explicit authorization.

## Mandatory Ruflo Editorial Routing

At the beginning of every substantive SecurityCorp editorial task, Claude Code
MUST attempt an actual Ruflo workflow invocation before drafting or modifying
public-facing prose. Covered work includes topic research, source collection,
research briefs, article outlines, guides, tutorials, blog posts, field notes,
project narratives, case studies, drafting, rewriting, expanding or shortening
content, summaries, excerpts, titles and headings, SEO titles, meta
descriptions, Open Graph copy, homepage and landing-page copy, about-page copy,
FAQ content, meaningful captions and alt text, technical fact checking,
editorial review, and publication-safety review.

Ruflo routing is not required for source code, tests, dependency maintenance,
mechanical formatting, internal Beads bookkeeping, commit messages, short
implementation-status reports, or typo-only corrections that do not change
meaning. For mixed code and substantive public-prose work, route only the
editorial portion.

For covered work, Claude Code MUST discover the exact current schemas of the
available `mcp__ruflo__...` tools, invoke the real Ruflo `workflow_run` tool,
and use Ruflo's verified research template or the closest verified
editorial/documentation workflow. Supply the editorial objective, intended
audience, scope, and required output; record the returned workflow ID; perform
at least one bounded `workflow_status` check; and report the workflow ID and status in the
final response. Role-playing multiple agents or merely mentioning Ruflo does
not count. A Ruflo workflow ID is required evidence of invocation.

### Current Ruflo executor limitation

Ruflo is installed and connected. Codex successfully invoked Ruflo and received
workflow ID `workflow-1788018543601-ekh4q2`; that workflow remained running at
0% with a pending Execute stage, and no retrievable editorial output was
returned. Do not credit Ruflo with research, writing, or review unless it
returns the actual result, and do not treat acceptance of a request as
completion.

### Disclosed native fallback for non-public editorial work

Editorial work that is not being published may use native capabilities when
Ruflo remains at 0% with a pending Execute stage, fails, times out, returns no
retrievable editorial result, or is temporarily unavailable. State that Ruflo
was attempted, report the workflow ID and last-known status or error, and do
not represent native work as Ruflo work. For publication, the standing policy's
mandatory Ruflo and Impeccable gates remain blocking until usable pass evidence
exists.

This visible fallback MUST use separate native roles for research; drafting or
documentation; technical verification; publication-safety review; and final
editorial review. Never describe native-agent results as Ruflo results, and
preserve every applicable standing-authorization and human-review requirement.

Whether Ruflo succeeds or the fallback is used, preserve
`docs/publication-safety-policy.md`, existing content schemas and controlled
tags, SecurityCorp voice and terminology, and the exact meanings of
`VALIDATED` and `DESIGN ONLY`. Prefer primary and authoritative sources; never
invent citations, quotations, commands, dates, metrics, or test results; make
no validation claim without recorded evidence; disclose no sensitive private
infrastructure; do not automatically register drafts as published content;
apply Ravi Teja Thota's standing authorization only after every mandatory gate
passes; and never commit, push, deploy, or publish without authorization.

For every covered task, include a concise final-response section titled
`Editorial routing evidence` stating: Ruflo invocation (attempted or not
attempted), workflow ID, final or last-known status, whether Ruflo returned
usable editorial output, whether native fallback was used, completed review
stages, and whether standing authorization was eligible and recorded. Do not
fabricate evidence.

## Periodic trend research (start of session)

Once per session, before starting other substantive work, check for current
developments relevant to this site (static-site/Jamstack tooling, security
content/education trends, SEO and AI-crawler conventions, privacy-respecting
analytics, accessibility/performance practice) and file genuinely new
findings as Beads issues. This is research-and-file, not research-and-build —
do not implement anything from it without separate authorization.

1. Attempt a real Ruflo research workflow: discover the current
   `mcp__ruflo__...` schemas, invoke `workflow_run` with a research template
   (or the closest verified one), record the workflow ID, and perform at
   least one bounded `workflow_status` check.
2. Known limitation: Ruflo has consistently stalled at 0% with a pending
   Execute stage all session and returned no usable result (see "Current
   Ruflo executor limitation" above). If that recurs, disclose the workflow
   ID and last-known status, then fall back to native research (`WebSearch`/
   `WebFetch`) for the same question. Never represent native findings as
   Ruflo output.
3. Before filing anything, run `bd search "<topic>"` for each candidate
   finding — only file it if it is not already tracked, open or closed. Do
   not create near-duplicate beads across sessions.
4. File genuinely new findings as standalone `task`/`feature` beads (no
   forced parent epic unless one clearly fits) with a concrete
   `--description` and `--acceptance`, reasonable priority, and a
   `site-feature` label alongside any other fitting label. A handful of
   well-considered findings beats an exhaustive list — this is meant to
   surface real opportunities, not generate busywork.
5. Report what was checked, whether Ruflo returned usable output, and what
   (if anything) was filed, in the session's final response — don't leave
   this silent.

## Obsidian project-record policy (this project)

This project's Obsidian record is `AI-Work/Projects/SecurityCorp.md`. Follow
the global Obsidian project-record policy (already defined in your global
instructions) to keep it updated: durable decisions, implemented milestones,
verified root causes, important config changes, blockers, and next actions
only — never secrets, logs, transcripts, or chain-of-thought. Read it before
writing, update in place, keep it short.

Use Obsidian alongside claude-mem, not instead of it: claude-mem captures
granular session-level observations automatically; Obsidian holds the
durable, hand-curated project summary. Both should stay current.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->


## Build & Test

_Add your build and test commands here_

```bash
# Example:
# npm install
# npm test
```

## Architecture Overview

_Add a brief overview of your project architecture_

## Conventions & Patterns

_Add your project-specific conventions here_

## Git identity and publishing

Claude may create commits and push them using the user's existing authenticated
GitHub credentials.

All commits must use the repository's configured `user.name` and `user.email`.
Never override the Git author or committer identity.

Do not add `Co-authored-by`, `Generated with Claude Code`, `Claude-Session`,
Anthropic email addresses, or other Claude attribution to commits or pull
requests.

Never print, read, copy, embed, or store the user's GitHub token. Use the
credentials already configured through GitHub CLI and Git Credential Manager.

### Never `git reset --hard` (or any other discard-changes command) on a dirty tree

Incident (2026-08-29): an unstashed `git reset --hard origin/main`, run as a
"cleanup" step after a merge, destroyed an unrelated uncommitted
`CONTRIBUTING.md` edit that had been preserved all session. It was recovered
byte-identical only because the exact diff was still visible earlier in the
same conversation — that will not be true in general.

Rule: before `git reset --hard`, `git checkout --`/`restore` on tracked
files, `git clean -f`, or any other command that discards uncommitted work,
run `git status --porcelain` first. If it reports anything, `git stash push
-u` (include untracked) before the destructive command, and `git stash pop`
after. Never skip this because the change "looks unrelated" — that is
exactly the class of change most likely to be silently destroyed.
`CONTRIBUTING.md`'s pre-existing local edit specifically must stay excluded
from every commit in this repo (it is unrelated to the knowledge-base/content
work) and must survive every branch switch and reset via this stash pattern,
not by being recreated from memory after the fact.

## Gitea → GitHub flow: known pitfalls (root-caused 2026-08-29)

The Gitea push mirror is **one-directional** (Gitea → GitHub only). Merging a
PR directly on GitHub (`gh pr merge`) does NOT sync back to Gitea — Gitea's
`main` silently falls behind GitHub's `main` from that point on. Before
branching for new work, verify `git rev-parse gitea/main` actually matches
`git rev-parse origin/main` (fetch both first); if they've diverged, branch
from `origin/main` instead of `gitea/main` for that piece of work.
`isolation: "worktree"` subagents fork from a fixed base ref and will
silently miss files if that ref is stale — they're instructed to stop and
report rather than guess, which is the correct behavior; the fix is to give
them a base ref (or catch-up instructions) that's actually current, not to
let them proceed on stale content.

Reusing the same feature branch across multiple merges (i.e. adding new
commits to a branch after it has already been merged once) reliably
produces a false `mergeable: CONFLICTING` state, because squash-merging
breaks the linear ancestry GitHub needs to compute the `pull_request`
synthetic merge ref. When that ref can't be built, GitHub silently never
runs custom repo-defined Actions workflows (`Lint, typecheck, build`,
`Dependency review`) for that PR at all — zero run objects, no error, no
approval-queue entry — while GitHub Apps (CodeQL default setup, Cloudflare
Pages) keep working since they build off the PR head ref directly. This is
easy to misdiagnose as an Actions/permissions problem; it isn't.

**Content-batch workflow** (knowledge-base articles, and any other
recurring small-PR workflow): each batch gets its own fresh branch created
directly off current `origin/main` (never off another feature branch, never
reused after merge). Push the branch to `gitea` (never `main` itself — that
push is intentionally gated), open a PR against `main` on GitHub, merge once
required checks pass, then retire the branch. Start the next batch from a
fresh branch off the now-updated `main`. Never stack a second batch of
commits onto an already-merged branch.
