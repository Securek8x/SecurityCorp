---
name: SecurityCorp
description: Public cybersecurity portfolio and knowledge interface
colors:
  night: "#040609"
  paper: "#070b12"
  ink: "#e8f1f8"
  muted: "#93a6b9"
  line: "#1b2836"
  surface-raised: "#121c2b"
  acid: "#00e5ff"
  primary-hover: "#5cf0ff"
  accent2: "#8b5cf6"
  go: "#33ff99"
  warn: "#f5b942"
  danger: "#ff6b6b"
typography:
  body:
    fontFamily: "var(--font-sans-nf, system-ui, sans-serif)"
  label:
    fontFamily: "var(--font-mono-nf, monospace)"
rounded:
  sm: "9px"
spacing:
  page: "clamp(22px, 5vw, 76px)"
---

# Design System: SecurityCorp

## Overview

**Creative North Star: “The security operations interface.”**

The incumbent system is a deep-navy, cyberpunk/netrunner public interface: calm
operations surfaces, restrained cyan/teal signal color, precise typography, and
purposeful technical diagrams. It is an established visual world; frontend
work refines or extends it and does not replace it.

Key characteristics:

- Deep-navy surfaces with cyan signal accents and limited supporting colors.
- Tiger guardian imagery and existing Three.js/CSS motion remain signature
  assets and behavior.
- Dense technical information is structured for a mixed audience and readable
  at mobile and tablet widths.

## Colors

Use the CSS custom properties in `app/globals.css` as the source of truth.
Light-theme mappings remain first-class; do not introduce a second palette.

## Typography

Use the existing self-hosted sans and mono variables from `app/layout.tsx` and
`app/globals.css`. Preserve the current hierarchy, readable line lengths, and
mono treatment for labels and technical UI.

## Layout

Preserve the current route structure, page hierarchy, responsive grids, and
fluid page padding. Changes must work at desktop, tablet, and mobile widths and
must not replace the established shell or navigation without explicit approval.

## Elevation & Depth

Depth comes from tonal navy surfaces, thin borders, clipped corners, restrained
cyan glow, and existing diagram layers. Avoid broad blur, gratuitous glow, or
new shadow systems.

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

- Do preserve the current layout, content hierarchy, typography, palette,
  tiger guardian, Three.js scenes, and motion grammar.
- Do use existing tokens and components, and validate accessibility,
  responsive behavior, and performance after frontend changes.
- Do keep Cloudflare Pages/static-export compatibility and publication-safety
  requirements visible in every public surface.

### Don't:

- Don't create a generic SaaS appearance, purple-to-blue gradients, excessive
  animation, gratuitous glow, hover-only behavior, or desktop-only interaction.
- Don't remove focus states, replace the palette or typography, regenerate the
  design system, or replace the layout without explicit user authorization.
- Don't use emoji or publish private infrastructure specifics.
