# Design: warm-palette-swap

Sources: NH-129, `apps/web/DESIGN.md`, `packages/config/tailwind.preset.js`,
`packages/ui/src/styles/globals.css`, `packages/ui/src/contrast.test.ts`, and the
NH-118 change (`refresh-visual-identity`, design D2/D3/D5).

## D1. Scope: palette only

Keep Gantry Signage: flat panels, 2 px edges, state by shape (solid, dashed,
struck), pictograms, the departure board, Overpass, layout, copy, behavior and
radii. Only colour values, colour token names, and the colour assignments that
the new contrast rules force change. Anything else is out of scope (D13).

## D2. Palette and computed contrast

Ratios computed with the WCAG 2.1 relative-luminance formula, the same as
`packages/ui/src/contrast.test.ts`, by a throwaway Node script (not committed;
the committed proof is the updated `contrast.test.ts`).

| Token (name)        | Value     | Role                                              |
| ------------------- | --------- | ------------------------------------------------- |
| ink                 | `#1E1E1E` | text, edges, action fill, inverse (dark) panels   |
| paper               | `#F7F5F2` | canvas, light text on terracotta and ink          |
| stone               | `#E5E2DD` | inset surface, hover fill, disabled fill          |
| clay (terracotta)   | `#A8401F` | primary panel (hero, bands, accent badge)         |
| sage                | `#96A8A6` | secondary panel, background only                  |
| clay-light          | `#E58A64` | accent text/figures on ink only                   |

Terracotta is `#A8401F`, not the ticket's `#B84A27`: paper on `#B84A27` is 4.77
(barely passing) and terracotta on stone is 4.02 (fails); `#A8401F` gives 5.65 and
4.76. White is not part of the palette (D4).

| Pairing (foreground on background)         | Ratio | Requirement | Result       |
| ------------------------------------------ | ----- | ----------- | ------------ |
| ink on paper                               | 15.32 | text 4.5    | pass         |
| ink on stone                               | 12.90 | text 4.5    | pass         |
| ink on sage `#96A8A6`                      | 6.71  | text 4.5    | pass         |
| paper on clay `#A8401F`                    | 5.65  | text 4.5    | pass         |
| (white on clay, for reference)             | 6.14  | text 4.5    | pass, unused |
| paper on ink                               | 15.32 | text 4.5    | pass         |
| clay-light `#E58A64` on ink                | 6.47  | text 4.5    | pass         |
| clay on paper (text/link)                  | 5.65  | text 4.5    | pass         |
| clay on stone (text/link)                  | 4.76  | text 4.5    | pass         |
| fg-muted `#3F3B37` on paper                | 10.20 | text 4.5    | pass         |
| fg-muted on stone                          | 8.59  | text 4.5    | pass         |
| fg-subtle `#57534E` on paper               | 7.01  | text 4.5    | pass         |
| fg-subtle on stone                         | 5.91  | text 4.5    | pass         |
| border-muted `#6F6A63` on paper            | 4.93  | UI 3        | pass         |
| border-muted on stone                      | 4.15  | UI 3        | pass         |
| paper on action-hover `#333333`            | 11.61 | text 4.5    | pass         |
| success `#2F5F3E` on success-bg `#E4EEE5`  | 6.25  | text 4.5    | pass         |
| success on paper                           | 6.83  | text 4.5    | pass         |
| warning `#7A4A00` on warning-bg `#F6E7C1`  | 6.10  | text 4.5    | pass         |
| warning on paper                           | 6.87  | text 4.5    | pass         |
| danger `#9B1C2E` on danger-bg `#F8E1E0`    | 6.48  | text 4.5    | pass         |
| danger on paper                            | 7.42  | text 4.5    | pass         |
| paper on danger (filled destructive)       | 7.42  | text 4.5    | pass         |
| paper on danger-hover `#7E1625`            | 9.51  | text 4.5    | pass         |
| info `#1F4E79` on info-bg `#E1EBF3`        | 7.17  | text 4.5    | pass         |
| info on paper                              | 7.96  | text 4.5    | pass         |

