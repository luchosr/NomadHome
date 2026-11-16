# Proposal: warm-palette-swap

## Why

NH-118 shipped the "Gantry Signage" identity with a signal-yellow / black /
white / sign-green palette. The product owner wants a warmer palette (orange
`#E65F35`, sage, paper, stone, ink) while keeping everything else about Gantry:
flat panels, 2 px edges, state by shape, pictograms, the departure board,
Overpass, layout, copy and behavior. This is a colour swap, not a redesign.
Ticket: NH-129 (GitHub issue #129).

The accent was chosen by the user from a comparison (a darkened terracotta was
rejected). Measured with the repo's WCAG formula, orange `#E65F35` behaves like
the old yellow in one respect and unlike it in another: ink on orange is 4.81:1
(passes, so orange panels carry ink text and 2 px ink edges, exactly the old
black-on-yellow grammar), but paper on orange is 3.19:1 and orange on paper is
3.19:1 (fail), so orange is never text or a line colour on light surfaces and
paper text is never placed on orange. Sage is background-with-ink-text only.
All ratios are in `design.md` D2.

## What

- Replace palette values and names in the shared Tailwind preset and the CSS
  custom properties: orange panel (`ember` `#E65F35`), sage panel (`sage`
  `#96A8A6`), canvas (`paper` `#F7F5F2`), inset (`stone` `#E5E2DD`), ink
  (`#1E1E1E`). Old names `signal`, `sign-green`, `black`, `white` and the
  `surface-signal` / `surface-green` roles are removed so leftovers fail loudly
  (design.md D3). No extra accent token is added.
- Redefine the role tokens inside the warm palette: `fg-muted`, `fg-subtle`,
  `border-muted`, `action-hover`, `success`, `warning`, `danger`, `info` and
  their tints, each with computed AA ratios (design.md D2, D6).
- Keep ink text on the former yellow panels (hero, CTA band, destination index,
  search band, badge accent, step tiles, nav button) and make former green panels
  sage with ink text. Fix the places the old palette tolerated and the new one
  does not: the transparent hero city input with a `fg-subtle` placeholder (2.20:1
  on orange), muted text on orange, `text-fg-inverse` (paper) on former green
  panels, and the stale `text-signal` accents on ink panels (design.md D4, D5).
- Re-point the focus ring: ink outline with a paper gap on light and orange
  fields, paper outline with an ink gap on ink fields (design.md D7).
- Re-colour the Gantry mark, wordmarks and favicon (two copies of the SVG plus the
  inline `Logo.tsx`), and the hard-coded old forest accent in
  `DateRangePicker.tsx`, including its selected-day text colour.
- Update tests that assert the old colours (`tokens.test.ts`, `contrast.test.ts`,
  e2e `layout.spec.ts` RGB assertion) and regenerate `apps/web/DESIGN.md` and the
  docs that name the old palette.

## Impact

- **Capabilities affected**: `platform` only (design tokens, base styles,
  primitives, colour pairings, landing/search identity wording). `search` has no
  palette wording and is unchanged.
- **Breaking changes**: no runtime or API change. Token names change inside the
  monorepo (`signal`, `sign-green`, `black`, `white`, `surface-signal`,
  `surface-green` are removed), so every consumer in `apps/web/src` and
  `packages/ui/src` is re-pointed in this change. Repo scan: about 17 source
  files use `signal` classes, 4 use `sign-green`, plus 6 CSS custom property
  declarations, five logo/favicon files, `Modal.tsx`, `ErrorPage.tsx`,
  `DateRangePicker.tsx` and three test files. Because ink text on the orange
  panels is unchanged, most `text-fg` usages need no edit.
- **Migration required**: no data migration, no Prisma change, no API change.
- **Out of scope**: any layout, copy, behavior, typography, shape, spacing or
  pictogram change; dark mode; new tokens; restyling beyond shared tokens of
  host, admin, booking, auth and listing-detail screens; replacing the synthetic
  landing content; anything on the Post-MVP lists in `openspec/project.md`.

## Risks & Mitigations

| Risk                                                                                           | Likelihood | Mitigation                                                                                                                          |
| ---------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Low-contrast text on orange survives the swap (placeholder 2.20, fg-muted 3.20, paper 3.19)    | High       | Orange carries `text-fg` only; hero field gets a paper fill or ink placeholder; contrast test asserts the disallowed pairings < 4.5 |
| Orange used as text or link colour on light surfaces (3.19 on paper, 2.69 on stone)            | High       | Rule in spec and design; source scan; accents on ink panels only                                                                    |
| Small text on ink in orange is thin (4.81:1, passes but low headroom)                          | Medium     | Orange text on ink only at 18 px bold or larger; smaller text on ink uses paper (design.md D5)                                      |
| Tailwind default `white`/`black` still resolve after removal from `extend`                     | Medium     | Source-scan test forbids `-white`/`-black` utilities and stray hex literals (design.md D3)                                          |
| Danger crimson and orange sit 23 degrees apart in hue, weakening error states on orange panels | Medium     | Error text never sits on orange (danger on orange is 2.33:1); state stays carried by shape; open question Q3                        |
| Sage reads flat next to vivid orange                                                           | Medium     | Use sage sparingly (open question Q4); screenshots at Gate 3                                                                        |
| `MODIFIED` requirements target text that exists only after the NH-118 archive merges           | Medium     | Delta is written against the NH-118 requirement text; archive of NH-129 must follow the NH-118 archive (design.md D12)              |
| Hard-coded colours missed (favicon copy, inline logo, date picker, e2e RGB)                    | Medium     | Inventory in design.md D10, a task per item, leftover hex scan in final gates                                                       |

## Rollout

Big bang for tokens, primitives and the screens that use them, in one PR (no
runtime flag; a colour swap is not independently releasable per component).
