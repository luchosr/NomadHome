# Design: listing-detail-identity

Ticket NH-126 (#126), follow-up of NH-125. Builds on `refresh-visual-identity`
(NH-118), `warm-palette-swap` (NH-129) and `auth-screens-identity` (NH-125).
Frontend only: no backend, schema, route, API, API-client, query, validation or
`t()` key change. The page is **Operate mode** (compare, decide, book), so
ambition shows as precision: one strong sign composition, exact pairings,
shape-coded state and complete accessibility, not extra decoration or features.

## Files in scope

| File                                                                     | Change                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `apps/web/src/pages/ListingDetailPage.tsx`                               | Restyle gallery, header, amenities, rating, booking panel, skeleton, not-found, error |
| `apps/web/src/pages/ListingDetailPage.test.tsx`                          | Extend (structure, headings, states, roles, dictionary unchanged)                     |
| `apps/web/e2e/listing-detail-identity.spec.ts` (new)                     | Computed colour, border style, sticky, layout and focus checks at 1440 and 360        |
| `apps/web/DESIGN.md`                                                     | Add the listing detail composition (what shipped)                                     |
| `apps/web/.impeccable/design.json`                                       | Sidecar: booking panel price band component entry                                     |
| `apps/web/.impeccable/surfaces/src-pages-listingdetailpage-tsx.md` (new) | Surface brief                                                                         |
| `openspec/changes/listing-detail-identity/reports/*`                     | Verification reports and screenshots                                                  |

Read but **not** changed: `packages/ui` primitives (`Button`, `Skeleton`,
`Badge`, `Card`), `DateRangePicker.tsx`, `Layout.tsx`, `AuthShell.tsx`,
`FormField.tsx`, `ServerErrorAlert.tsx`, `apps/web/src/api/*`, `en.ts`,
`apps/web/src/lib/listingData.ts`. The small pieces this page needs (type tag,
amenity tag, star glyph, state panel) are local to the page file: each is used
once, so no shared component or primitive export is created (scope defense).

## D1. Page layout at 1440 and 360

**Decision.** Keep the existing frame: the page lives in the `Layout` `<main>`
inside a `max-w-6xl px-4 py-8` wrapper (no second `main`, no band: the title
is the listing's own name, not a destination line to announce). Order is
gallery, then a two-column row on `md+` (content flex-1, booking panel
`md:w-96`), stacking to one column below `md` with the booking panel **after**
the content so reading order equals visual order.

- **1440 px.** Gallery full width of the 72rem wrapper; content left, booking
  panel right, sticky.
- **360 px.** One column, 16px gutters, no fixed widths, `min-w-0` on flex
  children, `break-words` on user-supplied strings (title, city, address,
  description, amenity labels). The booking panel is the last block, so a visitor
  reads the listing before the price band.

**Rationale.** Content and booking already share this order in the DOM; the
identity work changes surfaces, not structure, which keeps the existing
behaviour and tests intact and the diff reviewable.

| Option                                      | Verdict  | Why                                                                                                      |
| ------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| Keep frame, restyle surfaces (chosen)       | Chosen   | Zero behaviour risk, smallest diff, same reading order at every width                                    |
| Ember title band like Auth and Search       | Rejected | The page has no destination line to set; a band over a photo gallery fights the photo and the price band |
| Move price band above the gallery on mobile | Rejected | Reorders content for visual reasons only; breaks reading order and needs layout logic                    |

## D2. Gallery

- **Primary photo.** `border-2 border-border`, no radius (`rounded-none`),
  `w-full object-cover`, same max height as today (480px). `alt` stays the
  listing title.
- **Thumbnails.** Flat tiles, `h-16 w-24 sm:h-20 sm:w-32`, 2px ink edge, no
  radius, `object-cover`. They are **non-interactive**: no link, no button, no
  hover or focus state, no handler. The strip becomes `flex-wrap` (it was an
  `overflow-x-auto` scroller): a horizontally scrolling region is not
  keyboard-reachable without a tab stop, and wrapping removes it with no new
  behaviour. They are decorative (`alt=""` and `aria-hidden="true"`); the
  primary photo keeps the listing title as its `alt`.
- **No-photo placeholder.** A stone panel, `border-2 border-dashed
border-border`, same height as today (`h-64`), no radius, no text, no
  pictogram (no new asset or copy). Dashed = absent or tentative, the same shape
  grammar as the pending verify panel and the disabled button. The raw
  `bg-slate-100` goes away (it was outside the palette).

## D3. Header: type tag, title, departure-board row

- **Type tag.** A square tag: `inline-flex border-2 border-border
bg-surface-raised px-2 py-1 text-xs font-bold uppercase tracking-wide text-fg`.
  It is not the `Badge` primitive (that one is a pill; changing it is out of
  scope). Text is the existing `host.listings.type_*` strings.
- **Title.** The `h1` keeps its element and text; style becomes the Solid
  Setting rule: Overpass 900, `leading-[0.95]`, `tracking-[-0.03em]`,
  `text-balance break-words`, fluid size (`text-3xl` to `md:text-5xl`), ink.
- **Departure-board row.** One row under the title, ruled by 2px ink lines
  above and below (`border-y-2 border-border`). Cell 1: `city, country` as one
  text node (`{city}, {country}`), 16px bold ink. Cell 2: the address, 14px
  `fg-muted` (10.20 on paper). From `sm` the cells sit side by side divided by a
  2px ink vertical rule; below `sm` they stack divided by a 2px horizontal rule.
  No code, no invented field, no icon: the row states two facts the listing
  already has.

## D4. Description, amenities, rating, capacity

- **Description**: `fg-muted` on paper (10.20), `leading-relaxed`, capped near
  65ch (`max-w-prose`) so line length stays readable beside the panel.
- **Section headings** (`h2`: amenities, rating): 900 weight, 20px, ink, 8px
  under; same strings, same element.
- **Amenity tags.** A `<ul>` (list semantics; `list-none`, `m-0 p-0`) of `<li>`
  tags: `border-2 border-border bg-surface-raised px-3 py-1 text-sm font-bold
text-fg rounded-sm`, `flex-wrap gap-2`. Replaces `rounded-full bg-surface
text-fg-muted` (pill, and a surface equal to the canvas so it had no edge).
  The label is still `t(entry.labelKey)` or the raw code (existing behaviour,
  asserted by the existing test through `getByText("WIFI")`).
- **Rating.** A 20px authored star glyph (24 viewBox, ink fill, mitred joins,
  `aria-hidden`, `focusable=false`) precedes the existing text `{avg} / 5
({n} {reviews})`, in `fg-muted`. The no-reviews line stays `fg-subtle` on
  paper (7.01). The ⭐ literal is removed from the source; no `t()` string
  changes. The glyph is decorative: the text carries the value.
- **Capacity**: `fg-subtle` 14px on paper (7.01), unchanged text.

## D5. Booking panel

**Anatomy.** One paper panel, `border-2 border-border`, `rounded-card` (4px),
no shadow, no gradient, `bg-surface-raised`, `md:sticky md:top-24` (96px clears
the 58px sticky nav; the global scroll padding is 4.5rem). No `overflow:
hidden` (it would clip the two-layer focus ring and the picker popover).

- **Price band.** The first child: `border-b-2 border-border bg-ember text-fg`,
  padding 16px 20px, top corners `rounded-t-[2px]` (inner radius of the 4px
  card minus its 2px edge, so no ember bleeds past the edge). Price: Black,
  tabular numerals, `text-3xl`, ink. Unit (`search.per_night`): 16px **bold ink**,
  same line, wraps below the price if needed. Everything on the band is ink
  (4.81, large text at 30px and normal text at 16px bold both pass 4.5).
  **Never** paper text, `fg-muted` or `fg-subtle` on ember (3.19, 3.20, 2.20),
  never danger (2.33), never a control on the band.
- **Body.** Paper, 20px padding. Holds, unchanged and in the same order, the
  guest `DateRangePicker` and Book now, or the visitor Log in to book, or
  nothing for a host.
- **Controls unchanged.** `DateRangePicker` is out of scope (its visuals are a
  follow-up). Book now stays the primary `Button` in a `Link`; disabled Book
  now keeps the primitive's dashed stone look (subtle ink on stone 5.91, dashed
  edge 4.15). Log in to book stays the secondary `Button`. No handler, prop,
  URL, `setSearchParams` call or condition changes.
- **Sticky.** From `md` only. Below `md` the panel is static and last.

## D6. Loading skeleton

Same structure and `data-testid="listing-detail-skeleton"`, flat: every block
`rounded-none` (the `Skeleton` default is already `rounded-sm`; callers drop
`rounded-xl` and `rounded-pill`), the booking placeholder is a 2px ink-edged
panel with no shadow, the gallery block keeps its heights. The container gets
`aria-busy="true"`. It has no text, so it has no heading (no copy to use).
Pulse stays disabled under reduced motion (primitive behaviour).

## D7. Not-found and error states: sign panels

Both render in the same `max-w-6xl px-4 py-8` wrapper with one centred
panel (`max-w-[36rem]`, `mx-auto`, min-w-0), 2px edge, 4px radius, no shadow, a
48px tile and the message set as the `h1`.

| State     | Panel                                     | Tile (48px, 2px edge, glyph on a 24 grid, 3-unit strokes, square caps)         | Heading (`h1`, existing string)          | Roles                         |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------- |
| not-found | **solid paper**, 2px ink edge             | **Solid ink fill**, paper empty-frame glyph (a square outline: "nothing here") | `listings.detail.not_found`, ink, 900    | none (a page state, not live) |
| error     | `bg-danger-bg`, 2px **solid danger** edge | **Filled danger** tile, paper exclamation (as `ServerErrorAlert`)              | `error.generic.unexpected`, danger, bold | `role="alert"` on the panel   |

- Not-found is a destination state, not a failure of the system: ink and paper,
  no danger. Error follows the NH-125 `ServerErrorAlert` grammar (solid danger
  edge, tint fill, filled tile, danger text on the tint 6.48) so the same
  failure reads the same on every screen. Shape differs without colour: paper
  panel with an ink tile vs tinted panel with a danger tile and a "!" glyph.
- The `h1` replaces the bare `<p>` in both: **exactly one `h1` per state**,
  using the existing strings (no copy added). Loading has no `h1` (no text);
  the loaded state has the listing title as its only `h1`.
- The error panel keeps its current trigger (`error || !listing`, non-404) and
  its single `role="alert"`; text identical. Danger never sits on ember (it is
  not on an ember surface here at all).

## D8. Accessibility, 360 px and motion checklist

- One `h1` per state; `h2`s for amenities and rating stay; no skipped levels.
- Decorative glyphs (`star`, tile glyphs) are `aria-hidden`; no information is
  carried by them alone.
- Tags, rows and panels are ink-edged; state is never colour alone (placeholder
  dashed, error tile filled with "!", disabled button dashed).
- Focus order equals DOM equals visual order: picker, Book now (or the login
  link), nothing else on the page is interactive (thumbnails are not).
  Two-layer global focus ring everywhere; the ring is never clipped (no
  `overflow-hidden`).
- Target sizes: unchanged `Button` primitive (about 46px tall).
- 360 px: single column, no horizontal scroll in loading, loaded (with long
  title, city, address, description, amenity label), no-photo, not-found and
  error states; asserted in e2e.
- Reduced motion: no animation added; skeleton pulse is already disabled under
  `prefers-reduced-motion`; transitions are colour only.
- Touch: no hover-only information.

## D9. Existing affordances kept; scope defense

The page has: a photo gallery (display only), listing facts, amenities, rating
text, a booking panel with a picker and one of three CTA branches. None gains a
feature: no thumbnail selection or lightbox, no map, no share or save, no
reviews list, no host card, no sticky mobile CTA, no price breakdown. Role
branching (`guest`, `host`/other, visitor, `authLoading`) is untouched.

## D10. Copy

No `t()` key is added, removed or renamed and no string value changes. The
emoji removal affects a literal in the page, not the dictionary. A unit test
snapshots the keys this page reads (`listings.detail.*`, `host.listings.type_*`,
`search.per_night`, `error.generic.unexpected`) as literals and asserts they are
identical to baseline. **Copy changes: none.**

## D11. Test strategy (TDD)

- **Unit (Vitest + Testing Library), red first**, in `ListingDetailPage.test.tsx`:
  loaded state has exactly one `h1` (the title) and the `h2`s; the type tag,
  city/country text and address render; amenities render as a list of tags
  (`getAllByRole("listitem")`); the star glyph is `aria-hidden` and the emoji is
  absent; rating text unchanged; thumbnails are not links or buttons and have
  no handlers (no `role` of link or button among images); no-photo renders the
  dashed placeholder class set; primary photo has the ink edge and no radius
  class; booking panel contains the price band and the CTA branches per role
  exactly as before; not-found has one `h1` with the string and no alert; error
  has one `h1` inside the single `role="alert"`; loading has no `h1` and keeps
  its test id; dictionary keys unchanged. Class-based assertions stand in for
  computed style (jsdom does not compute Tailwind); e2e complements them.
- **E2E (Playwright, mocked API)** in `listing-detail-identity.spec.ts`,
  patterned on `layout.spec.ts`: at 1440x900 and 360x800 mock
  `GET /listings/:id` and `/listings/:id/blocked-dates` and assert the primary
  photo border width 2px and radius 0; placeholder `border-style: dashed` and
  stone background; the type tag border 2px; the `h1` font family includes
  Overpass and weight 900; amenity tag border width 2px and radius not 9999px;
  price band background `rgb(230, 95, 53)` with the computed colour of every
  text node in it equal to ink; panel border 2px, no box-shadow; sticky from
  `md` (position `sticky`, stays in viewport after scrolling) and static at 360;
  booking panel after the content at 360 (its top is below the description's
  bottom); not-found and error states (404 and 500) each have one `h1`, the
  error panel carries `role="alert"`, danger edge and tint; no horizontal
  overflow at 360 for loaded (long strings), no-photo, not-found and error;
  keyboard focus shows the 3px ink outline on Book now (guest with dates) and
  the login link (visitor).
- Screenshots are attached to the report as artifacts, never compared (same
  policy as `layout.spec.ts`).

## D12. Surface brief and DESIGN.md

Write `apps/web/.impeccable/surfaces/src-pages-listingdetailpage-tsx.md` in the
format of the homepage brief (frontmatter `version`, `slug`, `primary_target`,
`related_targets: []`; sections for scope and mode, audience/job/action/proof/
constraints, direction contract with THESIS, OWN-WORLD, STORY, FIRST VIEWPORT,
FORM, FINISH, palette note, unresolved decisions). Extend `DESIGN.md`:
Components gets "Listing detail" (gallery frame, placeholder, type tag, board
row, amenity tags, star glyph, booking panel with ember price band, state
panels), the Do/Don't list gets "price on ember is ink" and "stone dashed panel
for absent media". No palette or token change.

## Computed contrast table

Script (same WCAG 2.1 formula as `packages/ui/src/contrast.test.ts`; embedded so
the table is auditable):

```js
function lum(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
```

Palette: ink #1E1E1E, paper #F7F5F2, stone #E5E2DD, ember #E65F35, danger
#9B1C2E, danger-bg #F8E1E0, fg-muted #3F3B37, fg-subtle #57534E, border-muted
#6F6A63.

| ID  | Pairing (where on this page)                                        | Colours           | Ratio | Needs | Result                       |
| --- | ------------------------------------------------------------------- | ----------------- | ----- | ----- | ---------------------------- |
| L1  | Ink on ember: price (30px Black, large text)                        | #1E1E1E / #E65F35 | 4.81  | 3     | pass                         |
| L2  | Ink on ember: "/ night" unit (16px bold, normal text)               | #1E1E1E / #E65F35 | 4.81  | 4.5   | pass                         |
| L3  | Ink edge on ember: price band bottom rule (non-text)                | #1E1E1E / #E65F35 | 4.81  | 3     | pass                         |
| L4  | Ink on paper: title, tags, city/country, headings, panel body       | #1E1E1E / #F7F5F2 | 15.32 | 4.5   | pass                         |
| L5  | Muted ink on paper: description, address, rating text               | #3F3B37 / #F7F5F2 | 10.20 | 4.5   | pass                         |
| L6  | Subtle ink on paper: capacity, "no reviews" line                    | #57534E / #F7F5F2 | 7.01  | 4.5   | pass                         |
| L7  | Ink edge on paper: photo, thumbnails, tags, panel, board rules      | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| L8  | Ink dashed edge on stone: no-photo placeholder (non-text)           | #1E1E1E / #E5E2DD | 12.90 | 3     | pass                         |
| L9  | Ink star glyph on paper (decorative, non-text)                      | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| L10 | Paper on ink: primary Book now label and its ink fill               | #F7F5F2 / #1E1E1E | 15.32 | 4.5   | pass                         |
| L11 | Subtle ink on stone: disabled Book now label                        | #57534E / #E5E2DD | 5.91  | 4.5   | pass                         |
| L12 | Muted edge on stone: disabled Book now dashed edge (non-text)       | #6F6A63 / #E5E2DD | 4.15  | 3     | pass                         |
| L13 | Ink on stone: secondary-button hover fill (Log in to book)          | #1E1E1E / #E5E2DD | 12.90 | 4.5   | pass                         |
| L14 | Paper empty-frame glyph on ink tile (not-found tile)                | #F7F5F2 / #1E1E1E | 15.32 | 3     | pass                         |
| L15 | Danger on danger-bg: error heading text (bold)                      | #9B1C2E / #F8E1E0 | 6.48  | 4.5   | pass                         |
| L16 | Danger edge against paper: error panel outer edge (non-text)        | #9B1C2E / #F7F5F2 | 7.42  | 3     | pass                         |
| L17 | Danger edge against danger-bg: error panel inner side (non-text)    | #9B1C2E / #F8E1E0 | 6.48  | 3     | pass                         |
| L18 | Paper "!" mark on danger tile                                       | #F7F5F2 / #9B1C2E | 7.42  | 3     | pass                         |
| L19 | Ink focus outline on ember (nothing focusable on the band; kept)    | #1E1E1E / #E65F35 | 4.81  | 3     | pass                         |
| L20 | Ink focus outline on paper and stone (Book now, login link, picker) | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| N1  | Not used: paper text on ember (price band)                          | #F7F5F2 / #E65F35 | 3.19  | 4.5   | fails, so never placed there |
| N2  | Not used: muted ink on ember                                        | #3F3B37 / #E65F35 | 3.20  | 4.5   | fails, so never placed there |
| N3  | Not used: subtle ink on ember                                       | #57534E / #E65F35 | 2.20  | 4.5   | fails, so never placed there |
| N4  | Not used: danger on ember                                           | #9B1C2E / #E65F35 | 2.33  | 4.5   | fails, so never placed there |

Notes: N2 uses the value in `DESIGN.md` (3.20). The raw `bg-slate-100` placeholder it replaces was outside
the palette and is removed. No new colour value is introduced.

## Divergences from plan (as shipped)

- Booking panel body padding is `p-4 sm:p-5` (16px, 20px from sm), not a flat 20px, so the panel body keeps room for the picker at 360 px.
- The `DateRangePicker` is wrapped in a div that overrides `--rdp-day-width` and `--rdp-day_button-width` on `.rdp-root` below `sm` (40px and 38px; 44px and 42px from `sm`), so seven day columns fit the 360 px panel. The picker component itself is unchanged.
- Log in to book carries `border-2 ![box-shadow:none]` on the secondary `Button`. `ring-0` still produced a composed box-shadow that tripped the no-shadow e2e assertion. A proper `Button` variant is a follow-up.
- The gallery wrapper (frame, thumbnails and the dashed placeholder) uses `mb-6`.

## Risks

| Risk                                                              | Mitigation                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Price band text drifts to a muted or paper colour in a later edit | Computed-colour e2e on every text node in the band; contrast table N1 to N3                |
| Sticky panel overlaps nav or hides the picker popover             | `top-24`, no `overflow-hidden`, e2e scroll check, visual check of an open picker           |
| `DateRangePicker` looks dated next to the new panel               | Out of scope; screenshot recorded; follow-up                                               |
| Class-name unit assertions rot with Tailwind refactors            | Assert roles and structure first; classes only for shape cues; e2e asserts computed values |
| Wrapping thumbnails grows the page on photo-heavy listings at 360 | Thumbnails are small (64x96); acceptable; revisit with the gallery follow-up               |
| `Link` wrapping `Button` (nested interactive) stays               | Pre-existing, behaviour-bearing; recorded as follow-up, not changed here                   |

## Open points

None blocking. Recorded follow-ups (not in scope):

- Gallery interaction: selecting a thumbnail or opening a lightbox, with
  keyboard support. Thumbnails are decorative (alt empty, aria-hidden); gallery
  interaction would need distinct alt text and copy.
- `DateRangePicker` visual pass on the sign-panel grammar.
- Book now and Log in to book render a `Button` inside a `Link` (interactive
  content nested in an anchor); replace with a link styled as the primary or
  secondary button, as `VerifyEmailPage` does. Tracked in a follow-up issue,
  together with the `Button` shadow override below.
- The `listings` spec mentions guest reviews on the page; only the count is
  rendered today.
- `DateRangePicker` still shows the default react-day-picker blue for today, the
  nav chevrons and the selected range. Its `--rdp-*` overrides in
  `DateRangePicker.tsx` sit on a wrapper that `.rdp-root` re-declares; scope
  them to `.rdp-root` with ember and ink tokens, and capture an explicit
  selected-range state.
- Centre the picker (`mx-auto`) inside the booking panel.
- Add a `Button` variant so Log in to book needs no `border-2 ![box-shadow:none]`
  override.
- `Link > Button` leaves a double tab stop (pre-existing).
- Optional heavier stroke for the error "!" glyph in the state tile.
