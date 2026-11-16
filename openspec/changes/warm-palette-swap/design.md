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

| Token | Value     | Role                                                            |
| ----- | --------- | --------------------------------------------------------------- |
| ink   | `#1E1E1E` | text, edges, action fill, inverse (dark) panels                 |
| paper | `#F7F5F2` | canvas, text on ink, control fill on orange                     |
| stone | `#E5E2DD` | inset surface, card hover fill, disabled fill                   |
| ember | `#E65F35` | primary panel (hero, bands, accent badge); orange accent on ink |
| sage  | `#96A8A6` | secondary panel, background only                                |

Orange is the user's decision (`#E65F35`, chosen after a comparison with a
darkened terracotta). There is no separate light accent: orange on ink is 4.81:1.

Approved pairings:

| Pairing (foreground on background)        | Ratio | Requirement | Result     |
| ----------------------------------------- | ----- | ----------- | ---------- |
| ink on paper                              | 15.32 | text 4.5    | pass       |
| ink on stone                              | 12.90 | text 4.5    | pass       |
| ink on sage `#96A8A6`                     | 6.71  | text 4.5    | pass       |
| ink on ember `#E65F35`                    | 4.81  | text 4.5    | pass       |
| ink edge (2 px) on ember                  | 4.81  | UI 3        | pass       |
| paper on ink                              | 15.32 | text 4.5    | pass       |
| ember on ink (accent text, 18 px bold up) | 4.81  | text 4.5    | pass, thin |
| fg-muted `#3F3B37` on paper               | 10.20 | text 4.5    | pass       |
| fg-muted on stone                         | 8.59  | text 4.5    | pass       |
| fg-subtle `#57534E` on paper              | 7.01  | text 4.5    | pass       |
| fg-subtle on stone                        | 5.91  | text 4.5    | pass       |
| border-muted `#6F6A63` on paper           | 4.93  | UI 3        | pass       |
| border-muted on stone                     | 4.15  | UI 3        | pass       |
| paper on action-hover `#333333`           | 11.61 | text 4.5    | pass       |
| success `#2F5F3E` on success-bg `#E4EEE5` | 6.25  | text 4.5    | pass       |
| success on paper                          | 6.83  | text 4.5    | pass       |
| warning `#7A4A00` on warning-bg `#F6E7C1` | 6.10  | text 4.5    | pass       |
| warning on paper                          | 6.87  | text 4.5    | pass       |
| danger `#9B1C2E` on danger-bg `#F8E1E0`   | 6.48  | text 4.5    | pass       |
| danger on paper                           | 7.42  | text 4.5    | pass       |
| paper on danger (filled destructive)      | 7.42  | text 4.5    | pass       |
| paper on danger-hover `#7E1625`           | 9.51  | text 4.5    | pass       |
| info `#1F4E79` on info-bg `#E1EBF3`       | 7.17  | text 4.5    | pass       |
| info on paper                             | 7.96  | text 4.5    | pass       |

Disallowed pairings (never used for text or lines; the test asserts each is
below 4.5 so a future edit cannot silently approve them):

| Pairing                         | Ratio | Why it matters                                                          |
| ------------------------------- | ----- | ----------------------------------------------------------------------- |
| paper on ember                  | 3.19  | the habit from the first (terracotta) draft; light text on orange fails |
| ember on paper                  | 3.19  | orange is never text or a link colour on paper                          |
| ember on stone / stone on ember | 2.69  |                                                                         |
| white on ember                  | 3.47  | white is not in the palette and does not fix it                         |
| ember on sage / sage on ember   | 1.40  |                                                                         |
| sage on paper / paper on sage   | 2.28  | sage is never text or a line                                            |
| sage on stone                   | 1.92  |                                                                         |
| fg-muted on ember               | 3.20  | muted text on orange is forbidden                                       |
| fg-subtle on ember              | 2.20  | the NH-118 hero placeholder; fails here                                 |
| danger on ember                 | 2.33  | no error text on orange panels                                          |
| ember on danger-bg              | 2.78  |                                                                         |
| fg-muted on sage                | 4.47  | misses AA by 0.03; no muted text on sage                                |
| paper on stone                  | 1.19  |                                                                         |

Consequence: the panel is the pairing. An orange panel carries ink text and ink
2 px edges; a sage panel carries ink text; an ink panel carries paper text, with
orange allowed for large accents; paper and stone carry ink, muted, subtle.

