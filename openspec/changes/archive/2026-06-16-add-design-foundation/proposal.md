# Proposal: add-design-foundation

## Why

The web UI currently ships with placeholder styling — an empty Tailwind preset
(`theme.extend: {}`), a bare `globals.css`, and a slate-900 placeholder Button.
NomadHome now has a v1 design system (warm editorial hospitality: sand / forest /
terracotta, Instrument Serif + DM Sans, soft warm shadows). Wiring its tokens and
base primitives into the shared packages now means every future feature inherits
the brand for free, instead of each ticket re-deriving colors and spacing.

## What

- NomadHome design tokens (color scales, semantic roles, type, spacing, radii,
  shadows, motion) become first-class Tailwind theme values in the shared preset,
  usable as `bg-forest-700`, `text-ink-900`, `rounded-card`, `shadow-md`, etc.
- Brand fonts and base element styles (sand canvas, serif headings, focus rings)
  load from `packages/ui` so all apps share one stylesheet entry point.
- Shared primitives match the spec: `Button` (primary / secondary / tertiary /
  destructive), plus new `Badge`, `Input`, `Card`.
- Brand logo SVGs are vendored into `packages/ui/src/assets/`.

## Impact

- **Capabilities affected**: `platform` (web UI foundation).
- **Breaking changes**: no — the existing `Button` keeps its prop surface; only
  default styling changes.
- **Migration required**: no.
- **Out of scope**: app screens, the mobile-app / member-dashboard UI kits, the
  slide deck, a living style-guide route, a custom icon set (Lucide via CDN stays
  as documented), real photography.

## Risks & Mitigations

| Risk                                                        | Likelihood | Mitigation                                                                                                    |
| ----------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| Fonts are Google Fonts substitutions, not final brand fonts | High       | Tokens reference `--font-serif`/`--font-sans` CSS vars; swapping later is a one-line change. Flagged in code. |
| Token names drift from the design source                    | Low        | Names copied verbatim from `colors_and_type.css`.                                                             |

## Rollout

Big bang — foundational, no runtime feature flag. Visual change only; covered by
component tests and the existing build.
