# Frontend agent design enforcement

This repository uses the project-local Impeccable skill for frontend design
and UX review. Design with Intent remains deferred because its documented
installer is not immutably pinned and installs a broad collection of agents
and skills rather than a minimum UX-strategy subset.

## Installation and supply-chain record

- Package: `impeccable@3.6.0` (exact dev dependency; lockfile integrity is
  recorded in `package-lock.json`).
- Repository: `https://github.com/pbakaus/impeccable`.
- License: Apache-2.0.
- Providers installed at project scope: Claude Code and Codex CLI only.
- Official installer command: `./node_modules/.bin/impeccable install
  --providers=claude,codex --scope=project --yes`.
- User accepted the installer’s residual risk: the secondary skill-bundle
  download is not independently integrity-verified by the installer.
- No credentials, authentication settings, background services, persistent
  memory, or unrelated provider hooks were enabled.

The npm package contains the detector CLI and its bundled detector engine.
The installed provider payload is under the following project-local roots:

- `.claude/skills/impeccable/` — 148 files; Claude skill, references, scripts,
  and degraded-review role definitions.
- `.agents/skills/impeccable/` — 153 files; Codex skill, OpenAI metadata,
  references, scripts, and provider role definitions.
- `.claude/settings.local.json` — machine-local Claude `PostToolUse` and
  `Stop` hook manifest; ignored and not shared.
- `.codex/hooks.json` — shared project hook manifest, preserving existing
  Beads hooks and adding Impeccable `PostToolUse` and `Stop` hooks.

Post-install aggregate SHA-256 inventories (path-sorted file bytes) are:

- Claude skill tree: `1f0d946879f7f26b64c3f1983dbe1b7635ee463a257aafe68e1e660f0658ae25`
- Codex skill tree: `da245cf510134e03be699827ff886d4f29c1f5b322cb49ce43a3a04ea0aee401`

The path inventory was captured immediately after installation as the counts
and path-sorted manifest digests above; rerun `find .claude/skills/impeccable
-type f | sort` (or the `.agents` equivalent) with `sha256sum` to reproduce
the per-file list and hashes. Provider payloads and Claude local settings are
machine-local in this checkout’s local exclude; shared `.impeccable/config.json`,
`PRODUCT.md`, `DESIGN.md`, and policy instructions are repository artifacts.

## Enforcement

`npm run design:audit` runs the lockfile-installed `impeccable detect` over
`app` and `components` only. It excludes dependencies, build output, caches,
and third-party assets. CI runs it as **Frontend design audit** after `npm ci`.
CI sets `PUPPETEER_SKIP_DOWNLOAD=true`; the optional browser stack is not
needed for this source detector.
Existing intentional findings are waived only by exact rule/value and file
scope in `.impeccable/config.json`; the baseline is clean with exit code 0.

Both root agent instruction files require Impeccable for every frontend-design
task, including responsive layout, accessibility, visual consistency,
knowledge discovery, motion, diagrams, empty/loading/error states, and
user-facing performance. They require context loading, incumbent inspection,
bounded `critique`/`audit`/`adapt`/`optimize`/`harden`/`polish` passes as
applicable, desktop/tablet/mobile evidence for material visual changes, and
repository validation before completion. Redesign-oriented commands and major
identity changes require explicit user authorization.

## Installed-instruction review

The installed Markdown/TOML/YAML instructions were reviewed for destructive
commands, credential access, automatic commits/pushes/deployments, hidden
network activity, and prompt-injection directives. The skill does contain
optional live-mode helpers and image-generation helpers; they are not enabled
by this setup. The normal detector and hooks are local Node processes. No
background service, persistent memory, authentication change, or automatic
git/deployment action is configured.

## Validation record

- `node .agents/skills/impeccable/scripts/context.mjs --target app/globals.css`
  loaded the installed skill and identified the incumbent visual system.
- `./node_modules/.bin/impeccable detect --json app components` returned `[]`
  with exit code 0 after the narrow baseline waivers.
- JSON syntax was inspected for `.claude/settings.local.json`, `.codex/hooks.json`,
  and `.impeccable/config.json`.
- ESLint ignores only the installed third-party provider payload directories;
  SecurityCorp application and configuration files remain linted.
- Codex’s `/hooks` trust approval remains a human platform step; it was not
  bypassed or programmatically approved.
- No website design changes were made. Full repository validation is deferred
  until the surrounding uncommitted working tree is isolated; this setup does
  not run redesign commands or visual mutation workflows.