## D3. Token naming (smallest migration that fails loudly)

Decision: rename the raw palette tokens and the two panel roles, keep every other
semantic role name.

- Removed: `signal`, `sign-green`, `black`, `white`, `surface.signal`,
  `surface.green`, and CSS vars `--signal`, `--sign-green`, `--black`, `--white`.
- Added: `ember`, `sage`, `paper`, `stone`, `ink`; roles `surface.ember`,
  `surface.sage`, `surface.inset` (stone), `surface.DEFAULT` (paper),
  `surface.inverse` (ink); CSS vars `--ember`, `--sage`, `--paper`, `--stone`,
  `--ink`.
- Kept names, re-pointed values: `fg`, `fg-muted`, `fg-subtle`, `fg-inverse`
  (paper), `border`, `border-muted`, `action`, `action-hover`, `action-fg`
  (paper), `success`, `warning`, `danger`, `info` and their `bg`/`hover` variants.
- Why `ember` and not `orange`: Tailwind ships a built-in `orange` scale, and an
  `extend.colors.orange` string would shadow it and make `orange-500` and friends
  silently undefined for anyone who reaches for them. `ember` names the colour
  without colliding with the default palette, and no old scale (`sand`, `ink-n`,
  `forest`, `terracotta-n`) uses it.
- Why not keep `signal`: the name would lie (`bg-signal` is orange, a "signal"
  that is not yellow) and would let stale usages pass review. Renaming makes
  every site that names a panel colour a visible edit. It is not a contrast
  trap this time (ink text stays on the orange panel), so this is chosen for
  honesty and loudness, not safety.
- `ink` is reused only as a bare name; the old `ink-<n>` numeric scale stays
  forbidden (existing regexes need a numeric suffix). `terracotta` is not reused.
- Tailwind's built-in `white` and `black` still resolve when removed from
  `theme.extend`, so removal alone does not fail loudly. A source-scan test
  forbids `-white`/`-black` colour utilities (including `bg-black/40` in
  `Modal.tsx` and `text-white` in `ErrorPage.tsx`, re-pointed to `bg-ink/40` and
  `text-fg-inverse`) and hex literals outside the preset and CSS variable block.

## D4. White

White is not part of the palette (white on ember is 3.47, so it would not fix
anything). Every white use maps to paper or stone. Revisit only if the product
owner asks for a white card on paper (Q5).

## D5. Panel text rules and sites to change

Former yellow panels keep ink text, so `text-fg` stays. What changes:

- **Hero city input** (`HeroSection.tsx`): a transparent field with
  `placeholder:text-fg-subtle` on orange is 2.20:1. Requirement: either a
  paper-filled field (fg-subtle on paper 7.01) or `placeholder:text-fg` (ink on
  orange 4.81). The stay-length "empty" state and date placeholders use
  `text-fg-muted`/`text-fg-subtle`; they sit in the paper `bg-surface` panel so
  they stay at 10.20 and 7.01. Nothing in an orange panel may use fg-muted or
  fg-subtle.
- **Controls on orange** keep a paper fill with ink text and an ink edge.
- **Former green panels** (`CoLivingSection`, `TestimonialSection`, the hero facts
  list) become sage with ink text: `text-fg-inverse` becomes `text-fg`, and
  pictogram/figure `text-signal` becomes `text-fg`.
- **Ink panels** (`Layout` nav, `HomeFooter`, departure board, stats, primary
  button): former `text-signal` accents become `text-ember` only at 18 px bold or
  larger (prices, stat figures, footer headings); smaller text on ink (nav email,
  mobile menu email) uses paper. Ember on ink is 4.81:1: passing but thin.
  Primary button: ink fill, paper lettering.
- **Hover**: departure-board rows and destination-index rows fill orange with ink
  text (4.81); the price text on a hovering row switches from ember to ink.
  Listing-card hover fill is stone, not orange or sage, because cards hold
  fg-subtle text (2.20 on orange, 3.07 on sage). Open question Q2.
- **Nav button** (`signalButton`, renamed): orange fill, ink text, hover paper.
- `::selection`: ember background with ink text (4.81).
- Accent `Badge`: ember fill, ink text, ink edge.

## D6. Neutrals and role tokens

