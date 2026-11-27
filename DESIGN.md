---
name: SecurityCorp
description: Public cybersecurity portfolio and knowledge interface
colors:
  night: "#070605"
  paper: "#0c0a09"
  ink: "#f3ece2"
  muted: "#a89b8b"
  line: "#2e261e"
  surface-raised: "#1f1913"
  acid: "#ff7a1a"
  primary-hover: "#ff9440"
  accent2: "#ff2e88"
  go: "#b4ff3a"
  warn: "#ffb020"
  danger: "#ff2e88"
typography:
  body:
    fontFamily: "var(--font-sans-nf, system-ui, sans-serif)"
  display:
    fontFamily: "var(--font-display-nf, Impact, sans-serif)"
  label:
    fontFamily: "var(--font-mono-nf, monospace)"
rounded:
  sm: "9px"
spacing:
  page: "clamp(22px, 5vw, 76px)"
---

# Design System: SecurityCorp

## Overview

**Creative North Star: “The tiger’s lab notebook.”**

Cyberpunk, but taken from the tiger rather than a generic navy-and-cyan
security template. Warm black surfaces, tiger orange as the primary signal,
acid green for recorded results, and magenta only as a rare third accent.
The tiger guardian is the identifier and stays in the logo, the homepage
poster, and the author mark.

Key characteristics:

- Warm-black surfaces, orange primary, green for recorded results.
- Display headings (Big Shoulders), IBM Plex Sans for reading, IBM
  Plex Mono for technical UI. All three are self-hosted through `next/font`.
- Evidence stays honest: a homepage status says only whether a result was
  recorded, reported, or never claimed.
- Dense technical information stays readable at mobile and tablet widths.

## Colors

Use the CSS custom properties in `app/globals.css` as the source of truth.
Light-theme mappings remain first-class; do not introduce a second palette.

## Typography

Use the self-hosted display, sans, and mono variables from `app/layout.tsx`
and `app/globals.css`. Display type is for headings. Mono is for labels,
commands, and status. Keep readable line lengths.

## Layout

Preserve the current route structure, page hierarchy, responsive grids, and
fluid page padding. Changes must work at desktop, tablet, and mobile widths and
must not replace the established shell or navigation without explicit approval.

## Elevation & Depth

Depth comes from warm-black surfaces, thin borders, clipped corners, and a
restrained orange edge. Scanlines belong on the tiger poster, not across
body text. Avoid broad blur, gratuitous glow, or a glowing network backdrop.

## Shapes

Preserve the established clipped-corner language, thin borders, compact
technical labels, and existing radius scale. Do not introduce nested-card
proliferation or generic rounded SaaS containers.

## Components

Navigation, cards, diagrams, hero visuals, filters, buttons, focus states, and
motion controllers inherit the existing implementation. Preserve semantic
HTML, keyboard behavior, reduced-motion fallbacks, and mobile interaction
targets.

## Do's and Don'ts

### Do:

- Do preserve the tiger guardian, the warm-black / orange / acid-green
  palette, the display-plus-plex typography, and reduced-motion behavior.
- Do use existing tokens and components, and validate accessibility,
  responsive behavior, and performance after frontend changes.
- Do keep Cloudflare Pages/static-export compatibility and publication-safety
  requirements visible in every public surface.

### Don't:

- Don't create a generic SaaS appearance, purple-to-blue gradients, excessive
  animation, gratuitous glow, hover-only behavior, or desktop-only interaction.
- Don't remove focus states, or replace this palette or typography again,
  without explicit user authorization.
- Don't go back to the navy, cyan, and purple template, or to a neon
  network-graph hero.
- Don't use emoji or publish private infrastructure specifics.