Disallowed pairings (never used for text, asserted below 4.5 by the test so a
future edit cannot silently approve them):

| Pairing                         | Ratio | Why it matters                                   |
| ------------------------------- | ----- | ------------------------------------------------ |
| ink on clay                     | 2.71  | the old yellow-panel habit; ticket value was 3.21 |
| clay on ink                     | 2.71  | accent on dark panels uses clay-light instead    |
| sage on paper / paper on sage   | 2.28  | sage is never text or a line                     |
| sage on stone                   | 1.92  |                                                  |
| clay on sage                    | 2.47  |                                                  |
| clay-light on paper             | 2.37  | clay-light is for ink fields only                |
| clay-light on clay              | 2.38  | hover rows must switch text to paper             |
| paper on stone                  | 1.19  |                                                  |
| fg-muted on sage                | 4.47  | misses AA by 0.03; no muted text on sage         |

Consequence: panels are the pairing, not the use site. A clay panel carries
paper text; a sage panel carries ink text; an ink panel carries paper text with
clay-light for accents; paper and stone carry ink, muted, subtle.

## D3. Token naming (smallest migration that fails loudly)

Decision: rename the raw palette tokens and the two panel roles, keep every
other semantic role name.

- Removed: `signal`, `sign-green`, `black`, `white`, `surface.signal`,
  `surface.green`, and CSS vars `--signal`, `--sign-green`, `--black`,
  `--white`.
- Added: `clay`, `clay-light`, `sage`, `paper`, `stone`, `ink`; roles
  `surface.clay`, `surface.sage`, `surface.inset` (stone), `surface.DEFAULT`
  (paper), `surface.inverse` (ink); CSS vars `--clay`, `--clay-light`,
  `--sage`, `--paper`, `--stone`, `--ink`.
- Kept names, re-pointed values: `fg`, `fg-muted`, `fg-subtle`, `fg-inverse`
  (paper), `border`, `border-muted`, `action`, `action-hover`, `action-fg`
  (paper), `success`, `warning`, `danger`, `info` and their `bg`/`hover`
  variants. These are the supported API, so most consumers need no edit.
- Not chosen: keep `signal`/`sign-green`/`black`/`white` and only swap values.
  That is the smallest diff but lies about the colour (`bg-signal` would be
  terracotta) and would let a stale `text-fg` on a former yellow panel pass
  review, which the contrast numbers show is a failure (2.71). Renaming makes
  every site that mentions a panel colour a compile-visible edit.
- `terracotta` is deliberately not reused as a token name: NH-118 removed
  `terracotta-<n>` and its guard test and spec scenario still reference that
  scale. `ink` is reused only as a bare name (the old `ink-<n>` numeric scale
  stays forbidden; the existing regexes require a numeric suffix).
- Tailwind's built-in `white` and `black` still resolve even when removed from
  `theme.extend`, so removal alone does not fail loudly. A source-scan test
  forbids `-white`/`-black` colour utilities (including `bg-black/40` in
  `Modal.tsx` and `text-white` in `ErrorPage.tsx`, which are re-pointed to
  `bg-ink/40` and `text-fg-inverse`) and hex literals outside the preset and
  CSS variable block.

## D4. Is white still available?

No. Every use of white (cards, canvas, inverse text) maps to paper or stone. The
palette is closed at six colours plus the role tints. Pure white would only add
a seventh surface that clashes with warm paper; paper on clay already passes
(5.65). Revisit only if the product owner asks for a white card on paper.

## D5. Panel text inversion

Former yellow panels (`bg-signal` + ink text) become clay panels with paper
text. Sites to flip (from a source scan; the build/tests must confirm):
`HeroSection`, `CtaBandSection`, `LocationsSection`, `SearchPage` query band,
`WorkspaceSection` panel and marker, `HowItWorksSection` step tiles,
`FeaturedStaysSection` code tiles, `Badge` accent, `Layout` nav button
(`signalButton`), `ListingCard` hover, `::selection`.