Warm-tinted neutrals replace the cool greys: `fg-muted` `#3F3B37`, `fg-subtle`
`#57534E`, `border-muted` `#6F6A63`, `action-hover` `#333333`, `surface.inset`
stone. Role tokens are redefined inside the warm palette (table in D2): success
`#2F5F3E`/`#E4EEE5` (deep green, deliberately not sage so a sage panel never
reads as success), warning `#7A4A00`/`#F6E7C1`, danger `#9B1C2E` (hover
`#7E1625`)/`#F8E1E0`, info `#1F4E79`/`#E1EBF3`. Tints against paper are about
1.1:1, so as in NH-118 they only appear inside badges and error text that keep a
2 px edge.

Danger vs orange: hue 351 (crimson) vs 14 (orange), 23 degrees apart, and danger
on orange is 2.33:1, so error text and destructive buttons never sit on an
orange panel; errors render in paper-filled areas. Contrast is not the
issue (danger is far darker than ember); perception on adjacent surfaces is, and
state stays carried by shape (solid plus struck). Open question Q3.

## D7. Focus ring

Two layers as in NH-118: 3 px outline at 2 px offset plus a 2 px zero-blur gap
shadow, re-pointed:

| Field | Outline (`--focus`) | Gap (`--focus-gap`) | Outline vs field | Outline vs gap | Gap vs field            |
| ----- | ------------------- | ------------------- | ---------------- | -------------- | ----------------------- |
| paper | ink                 | paper               | 15.32            | 15.32          | n/a (same)              |
| stone | ink                 | paper               | 12.90            | 15.32          | 1.19 (decorative layer) |
| sage  | ink                 | paper               | 6.71             | 15.32          | 2.28 (decorative layer) |
| ember | ink                 | paper               | 4.81             | 15.32          | 3.19                    |
| ink   | paper               | ink                 | 15.32            | 15.32          | n/a (same)              |

Default is ink/paper, so orange needs no override. Ink fields override with
`[--focus:var(--paper)] [--focus-gap:var(--ink)]` (replacing today's
`[--focus:var(--signal)]`). An ember outline on ink with an ink gap also works
(4.81 against both) but paper is chosen for headroom (15.32). On every field one
layer reaches at least 4.81:1 against its neighbour and the outline is always at
least 4.5:1, so the ring clears the 3:1 UI minimum with margin. The gap column is
a visual separator only; the outline is the compliant layer. `contrast.test.ts`
asserts the table and that the gap variable is declared and used.

## D8. State by shape (unchanged)

Solid/dashed/struck grammar, disabled controls (dashed border on stone fill with
subdued text, struck tertiary) and Badge tones are unchanged in structure; only
colour tokens re-point. Disabled text uses fg-subtle on stone (5.91).

## D9. No extra accent token

The first draft proposed a lighter accent for text on ink. With orange, ember on
ink is already 4.81:1, so no extra token is added. The thin margin is handled by
the size rule in D5 (orange text on ink at 18 px bold or larger; smaller text
uses paper).

## D10. Hard-coded colour inventory

Found by repo scan; each is a task.

- `packages/ui/src/assets/{favicon,logo-mark,logo-wordmark,logo-wordmark-light}.svg`,
  `apps/web/public/favicon.svg` (manual copy) and the inline SVG in
  `apps/web/src/components/Logo.tsx`: `#FFC700` becomes ember `#E65F35`;
  `#0A0A0A` arch/base becomes ink `#1E1E1E` (ink on ember 4.81 is above the 3:1
  graphical-object minimum); wordmark text ink, light variant paper. Shapes and
  paths unchanged.
- `apps/web/src/components/DateRangePicker.tsx`: `--rdp-accent-color` `#2E4A3F`
  and `--rdp-accent-background-color` `#e8f0ed` are stale colours from the
  pre-NH-118 forest scale that NH-118 missed. They become ember `#E65F35` and
  stone `#E5E2DD`. The selected-day text must be ink (paper on ember is 3.19), so
  the task must check what colour the picker draws and override it if needed.
- `apps/web/e2e/layout.spec.ts`: `SIGNAL_RGB = "rgb(255, 199, 0)"`, two
  assertions and two test titles ("signal yellow") become `rgb(230, 95, 53)` and
  "orange"; the `section.bg-signal` locator becomes `section.bg-ember`.
