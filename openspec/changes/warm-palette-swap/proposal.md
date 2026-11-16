# Proposal: warm-palette-swap

## Why

NH-118 shipped the "Gantry Signage" identity with a signal-yellow / black /
white / sign-green palette. The product owner wants a warmer, calmer
hospitality palette (terracotta, sage, paper, stone, ink) while keeping
everything else about Gantry: flat panels, 2 px edges, state by shape,
pictograms, the departure board, Overpass, layout, copy and behavior. This is a
colour swap, not a redesign. Ticket: NH-129 (GitHub issue #129).

The orientative palette from the ticket does not pass WCAG 2.1 AA as given
(ink `#1E1E1E` on terracotta `#B84A27` is 3.21:1, terracotta on stone is 4.02:1,
sage on paper is 2.28:1, so sage can never be text or a line). The change
therefore fixes the pairing grammar up front: terracotta panels carry light
text only, sage is a background that carries ink text only, and terracotta is
darkened slightly to `#A8401F` for margin. All ratios are computed in
`design.md` D2 with the repo's WCAG formula.

## What

- Replace the palette values and names in the shared Tailwind preset and the
  CSS custom properties: terracotta panel (`clay` `#A8401F`), sage panel
  (`sage` `#96A8A6`), canvas (`paper` `#F7F5F2`), inset (`stone` `#E5E2DD`),
  ink (`#1E1E1E`), plus one accent for text on ink (`clay-light` `#E58A64`).
  Old names `signal`, `sign-green`, `black`, `white` and the `surface-signal` /
  `surface-green` roles are removed so leftovers fail loudly (design.md D3).
- Redefine the role tokens inside the warm palette: `fg-muted`, `fg-subtle`,
  `border-muted`, `action-hover`, `success`, `warning`, `danger`, `info` and
  their tints, each with computed AA ratios (design.md D2, D6).
- Invert the text colour on the former yellow panels (hero, CTA band,
  destination index, search query band, badge accent, step tiles, nav button):
  light text on terracotta, ink text on sage (design.md D4, D5).
- Re-point the focus ring: ink outline with a paper gap on light fields, paper
  outline with an ink gap on terracotta and ink fields (design.md D7).
- Re-colour the Gantry mark, wordmarks and favicon (two copies of the SVG plus
  the inline `Logo.tsx`), and the hard-coded old forest accent in
  `DateRangePicker.tsx`.
- Update tests that assert the old colours (`tokens.test.ts`,
  `contrast.test.ts`, e2e `layout.spec.ts` RGB assertion) and regenerate
  `apps/web/DESIGN.md` and the other docs that name the old palette.

## Impact

- **Capabilities affected**: `platform` only (design tokens, base styles,
  primitives, colour pairings, landing/search identity wording). `search` has
  no palette wording and is unchanged.
- **Breaking changes**: no runtime or API change. Token names change inside the
  monorepo (`signal`, `sign-green`, `black`, `white`, `surface-signal`,
  `surface-green` are removed), so every consumer in `apps/web/src` and
  `packages/ui/src` is re-pointed in this change. Sizing from a repo scan:
  about 20 `signal` and 4 `sign-green` class usages across roughly 17 source
  files, 8 `surface-inverse` and about 19 `fg-inverse` usages, 6 CSS custom
  property declarations, the `HomeFooter`, `Layout`, `Hero`, `CtaBand`,
  `Locations`, `CoLiving`, `Testimonial`, `HowItWorks`, `FeaturedStays`,
  `Stats`, `Workspace`, `SearchPage`, `ListingCard`, `Button` and `Badge`
  components, five SVG/inline logo files and three test files.
- **Migration required**: no data migration, no Prisma change, no API change.
- **Out of scope**: any layout, copy, behavior, typography, shape, spacing or
  pictogram change; dark mode; new tokens beyond the accent for text on ink;
  restyling beyond shared tokens of host, admin, booking, auth and
  listing-detail screens; replacing the synthetic landing content (still
  tracked by NH-118 follow-ups); anything on the Post-MVP lists in
  `openspec/project.md`.

## Risks & Mitigations

| Risk                                                                                          | Likelihood | Mitigation                                                                                                                              |
| --------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Ticket palette fails AA (ink on terracotta 3.21, sage as text 2.28)                           | High       | Pairing grammar fixed in tokens; terracotta carries light text only; sage carries ink only; computed table and test in design.md D2     |
| A leftover `text-fg` on a terracotta panel (ink on clay is 2.71:1) ships unnoticed             | High       | Tokens renamed so old classes fail loudly; contrast test plus a source scan; screenshots of every former yellow panel at 360 px/desktop  |
| Tailwind default `white`/`black` still resolve after removal from `extend`                     | Medium     | Source-scan test forbids `-white`/`-black` utilities and hex literals outside the preset (design.md D3)                                 |
| Terracotta and the danger red read as the same hue, weakening error states                    | Medium     | State stays carried by shape (solid + struck) per D5 of NH-118; danger is a crimson `#9B1C2E`; flagged as open question                  |
| Light text on large terracotta panels loses the "high-impact" feel of black on yellow          | Medium     | Product-owner decision recorded; screenshots in the verification task; palette-only scope, no layout compensation                       |
| `MODIFIED` requirements target text that exists only after the NH-118 archive merges           | Medium     | Delta is written against the NH-118 requirement text; archive of NH-129 must follow the NH-118 archive (design.md D12)                   |
| Hard-coded colours missed (favicon copy, inline logo, date picker, e2e RGB)                    | Medium     | Explicit inventory in design.md D10 and a task per item; leftover hex scan in the final gates                                           |

## Rollout

Big bang for tokens, primitives and the screens that use them, in one PR (no
runtime flag; a colour swap is not independently releasable per component).
