---
name: SecurityCorp
description: Independent security engineering publication
colors:
  paper-light: "#fbfbf9"
  ink-light: "#1c1d20"
  muted-light: "#5c5f66"
  link-light: "#1f5a86"
  paper-dark: "#131415"
  ink-dark: "#ebe8e2"
  muted-dark: "#a8a59e"
  link-dark: "#9cc3e0"
  line-light: "#e3e2dd"
  line-dark: "#2b2c2f"
typography:
  heading:
    fontFamily: "var(--font-serif-nf) — Source Serif 4, 500/600"
  body:
    fontFamily: "var(--font-sans-nf) — Source Sans 3, 400/600, 18px base"
  code:
    fontFamily: "var(--font-mono-nf) — JetBrains Mono"
layout:
  pageMax: "1140px"
  readingMeasure: "40rem (~68 characters)"
  gutter: "clamp(20px, 4vw, 40px)"
---

# Design System: SecurityCorp

## Overview

**North star: an independent security engineering publication.**

Owner decision 2026-11-21 (Beads epic securitycorp-source-wo8) replaced the
earlier cyberpunk "security operations interface" with a quiet editorial
system so articles are faster to read. Tokens live in `app/publication.css`
(loaded after `app/globals.css`, whose legacy component rules still apply
underneath where not overridden).

## Principles

- Content leads. On article pages the byline sits directly under the title
  and the first useful paragraph follows it.
- One reading column (`--measure`) inside a centered page grid (`--page-max`).
- Warm serif headings, humanist sans body, restrained blue links that are
  underlined in prose.
- Light and dark themes are both first-class; the theme toggle and the
  pre-paint theme script are unchanged.

## Don't

- No faux-terminal labels or `$` prompts, ornamental numbering, glow, neon
  gradients, grid-line backgrounds, clipped corners, or duplicate navigation.
- No new visual dependencies or animation systems without owner approval.
- Don't remove focus outlines, keyboard access, reduced-motion fallbacks, or
  existing URLs and heading anchors.

## Components

- Masthead: tiger mark (28px) plus set-in-type "SecurityCorp" wordmark,
  four nav links, theme toggle; collapses to a disclosure menu at <=760px.
- Lists (`.pub-list` / `.pub-entry`): title, concise summary, metadata row
  (topic, format, level, read time), date.
- Article: `.article-page` reading column, compact table of contents,
  callouts with a 3px left rule, code blocks that scroll inside themselves.
- Diagrams and Schematic Plates keep their own components and inherit the
  new tokens.