- `packages/ui/src/tokens.test.ts` and `contrast.test.ts`: hex and token names.
- `globals.css` `::selection` and the preset box-shadow elevations
  (`0 1px 0 0 #0A0A0A` and similar): ink `#1E1E1E`.
- `Modal.tsx` (`bg-black/40`) and `ErrorPage.tsx` (`text-white`), see D3.
- Docs naming the old palette: `apps/web/DESIGN.md` (regenerated),
  `apps/web/.impeccable/surfaces/src-pages-homepage-tsx.md`, and any hit from a
  final `rg` over `README.md`, `docs/` and `openspec/project.md`.

## D11. Verification plan

No new visual-regression baseline (same stance as NH-118 D6). The contrast test is
the hard gate; e2e `layout.spec.ts` keeps its screenshots and RGB checks with new
values. A manual Playwright MCP walk at 360 px and desktop covers landing and
search, including the hero placeholder, keyboard focus on an orange field and an
ink field, and hover rows; screenshots go in the change `reports/` folder.

## D12. Spec dependency on the NH-118 archive

The `MODIFIED` requirements copy the text from the NH-118 delta
(`refresh-visual-identity`), because the NH-118 archive commit
(`chore/NH-118-archive-refresh-visual-identity`) was not on `origin/main` when this
change was written, so `openspec/specs/platform/spec.md` still carries pre-Gantry
wording. `openspec archive warm-palette-swap` requires the NH-118 archive to be
merged first; otherwise the "Brand colour pairings" and "Landing and search"
headers will not be found. If that archive merges with edits, re-copy the text
before Gate 2.

## D13. Out of scope

Layout, copy, typography, spacing, radii, pictogram geometry, dark mode, new state
treatments, redesign of host/admin/booking/auth/listing-detail screens,
synthetic-content replacement, search API, `openspec/specs/search`, and any
colour work beyond the tokens listed here.

## D14. Mandatory-step applicability

This change touches no backend, API, schema or data. The DB-state steps and the
curl endpoint step from `docs/openspec-tasks-mandatory-steps.md` are therefore N/A
and are recorded as such in `tasks.md`; unit tests, the full unit suite,
Playwright E2E and documentation updates still apply.

## Open questions (need a human decision)

- Q1. Settled: accent is orange `#E65F35` with ink text, decided by the user
  after a comparison. Sage `#96A8A6`, paper `#F7F5F2`, stone `#E5E2DD` and ink
  `#1E1E1E` are taken as final unless the user says otherwise.
- Q2. DECISION: listing-card hover fill is stone with ink text. Board rows and
  destination-index rows keep their own hover fills (see the accepted notes).
- Q3. DECISION: danger crimson `#9B1C2E` is accepted, with the rule that danger
  text and destructive buttons never sit on an orange panel (D6).
- Q4. DECISION: sage is used sparingly (co-living field, testimonial field, hero
  facts list) and never as a bare block: it always has an ink panel or a paper
  card on it.
- Q5. DECISION: no white surface (D4). Every light surface is paper or stone.
- Q6. DECISION: the look is confirmed, including ember accents on ink at 4.81:1,
  through the independent finish review (disposition `ship`) and the focus and
  hover verification report
  (`reports/2026-11-17-focus-hover-verification.md`).

## Accepted notes at the finish review

Recorded as accepted, not defects:

- Destination-index rows hover to ink with paper text, not orange, because the
  band is already orange (an orange hover would be invisible).
- The hero 0-nights numeral is fg-subtle on paper (7.01) and may be quieted later.
- The hero city placeholder is the same ink as typed text (4.81 on ember); the
  dashed underline tells them apart (D5 option). A paper-filled field is the
  alternative if this is revisited.
- On hovered board rows the accent badge keeps only its ink outline.
- The date-input native calendar icon keeps Chrome's native focus ring (not
  measured numerically, not tokenised).
- The Filters toggle and panel Close use `ring-1 ring-inset`, which replaces the
  gap layer, so only the outline layer shows; it still passes (ink on ember 4.81,
  ink on paper 15.32).
- The error state was not visually captured; it is covered by unit tests and the
  role pairings in `contrast.test.ts`.
- Pre-existing and unrelated: the e2e `us-4.1-booking.spec.ts` hardcodes
  `localhost:5173` in a mocked checkout URL. Follow-up, not part of this change.
