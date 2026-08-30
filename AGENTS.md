# Agent Instructions

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

For every frontend-design task, Codex MUST load the project-local
`.agents/skills/impeccable/` skill and read the shared `PRODUCT.md`,
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

Codex MUST NOT use `craft`, `bolder`, `overdrive`, `redo`, design-system
regeneration, palette/typography replacement, major layout changes, new
animation systems, or new visual dependencies without explicit user
authorization. Claiming completion without the Impeccable checks is a
repository-policy violation. Do not apply this workflow to backend-only,
infrastructure-only, documentation-only, or nonvisual security work.

The Impeccable hook is project-local in `.codex/hooks.json`; Codex still
requires the human `/hooks` trust approval and MUST NOT bypass it.

## Mandatory Ruflo Editorial Routing

At the beginning of every substantive SecurityCorp editorial task, Codex MUST
attempt an actual Ruflo workflow invocation before drafting or modifying
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

For covered work, Codex MUST discover the registered Ruflo MCP tools and their
current schemas, invoke the real Ruflo `workflow_run` tool, and use Ruflo's
verified research template or the closest verified editorial/documentation
workflow. Supply the editorial objective, intended audience, scope, and
required output; record the returned workflow ID; perform at least one bounded
`workflow_status` check; and report the workflow ID and status in the final response.
Role-playing multiple agents or merely mentioning Ruflo does not count. A Ruflo
workflow ID is required evidence of invocation. Do not assume
`codex exec --sandbox read-only` can perform Ruflo's state-writing call:
interactive or appropriately authorized sessions may be required. Do not add
blanket permission bypasses or dangerously permissive execution flags.

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
from `origin/main` instead of `gitea/main` for that piece of work. A
worktree-isolated subagent forking from a stale base ref will silently miss
files — instructing it to stop and report rather than guess is correct; the
fix is to give it a base ref that's actually current, not to let it proceed
on stale content.

Reusing the same feature branch across multiple merges (adding new commits
to a branch after it has already been merged once) reliably produces a
false `mergeable: CONFLICTING` state, because squash-merging breaks the
linear ancestry GitHub needs to compute the `pull_request` synthetic merge
ref. When that ref can't be built, GitHub silently never runs custom
repo-defined Actions workflows (`Lint, typecheck, build`, `Dependency
review`) for that PR at all — zero run objects, no error, no
approval-queue entry — while GitHub Apps (CodeQL default setup, Cloudflare
Pages) keep working since they build off the PR head ref directly. Easy to
misdiagnose as an Actions/permissions problem; it isn't.

**Content-batch workflow** (knowledge-base articles, and any other
recurring small-PR workflow): each batch gets its own fresh branch created
directly off current `origin/main` (never off another feature branch, never
reused after merge). Push the branch to `gitea` (never `main` itself — that
push is intentionally gated), open a PR against `main` on GitHub, merge once
required checks pass, then retire the branch. Start the next batch from a
fresh branch off the now-updated `main`. Never stack a second batch of
commits onto an already-merged branch.

## Obsidian project-record policy (this project)

This project's Obsidian record is `AI-Work/Projects/SecurityCorp.md`. Follow
the global Obsidian project-record policy (already defined in your global
`AGENTS.md`) to keep it updated: durable decisions, implemented milestones,
verified root causes, important config changes, blockers, and next actions
only — never secrets, logs, transcripts, or chain-of-thought. Read it before
writing, update in place, keep it short.

Use Obsidian alongside claude-mem, not instead of it: claude-mem captures
granular session-level observations automatically; Obsidian holds the
durable, hand-curated project summary. Both should stay current.

This project uses **bd** (beads) for issue tracking. Run `bd prime` for full workflow context.

> **Architecture in one line:** Issues live in a local Dolt database
> (`.beads/dolt/`); cross-machine sync uses `bd dolt push/pull` (a
> git-compatible protocol), stored under `refs/dolt/data` on your git
> remote — separate from `refs/heads/*` where your code lives.
> `.beads/issues.jsonl` is a passive export, not the wire protocol.
>
> See [SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md)
> for the one-screen overview and anti-patterns (don't treat JSONL as the
> source of truth; don't `bd import` during normal operation; don't
> reach for third-party Dolt hosting before trying the default).

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
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
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