- Controls on clay (city input, date fields) keep a paper fill with an ink edge:
  the control boundary is identified by paper vs clay (5.65), not by ink vs clay
  (2.71, below the 3:1 UI minimum).
- Former sign-green panels (`CoLivingSection`, `TestimonialSection`, the hero
  facts list) become sage with ink text; their `text-signal` pictogram and
  figures become ink.
- On ink panels (`Layout` nav, `HomeFooter`, departure board, stats, primary
  button) former `text-signal` accents become `text-clay-light`; hover rows that
  fill clay switch the text to paper (clay-light on clay is 2.38).
- Primary button: ink fill with paper lettering (was black with signal).
- Card hover fill: stone, not sage, because cards carry fg-subtle text and
  fg-muted/fg-subtle do not reach AA on sage (4.47 and 3.07). Departure-board
  row hover and destination-index hover use clay fill with paper text.
  Open question Q3.

## D6. Neutrals and role tokens

Warm-tinted neutrals replace the cool greys: `fg-muted` `#3F3B37`, `fg-subtle`
`#57534E`, `border-muted` `#6F6A63`, `action-hover` `#333333`, `surface.inset`
stone. Role tokens are redefined inside the warm palette (table in D2):
success `#2F5F3E`/`#E4EEE5` (a deep forest green, deliberately not sage so a
sage panel never reads as "success"), warning `#7A4A00`/`#F6E7C1`, danger
`#9B1C2E` (hover `#7E1625`)/`#F8E1E0`, info `#1F4E79`/`#E1EBF3`. Tints against
paper are about 1.1:1, so as in NH-118 they only appear inside badges and error
text that keep a 2 px edge; state stays carried by shape (D8).

## D7. Focus ring

Two layers as in NH-118, re-pointed (outline 3 px at 2 px offset, plus a 2 px
zero-blur gap shadow):

| Field          | Outline (`--focus`) | Gap (`--focus-gap`) | Outline vs field | Outline vs gap |
| -------------- | ------------------- | ------------------- | ---------------- | -------------- |
| paper          | ink                 | paper               | 15.32            | 15.32          |
| stone          | ink                 | paper               | 12.90            | 15.32          |
| sage           | ink                 | paper               | 6.71             | 15.32          |
| clay           | paper               | ink                 | 5.65             | 15.32          |
| ink            | paper               | ink                 | 15.32            | 15.32          |

Default is ink/paper; `[--focus:var(--paper)] [--focus-gap:var(--ink)]` on clay
and ink fields replaces today's `[--focus:var(--signal)]` on dark fields. Every
field keeps one layer at 4.5:1 or better, and both layers at 3:1 or better.
`contrast.test.ts` asserts the table, including that the gap CSS variable is
declared and used.

## D8. State by shape (unchanged)

Solid/dashed/struck grammar, disabled controls (dashed border on stone fill with
subdued text, struck tertiary) and Badge tones are unchanged in structure; only
their colour tokens re-point. Disabled text uses fg-subtle on stone (5.91).
Danger (crimson) and clay (orange-brown) are close in hue family, so shape, not
colour, keeps carrying error state; see risk in the proposal and Q4.

## D9. Accent for text on ink

Clay is 2.71:1 on ink, so the departure-board price, stat figures, footer
headings and nav email lose their brand accent unless a lighter tone exists.
One extra token, `clay-light` `#E58A64` (6.47:1 on ink), is proposed, strictly
for ink fields. The alternative is plain paper for those accents (no new
token, less brand colour). See Q2.

## D10. Hard-coded colour inventory

Found by repo scan; each is a task.

- `packages/ui/src/assets/{favicon,logo-mark,logo-wordmark,logo-wordmark-light}.svg`
  and `apps/web/public/favicon.svg` (manual copy) and the inline SVG in
  `apps/web/src/components/Logo.tsx`: `#FFC700` square and `#0A0A0A` arch/base
  become clay `#A8401F` square with a paper `#F7F5F2` arch and base (paper on
  clay 5.65; ink on clay would be 2.71); wordmark text ink `#1E1E1E` (light
  variant paper). Shapes and text paths are unchanged.
