# Design: host-identity

Ticket NH-122 (#122). Follow-up of `refresh-visual-identity` (NH-118) D9, which
deferred the host screens. Builds on `warm-palette-swap` (NH-129),
`auth-screens-identity` (NH-125), `listing-detail-identity` (NH-126) and
`booking-payment-identity` (NH-124). Frontend only: no backend, schema, route,
API, API-client, query, mutation, validation or `t()` key change, and no
`packages/ui` change. `EmptyState` and `Modal` are untouched. These screens are
**Operate mode** (scan my listings, read a status, fill a long form, upload,
block dates), so ambition shows as precision: one clear column per screen,
shape-coded status, a consistent field grammar and complete accessibility, not
extra decoration or features.

## Files in scope

| File                                                                    | Change                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `apps/web/src/pages/HostListingsPage.tsx`                               | Black `h1`, link CTAs, flat rows, framed thumb or pictogram tile, states        |
| `apps/web/src/pages/HostUpcomingPage.tsx`                               | Black `h1`, flat table, local booking status tag, flat skeleton, error panel    |
| `apps/web/src/pages/CreateListingPage.tsx`                              | Black `h1`                                                                      |
| `apps/web/src/pages/EditListingPage.tsx`                                | Black `h1`, `ListingStatusTag`, `ServerErrorAlert`, flat skeleton, error panel  |
| `apps/web/src/pages/BecomeHostPage.tsx`                                 | Black `h1`, square 44px terms checkbox, left-bar terms error                    |
| `apps/web/src/components/CreateListingForm.tsx`                         | `FormField` per field, shared field classes, left-bar hints, `ServerErrorAlert` |
| `apps/web/src/components/ListingDetailsForm.tsx`                        | Shared field classes, bold labels, `AmenityCheckboxGrid`, `ServerErrorAlert`    |
| `apps/web/src/components/ListingPhotosCard.tsx`                         | Bold `h2`, square framed photos, `ServerErrorAlert` replaces `text-red-600`     |
| `apps/web/src/components/ListingAvailabilityCard.tsx`                   | Bold `h2`, flat 2px rows, bold labels, `ServerErrorAlert`                       |
| `apps/web/src/components/AmenityCheckboxGrid.tsx`                       | Square 2px real checkbox, check glyph, 44px target                              |
| `apps/web/src/components/ListingStatusTag.tsx` (new)                    | Shared listing status tag (D2)                                                  |
| `apps/web/src/components/listingFormStyles.ts` (new)                    | Shared field-class constants (D2)                                               |
| Page and component tests (`*.test.tsx` next to each file, two new)      | Extend (structure, roles, states, classes, dictionary unchanged)                |
| `apps/web/e2e/host-identity.spec.ts` (new)                              | Computed colour, border style, layout and focus checks at 1440 and 360          |
| `apps/web/DESIGN.md`                                                    | Add the "Host dashboard and listing forms" composition (what shipped)           |
| `apps/web/.impeccable/surfaces/src-pages-hostlistingspage-tsx.md` (new) | Surface brief                                                                   |
| `openspec/changes/host-identity/reports/*`                              | Verification reports and screenshots                                            |

Read but **not** changed: `packages/ui` (`Button`, `Input`, `Card`, `Badge`,
`Skeleton`, `Pictogram`), `EmptyState.tsx`, `Modal.tsx`, `FormField.tsx`,
`ServerErrorAlert.tsx`, `GroupedSelect.tsx`, `PageWrapper.tsx`,
`MyBookingsPage.tsx`, `ListingDetailPage.tsx`, the hooks (`useCreateListing`,
`useEditListing`, `useListingPhotos`, `useListingAvailability`),
`apps/web/src/api/*`, `apps/web/src/lib/*`, `en.ts`.

## D1. Local constants per file

Each file declares the pieces only it uses at module top, as
`ListingDetailPage`, `VerifyEmailPage` and the booking pages already do:

```
CTA_BASE      = inline-flex min-h-11 items-center justify-center rounded-sm border-2 px-[22px] py-[14px] text-sm font-bold no-underline transition-colors duration-med ease-out active:translate-y-px
PRIMARY_CTA   = CTA_BASE border-border bg-action text-action-fg hover:bg-action-hover
SECONDARY_CTA = CTA_BASE border-border bg-transparent text-fg hover:bg-surface-inset
FLAT_SECONDARY = border-2 ![box-shadow:none]
```

`StatePanel` (error, and the listings empty panel) and the booking `StatusTag`
are local functions in the page that renders them. `FLAT_SECONDARY` is passed to
the secondary `Button`s (Unpublish, Upload photo) to replace the 1px border plus
inset ring with a solid 2px edge, the accepted per-file override from NH-124
(tracked in #138).

| Option                                 | Verdict  | Why                                                                    |
| -------------------------------------- | -------- | ---------------------------------------------------------------------- |
| Local constants per file (chosen)      | Chosen   | Matches shipped pages, zero `packages/ui` change, one reviewable diff  |
| Shared `LinkButton` / `Button asChild` | Rejected | Needs a primitive change; belongs to #138                              |
| Shared `StatePanel` / `StatusTag` now  | Deferred | Cross-area extraction (booking, listing detail, host); see Open points |

## D2. Shared extraction only for host-file reuse

Extract a piece only when two or more host files in this change reuse it:

- **`components/ListingStatusTag.tsx`**: `ListingStatusTag({ status })`, used by
  `HostListingsPage` and `EditListingPage`. It owns `statusLabel()` (today
  duplicated in both pages) and replaces `Badge` and both `statusTone()`
  functions (removed). Anatomy: `inline-flex items-center gap-2 rounded-sm
border-2 px-2 py-1 text-xs font-bold`:

  | Status    | Edge                 | Fill  | Text                       | Extra cue                    |
  | --------- | -------------------- | ----- | -------------------------- | ---------------------------- |
  | DRAFT     | **dashed** ink       | paper | ink                        | none (dashed = not live yet) |
  | PUBLISHED | **solid** ink        | paper | ink                        | 8px filled ink square marker |
  | DISABLED  | solid `border-muted` | paper | `fg-muted`, `line-through` | struck text                  |

  The label is the tag's only text node ("Draft", "Published", "Disabled", from
  the existing `host.listings.status_*` keys); the marker is an empty
  `aria-hidden` sibling `span`, so `getByText("Published")` stays a single match.
  No pill, no tone colour.

- **`components/listingFormStyles.ts`**: string constants used by
  `CreateListingForm`, `ListingDetailsForm`, `ListingAvailabilityCard`,
  `AmenityCheckboxGrid` and `BecomeHostPage`:

  ```
  LABEL_CLASS      = mb-2 block text-sm font-bold text-fg                       (the FormField label)
  CONTROL_CLASS    = w-full rounded-sm border-2 border-border bg-surface-raised px-4 py-3 text-base text-fg placeholder:text-fg-subtle transition-colors duration-fast ease-out focus-visible:bg-surface aria-[invalid=true]:border-danger
  HINT_CLASS       = m-0 mt-2 border-l-4 border-solid border-border-muted pl-3 text-sm text-fg-muted
  ERROR_BAR_CLASS  = m-0 mt-2 break-words border-l-4 border-solid border-danger pl-3 text-sm font-bold text-danger   (the FormField error)
  CHECKBOX_CLASS   = peer h-5 w-5 shrink-0 appearance-none rounded-none border-2 border-border bg-surface-raised checked:bg-ink
  ```

  `CONTROL_CLASS` mirrors the `Input` primitive for `select` and `textarea`.
  The old `focus-visible:outline-none focus-visible:border-border` pair is
  dropped, so the global two-layer focus ring returns on selects and textareas.

## D3. Link CTAs replace `Link > Button` on host listings

New listing (`/host/listings/new`) is one `<Link>` styled `PRIMARY_CTA`; each
Edit (`/host/listings/:id/edit`) is one `<Link>` styled `SECONDARY_CTA`. Same
`href`, same accessible name, one tab stop, 44px. `EmptyState`'s own nested
`Link > Button` (used on host bookings) is left as it is (#138).

## D4. `FormField` where fields have errors

`CreateListingForm` wraps each field in `FormField` (`id`, `label`, `error`).
The control is the child; the hint renders below it with `HINT_CLASS` only when
there is no error (today's `FieldHint` either/or behaviour), and the error
renders through `FormField` with the danger left bar. `Input`, `select` and
`GroupedSelect` keep `aria-invalid`, so the danger edge appears on invalid
fields. `ListingDetailsForm` has no per-field errors today and gets none: only
labels (`LABEL_CLASS`) and the `select`/`textarea` classes (`CONTROL_CLASS`)
change; `required`, `min` and `valueAsNumber` stay. On Create only, a control
that shows a `FormField` error gets `aria-describedby` pointing at that error
(`errorIdFor`, as Login and Register do); hints and the Edit form get none (see
Open points).

## D5. Thumbnail and pictogram tile

The host listings thumbnail is a 64px square: `h-16 w-16 shrink-0
overflow-hidden rounded-none border-2 border-border bg-surface-inset`. With a
photo, the `img` (`alt` = listing title, unchanged) fills it with
`object-cover`. Without one, the tile centres the `packages/ui` `Pictogram`
(`bed` for `PROPERTY`, `desk` for `WORKSPACE`, `h-8 w-8 text-fg`, decorative so
`aria-hidden`), instead of today's empty stone square. Photo treatment beyond
the frame belongs to #121.

## D6. Headings, no ember band

Every host screen has exactly one `h1`: `font-black leading-none text-3xl
md:text-4xl text-fg`. No ember title band (that is the Auth grammar; these are
work screens, not destinations). Ember does not appear on any host screen; the
primary action is the ink `Button`/`PRIMARY_CTA`.

## D7. Edit cards keep `Card`

`EditListingPage` keeps the `Card` primitive around the details form, photos
and availability (the primitive already renders a 2px ink edge without shadow).
Card headings are `h2 text-lg font-bold text-fg`. No ember, no inner shadow.

## D8. Copy

No `t()` key is added, removed or renamed and no string value changes. The
hard-coded `Photo N` alt in `ListingPhotosCard` stays (follow-up). A unit test
snapshots, as literals, every key these screens read (`host.listings.*`,
`host.bookings.*`, `host.photos.*`, `host.availability.*`,
`identity.become_host.*`, `booking.dashboard.status_*`,
`error.generic.unexpected`) and asserts they equal baseline. **Copy changes:
none.**

## D9. Tests, docs and the booking status tag

- Page and component tests are extended (D16); new
  `apps/web/e2e/host-identity.spec.ts`; `DESIGN.md` section "Host dashboard and
  listing forms"; surface brief `src-pages-hostlistingspage-tsx.md`; reports
  under `openspec/changes/host-identity/reports/`.
- The booking status tag on `HostUpcomingPage` is a local copy of the
  `MyBookingsPage` `StatusTag` (pending dashed, confirmed solid, cancelled solid
  muted and struck, completed solid with marker; labels from the unchanged
  `booking.dashboard.status_*` keys). A shared `StatusTag` extraction is a
  documented follow-up, not this ticket.

## D10. HostListingsPage

- **Frame.** `PageWrapper` unchanged. Header `mb-6 flex flex-wrap items-end
justify-between gap-4`: `h1` (D6) and New listing (D3), `w-full sm:w-auto`.
- **Rows.** Each listing is a `div` (no `Card`): `rounded-card border-2
border-border bg-surface-raised p-4 sm:p-5`, no ring, no shadow; rows stack with
  16px gap. Inside: thumb (D5); title `font-bold text-fg break-words`; type and
  city line `text-sm text-fg-muted`; confirmed-bookings count stays
  `text-success`, now `font-bold` (words carry the meaning, 6.82:1). Right side:
  `ListingStatusTag` then Edit (D3). `min-w-0` on the text column.
- **Loading.** Flat skeleton wrapped in `aria-busy="true"`: same structure, rows
  2px-edged, square thumb block, the pill and `rounded-md` blocks replaced by
  `rounded-none` blocks. No `h1` (no text).
- **Empty.** A local dashed panel: `border-2 border-dashed border-border
bg-surface-raised px-6 py-12`, the existing `host.listings.no_listings` text in
  `fg-muted`. No CTA (New listing is already in the header).
- **Error.** Inside `PageWrapper`, a danger `StatePanel`: `role="alert"`, 2px solid
  danger edge, `bg-danger-bg`, 48px filled danger tile with a paper "!"
  (`aria-hidden`), and `error.generic.unexpected` as the state's only `h1`, bold
  danger. Exactly one `role="alert"`.

## D11. HostUpcomingPage

- **Frame.** `PageWrapper`; `h1` (D6).
- **Table.** Wrapper `overflow-x-auto` (own scroll at 360px; the page itself
  never scrolls horizontally). `thead tr`: `border-b-2 border-border`; `th`:
  `font-bold text-fg`, same `text-left` and padding. Body rows keep a 1px
  `border-border-muted` rule. Listing title ink; guest, dates and amount
  `fg-muted`, amount `tabular-nums`. `formatDate` and `formatAmount` unchanged.
- **Status.** Local `StatusTag` (D9) replaces `Badge` and `statusTone()`.
- **Empty.** `EmptyState` with the same props (unchanged component).
- **Loading / error.** Flat `aria-busy` skeleton (no pill); error as D10.

## D12. Create and Edit listing forms

- **CreateListingPage.** `mx-auto max-w-2xl px-4 py-8` column kept; `h1` (D6).
  `CreateListingForm` per D4; the amenities `fieldset` legend uses
  `LABEL_CLASS`, its hint `HINT_CLASS`. `serverError` renders through
  `ServerErrorAlert`. Submit stays `<Button type="submit">`, `min-h-11`, same
  `disabled={isSubmitting || !isValid}` and same labels.
- **EditListingPage.** Same column, `h1` (D6). Status row: `ListingStatusTag`,
  then Publish (primary) or Unpublish (secondary + `FLAT_SECONDARY`) as real
  `Button`s with the same handlers; `publishError` renders through
  `ServerErrorAlert` on its own full-width line. Loading skeleton flat (no pill,
  no `rounded-md`), `aria-busy`. Not found: the D10 error panel inside the
  column.
- **ListingDetailsForm.** D4; the inline amenity grid is replaced by
  `AmenityCheckboxGrid` with `AMENITIES`, `selectedAmenities` and
  `toggleAmenity` (identical behaviour); `saveError` through
  `ServerErrorAlert`; Save `min-h-11`, same `disabled`.

## D13. AmenityCheckboxGrid

The single amenity grid for both forms. Grid `grid-cols-2 gap-2 sm:grid-cols-3`
kept. Each item is a `label` (`relative flex min-h-11 cursor-pointer
items-center gap-3 text-sm text-fg break-words`) holding the native
`<input type="checkbox">` with `CHECKBOX_CLASS` (still a real input: role,
checked state, label click, Space key and form state unchanged) and an
`aria-hidden` check glyph `svg` absolutely positioned over the box, `hidden
peer-checked:block`, paper stroke on the ink fill. Focus: the global two-layer
outline on the input. Props unchanged.

## D14. Photos, availability and Become host

- **ListingPhotosCard.** `h2` (D7); grid `grid-cols-2 gap-3 sm:grid-cols-3`;
  each photo `aspect-square w-full rounded-none border-2 border-border
object-cover`, `alt` unchanged; Delete stays `variant="destructive"`
  (paper label on danger, on the paper card), `min-h-11`. Empty text
  `fg-muted`. `uploadError` renders through `ServerErrorAlert` (replaces the
  `text-red-600` paragraph; it gains `role="alert"`). The hidden file input and
  its `ref` are untouched; Upload stays a secondary `Button` + `FLAT_SECONDARY`
  with the same `disabled`.
- **ListingAvailabilityCard.** `h2` (D7); block rows `flex flex-wrap items-center
justify-between gap-3 rounded-none border-2 border-border p-3`, dates in ink
  tabular; Delete destructive as above. Date labels `LABEL_CLASS`; `Input`
  unchanged; Block `min-h-11`, same `disabled`; `blockError` through
  `ServerErrorAlert`.
- **BecomeHostPage.** `max-w-sm` column; the header is left-aligned in the form
  column; `h1` (D6) and subtitle `text-sm text-fg-muted`. The two fields keep
  `FormField`. Terms row `flex min-h-11 items-start gap-3`: the checkbox uses
  `CHECKBOX_CLASS` plus the check glyph (D13 anatomy), label `text-sm text-fg`;
  the terms error renders with `ERROR_BAR_CLASS` (same text, no `role` added,
  as today). `ServerErrorAlert` and the submit `Button` unchanged (`min-h-11`).

## D15. Accessibility, 360 px and motion checklist

- One `h1` per screen and per error state; loading states have none.
- State is never colour alone: dashed, solid plus marker, struck tags; filled
  "!" tile; danger edge plus left-bar text on invalid fields.
- Exactly one `role="alert"` per error state; form errors keep their single
  `ServerErrorAlert`.
- Focus order equals DOM equals visual order; each CTA one tab stop; two-layer
  global focus ring everywhere, never clipped (no `overflow-hidden` on panels
  that contain focusable content).
- Targets: link CTAs, submit and destructive buttons, amenity and terms
  checkboxes 44px.
- 360 px: single column, `min-w-0` and `break-words` on titles, cities, emails;
  header CTA full width; no document-level horizontal scroll; only the bookings
  table scrolls inside its wrapper.
- Reduced motion: only colour transitions; the skeleton pulse is already off
  under `prefers-reduced-motion`.

## D16. Test strategy (TDD)

- **Unit (Vitest + Testing Library), red first**, in `HostListingsPage`,
  `HostUpcomingPage`, `CreateListingPage`, `EditListingPage`, `BecomeHostPage`
  tests plus new `ListingStatusTag.test.tsx` and `AmenityCheckboxGrid.test.tsx`:
  - Host listings: one `h1`; New listing and Edit are `link`s with the same
    `href` and name and contain no `button`; rows carry `border-2` and no
    `shadow`/`ring`; no-photo row renders an `aria-hidden` pictogram, photo row
    the `img` with the title alt; empty state shows the existing text with no
    link; error is one `role="alert"` with one `h1`; loading has `aria-busy`, no
    `rounded-pill`.
  - Status tag: per status the label is a single text node and the shape class
    is present (dashed, solid plus marker, `line-through`); no pill.
  - Host bookings: head row `border-b-2`; status tags shape-coded; table inside
    an `overflow-x-auto` wrapper; empty still renders `EmptyState`; error as
    above.
  - Forms: labels bold ink; invalid field shows the danger bar text and keeps
    `aria-invalid`; hints render when valid; submit disabled while invalid and
    while submitting; payload unchanged; server, save, publish, upload and block
    errors each render one `role="alert"`; amenity checkboxes stay
    `role="checkbox"`, toggle by click and Space, and `ListingDetailsForm`
    renders `AmenityCheckboxGrid`; the terms checkbox error shows the bar.
  - Dictionary-unchanged test (D8).
- **E2E (Playwright, mocked API)** in `host-identity.spec.ts`, patterned on
  `booking-payment-identity.spec.ts`, at 1440x900 and 360x800: row and thumb
  border 2px `rgb(30, 30, 30)`, radius 0 on the thumb, no box shadow; tag border
  styles per status and `line-through` on disabled; table head rule 2px ink;
  checkbox 2px ink edge and 44px label box; invalid field border
  `rgb(155, 28, 46)`; error panel danger edge and tint `rgb(248, 225, 224)`; no
  element with a box shadow or gradient; no document horizontal overflow at 360
  on every screen; Tab reaches New listing, Edit and the submit buttons once
  each and shows the 3px ink outline.
- Existing e2e constraints carried: `us-2.2` `getByText("Draft")` and
  `getByText("Published")` (strict, single match); `us-2.1` create flow and
  redirect to the edit page; `us-2.3` availability; `us-1.3` become-host
  redirect. Screenshots are attached to the report, never compared.

## D17. Surface brief and DESIGN.md

Write `apps/web/.impeccable/surfaces/src-pages-hostlistingspage-tsx.md` in the
format of the booking form brief (frontmatter `version: 1`, `slug`,
`primary_target: "src/pages/HostListingsPage.tsx"`, `related_targets` listing
the other host pages and the form components; scope and mode, audience, job,
action, proof, constraints, direction contract, unresolved decisions). Extend
`DESIGN.md`: Components gets "Host dashboard and listing forms" (listing rows,
thumb and pictogram tile, listing status tag, host bookings table, field
grammar, amenity checkbox, edit cards, state panels); the Overview sentence that
lists the screens mentions the host screens. No palette or token change.

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

Palette (from `packages/ui/src/styles/globals.css` and `tokens.test.ts`): ink
#1E1E1E, paper #F7F5F2, stone #E5E2DD, ember #E65F35, danger #9B1C2E, danger-bg
#F8E1E0, success #2F5F3E, fg-muted #3F3B37, fg-subtle #57534E, border-muted
#6F6A63.

| ID  | Pairing (where on these screens)                                                  | Colours           | Ratio | Needs | Result                       |
| --- | --------------------------------------------------------------------------------- | ----------------- | ----- | ----- | ---------------------------- |
| H1  | Ink on paper: headings, labels, titles, tag text, table head, checkbox labels     | #1E1E1E / #F7F5F2 | 15.32 | 4.5   | pass                         |
| H2  | Muted ink on paper: meta lines, hints, table cells, empty text, struck "Disabled" | #3F3B37 / #F7F5F2 | 10.20 | 4.5   | pass                         |
| H3  | Subtle ink on paper: placeholders                                                 | #57534E / #F7F5F2 | 7.01  | 4.5   | pass                         |
| H4  | Success on paper: confirmed-bookings count (14px bold)                            | #2F5F3E / #F7F5F2 | 6.82  | 4.5   | pass                         |
| H5  | Ink edge on paper: rows, thumbs, inputs, selects, tags, checkboxes, head rule     | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| H6  | Ink dashed edge on paper: draft tag, pending booking tag, empty panel             | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| H7  | Muted edge on paper: disabled/cancelled tag edge, hint bar, table row rules       | #6F6A63 / #F7F5F2 | 4.93  | 3     | pass                         |
| H8  | Ink pictogram on stone: no-photo tile (non-text)                                  | #1E1E1E / #E5E2DD | 12.90 | 3     | pass                         |
| H9  | Ink on stone: secondary CTA and button hover fill                                 | #1E1E1E / #E5E2DD | 12.90 | 4.5   | pass                         |
| H10 | Paper on ink: primary CTA and submit labels, check glyph on checked box           | #F7F5F2 / #1E1E1E | 15.32 | 4.5   | pass                         |
| H11 | Ink marker square in published and completed tags (non-text)                      | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| H12 | Danger on paper: field error bar text (bold), invalid control edge, error bar     | #9B1C2E / #F7F5F2 | 7.42  | 4.5   | pass                         |
| H13 | Danger on danger-bg: error panel `h1`, `ServerErrorAlert` text (bold)             | #9B1C2E / #F8E1E0 | 6.48  | 4.5   | pass                         |
| H14 | Danger edge on danger-bg: error panel and alert inner side (non-text)             | #9B1C2E / #F8E1E0 | 6.48  | 3     | pass                         |
| H15 | Paper on danger: "!" tile glyph, destructive button label                         | #F7F5F2 / #9B1C2E | 7.42  | 4.5   | pass                         |
| H16 | Ink focus outline on paper and stone (CTAs, controls, checkboxes)                 | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass (stone 12.90)           |
| H17 | Subtle ink on stone: disabled `Button` label (Create, Block, Upload)              | #57534E / #E5E2DD | 5.91  | 4.5   | pass                         |
| H18 | Muted edge on stone: disabled `Button` dashed edge (non-text)                     | #6F6A63 / #E5E2DD | 4.15  | 3     | pass                         |
| N1  | Not used: paper text on ember                                                     | #F7F5F2 / #E65F35 | 3.19  | 4.5   | fails, so never placed there |
| N2  | Not used: muted ink on ember                                                      | #3F3B37 / #E65F35 | 3.20  | 4.5   | fails, so never placed there |
| N3  | Not used: subtle ink on ember                                                     | #57534E / #E65F35 | 2.20  | 4.5   | fails, so never placed there |
| N4  | Not used: danger on ember                                                         | #9B1C2E / #E65F35 | 2.33  | 4.5   | fails, so never placed there |

Notes: values were computed with the script above from the shipped tokens; H4 is
the only pairing not already in the NH-124 table (success L = 0.0914, paper
L = 0.9149). No ember surface exists on the host screens, so N1 to N4 are
recorded only as guards. Danger text sits on paper or the danger tint only;
`text-red-600` is removed. No new colour value is introduced.

## Risks

| Risk                                                                        | Mitigation                                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `getByText("Published")` / `"Draft"` matches two nodes (us-2.2 strict)      | Label is the tag's only text; marker is an empty `aria-hidden` span; unit and e2e assert one match   |
| A form restyle drops `register` options, `noValidate` or the `isValid` gate | Only classes and wrappers change; tests assert `disabled` conditions and submitted payloads          |
| Status tag shape cues rot with Tailwind refactors                           | Assert text and roles first; classes only for shape cues; e2e asserts computed border and decoration |
| The bookings table overflows the page at 360px                              | Wrapper-only scroll; e2e asserts `scrollWidth <= clientWidth` on the document                        |
| Struck "Disabled" tag reads poorly                                          | `fg-muted` 10.20:1 and muted edge 4.93:1 (H2, H7); e2e computed colour                               |
| Native checkbox stops being a real input                                    | `appearance-none` on the input itself; glyph `aria-hidden`; tests by `role="checkbox"` and Space     |
| Hidden file input or its `ref` broken by the photos restyle                 | Input markup untouched; us-2.x upload tests re-run                                                   |
| Error panel plus another alert yields two `role="alert"`                    | Page error states render only the panel; tests assert exactly one                                    |
| Upload error gains `role="alert"` (new announcement)                        | Intended by the `ServerErrorAlert` grammar; same text; recorded here as the only role change         |
| `Badge` pill and secondary `Button` ring remain in `packages/ui`            | Untouched by design; `AdminListingsPage` stays inconsistent until #123; `FLAT_SECONDARY` per #138    |

## Open points

None blocking. Recorded follow-ups (not in scope; copy them into the PR
description):

- **Shared `StatePanel` extraction.** The danger error panel is now local in
  `HostListingsPage`, `HostUpcomingPage` and `EditListingPage`, besides
  `ListingDetailPage` and `BookingFormPage`. D1 keeps it local to stay within
  this ticket; the cross-area extraction is the next refactor.
- **Shared booking `StatusTag`.** `HostUpcomingPage` copies the `MyBookingsPage`
  tag (D9); extract it together with a shape-per-tone `Badge`.
- **`Badge` pill in `packages/ui`** (#123): `AdminListingsPage` still shows the
  pill for the same listing statuses.
- **`Link > Button` and `FLAT_SECONDARY`** (#138): `EmptyState` keeps its nested
  CTA; host files carry local CTA constants and the override.
- **Listing photos** (#121): photo treatment beyond the square frame.
- **Copy (needs `t()` work):** the hard-coded `Photo N` alt in
  `ListingPhotosCard`.
- **Field descriptions (resolved at spec time).** Create form controls that show
  a `FormField` error get `aria-describedby={errorIdFor(id)}`, the convention
  `LoginPage` and `RegisterPage` use. Hints and the Edit form (no per-field
  errors) get none; linking hints is a follow-up.
- **Scrollable table region (resolved at spec time).** The bookings table
  wrapper stays non-focusable: no existing translated string can name it and no
  new copy is allowed. A focusable labelled region is a follow-up.