- `apps/web/src/components/DateRangePicker.tsx`: `--rdp-accent-color`
  `#2E4A3F` and `--rdp-accent-background-color` `#e8f0ed` are stale colours
  from the pre-NH-118 forest scale that NH-118 missed. They become clay
  `#A8401F` and stone `#E5E2DD` (selected-day paper text on clay 5.65).
- `apps/web/e2e/layout.spec.ts`: `SIGNAL_RGB = "rgb(255, 199, 0)"`, two
  assertions and two test titles ("signal yellow") become the clay RGB
  `rgb(168, 64, 31)` and "terracotta"; the `section.bg-signal` locator becomes
  `section.bg-clay`.
- `packages/ui/src/tokens.test.ts` and `contrast.test.ts`: hex and token names.
- `globals.css` `::selection` and box-shadow elevations in the preset
  (`0 1px 0 0 #0A0A0A` and similar): ink `#1E1E1E`.
- `Modal.tsx` (`bg-black/40`) and `ErrorPage.tsx` (`text-white`), see D3.
- Docs naming the old palette: `apps/web/DESIGN.md` (regenerated),
  `apps/web/.impeccable/surfaces/src-pages-homepage-tsx.md`, and any hit from a
  final `rg` over `README.md`, `docs/` and `openspec/project.md` (a prior scan
  found none for the hex values).

## D11. Verification plan

No new visual-regression baseline is added (same stance as NH-118 D6). The
contrast test is the hard gate; e2e `layout.spec.ts` keeps its screenshots and
RGB checks with new values. A manual Playwright MCP walk at 360 px and desktop
covers landing and search, including keyboard focus on a clay field and an ink
field, and the screenshots are stored in the change `reports/` folder.

## D12. Spec dependency on the NH-118 archive

The `MODIFIED` requirements in `specs/platform/spec.md` copy the text from the
NH-118 delta (`refresh-visual-identity`), because the NH-118 archive commit
(`chore/NH-118-archive-refresh-visual-identity`) was not on `origin/main` when this
change was written, so `openspec/specs/platform/spec.md` still carries the
pre-Gantry wording. `openspec archive warm-palette-swap` requires the NH-118
archive to be merged first; otherwise the "Brand colour pairings" and "Landing
and search" headers will not be found. If the archive merges with edits,
re-copy the final text before Gate 2.

## D13. Out of scope

Layout, copy, typography, spacing, radii, pictogram geometry, dark mode, new
state treatments, redesign of host/admin/booking/auth/listing-detail screens,
synthetic-content replacement, search API, `openspec/specs/search`, and any
colour work beyond the tokens listed here.

## D14. Mandatory-step applicability

This change touches no backend, API, schema or data. The DB-state steps and the
curl endpoint step from `docs/openspec-tasks-mandatory-steps.md` are therefore
N/A and are recorded as such in `tasks.md`; unit tests, the full unit suite,
Playwright E2E and documentation updates still apply.

## Open questions (need a human decision)

- Q1. Confirm terracotta `#A8401F` (darkened) instead of `#B84A27`, and sage
  `#96A8A6`, paper `#F7F5F2`, stone `#E5E2DD`, ink `#1E1E1E` as final values.
- Q2. Accept the extra accent `clay-light` `#E58A64` for text on ink (D9), or
  use plain paper for those accents?
- Q3. Card hover fill: stone (proposed) or sage with ink-only text? Board and
  destination-index hover use clay with paper text.
- Q4. Danger crimson `#9B1C2E` next to terracotta: acceptable, or move the error
  role to a more distinct hue? (Contrast is fine; this is a perception risk.)
- Q5. Pure white is dropped (D4); confirm no white surface is wanted.
- Q6. Light text on large terracotta panels replaces black-on-yellow
  "signal" contrast; confirm after seeing screenshots at Gate 3.
