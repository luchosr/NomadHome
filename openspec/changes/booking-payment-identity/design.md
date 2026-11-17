# Design: booking-payment-identity

Ticket NH-124 (#124). Builds on `refresh-visual-identity` (NH-118),
`warm-palette-swap` (NH-129), `auth-screens-identity` (NH-125) and
`listing-detail-identity` (NH-126). Frontend only: no backend, schema, route,
API, API-client, query, validation, Stripe, polling or `t()` key change. These
screens are **Operate mode** (confirm a price, pay, wait, read a status, cancel,
review), so ambition shows as precision: one strong sign composition per
screen, exact pairings, shape-coded state and complete accessibility, not extra
decoration or features.

## Files in scope

| File                                                                    | Change                                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/web/src/pages/BookingFormPage.tsx`                                | Sign panel summary, framed photo, link CTAs, `ServerErrorAlert`, state panels |
| `apps/web/src/pages/BookingSuccessPage.tsx`                             | Ember success panel, dashed waiting panel, link CTA                          |
| `apps/web/src/pages/BookingCancelPage.tsx`                              | Paper sign panel, link CTAs                                                  |
| `apps/web/src/pages/MyBookingsPage.tsx`                                 | Flat cards, local status tag, flat skeleton, danger error panel              |
| `apps/web/src/components/Modal.tsx`                                     | No shadow, 2px ink edge, flat backdrop (no behaviour change)                 |
| `apps/web/src/components/CancelBookingModal.tsx`                        | 2px textarea, bold label, `ServerErrorAlert`, two-layer focus                |
| `apps/web/src/components/ReviewModal.tsx`                               | Drawn star glyph, 2px textarea, error, flat success panel                    |
| `apps/web/src/components/EmptyState.tsx`                                | Flat 2px dashed edge, no `rounded-xl`                                        |
| `apps/web/src/pages/BookingFormPage.test.tsx` and the other page and modal tests | Extend (structure, roles, states, classes, dictionary unchanged)     |
| `apps/web/e2e/booking-payment-identity.spec.ts` (new)                   | Computed colour, border style, layout and focus checks at 1440 and 360       |
| `apps/web/DESIGN.md`                                                    | Add the "Booking and payment" composition (what shipped)                     |
| `apps/web/.impeccable/surfaces/src-pages-bookingformpage-tsx.md` (new)  | Surface brief                                                                |
| `openspec/changes/booking-payment-identity/reports/*`                   | Verification reports and screenshots                                         |

Read but **not** changed: `packages/ui` (`Button`, `Skeleton`, `Badge`, `Card`),
`ServerErrorAlert.tsx`, `FormField.tsx`, `AuthShell.tsx`, `VerifyEmailPage.tsx`,
`ListingDetailPage.tsx`, `apps/web/src/api/*`, `apps/web/src/lib/dates.ts`,
`en.ts`. Pieces these screens need (state panel, tile glyphs, status tag, star
glyph, link-style constants) are local to each file: each is used in one file
or is a two-line class constant, so no shared component or primitive export is
created (scope defense). The `StatePanel` is deliberately not imported from
`ListingDetailPage` (it is not exported; exporting it would change that file).
A shared panel is a follow-up once three or more screens need it.

## D1. Shared grammar and local link constants

Every screen keeps the `Layout` `<main>` frame and its own `max-w` wrapper (no
second `main`, no ember title band: that is the Auth grammar and these screens
are not destinations to announce). Surfaces are paper sign panels: `border-2
border-border bg-surface-raised rounded-card`, no shadow, no gradient. Ember is
used once per screen at most (a band on the form summary, the success panel
itself), always with **ink** text.

Link CTAs follow `ListingDetailPage` (`CTA_BASE`, `PRIMARY_CTA`,
`SECONDARY_CTA`) and `PRIMARY_LINK` in `VerifyEmailPage`:

```
CTA_BASE      = inline-flex min-h-11 items-center justify-center rounded-sm border-2 px-[22px] py-[14px] text-sm font-bold no-underline transition-colors duration-med ease-out active:translate-y-px
PRIMARY_CTA   = CTA_BASE border-border bg-action text-action-fg hover:bg-action-hover
SECONDARY_CTA = CTA_BASE border-border bg-transparent text-fg hover:bg-surface-inset
TERTIARY_CTA  = inline-flex min-h-11 items-center justify-center px-2 text-sm font-bold text-fg underline underline-offset-4 hover:no-underline
```

Each page declares the constants it uses at module top (the same duplication
`ListingDetailPage` and `VerifyEmailPage` already accept). A single `<Link>`
replaces `Link > Button`: one tab stop, valid HTML, same role and accessible
name, same `href`. Link CTAs sit on paper or stone, never on ember.

| Option                                                 | Verdict  | Why                                                                                    |
| ------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------- |
| Local constants per page (chosen)                      | Chosen   | Matches shipped pages, zero `packages/ui` change, one reviewable diff                  |
| New shared `LinkButton` or `Button asChild`            | Rejected | Needs a primitive change; belongs to #138 with its five screens                        |
| Keep `Link > Button` and only restyle                  | Rejected | Nested interactive content, double tab stop; already fixed on the sibling pages        |

## D2. BookingFormPage

Frame: `mx-auto max-w-xl px-4 py-8`, as today. Order: `h1`, summary panel,
server error, Pay now, back link.

- **`h1`.** Existing `booking.ui.form_title`, Black, solid leading,
  `text-3xl md:text-4xl`, ink.
- **Photo.** `border-2 border-border`, `rounded-none`, `h-40 w-full object-cover`,
  at the top of the panel, closed by a 2px ink rule. `alt` stays the listing
  title. No photo: no placeholder is added (the panel simply starts at the
  title; today's behaviour).
- **Summary panel.** One paper panel (2px ink edge, `rounded-card`, no shadow, no
  `overflow-hidden` so the focus ring is never clipped). Body padding 16px,
  20px from `sm`. The title is bold ink; city and country is `fg-muted` 14px
  (10.20 on paper). Dates and the service fee stay plain text rows exactly as
  today (`<span>` label, `<span>` value): the e2e reads the raw ISO dates
  `2026-08-01` and `2026-08-04` and `/service fee/`. No `formatDate` here (that
  would be a copy and test change; recorded as follow-up).
- **Total band.** The last child of the panel: `border-t-2 border-border
  bg-ember text-fg`, padding 16px 20px, bottom corners `rounded-b-[2px]`. One
  `div` row: label `t("booking.ui.total")` (16px bold ink) and amount
  (`text-2xl` Black, tabular, ink) as sibling `span`s, so
  `getByText(/^total$/i).closest("div")` still returns the row that contains the
  amount. Everything on the band is ink (4.81, large text and bold 16px both
  pass). **Never** paper, `fg-muted`, `fg-subtle` or danger on ember.
- **Pay now.** Stays the primary `<Button className="w-full">`, outside the
  ember band, same `disabled` condition, same handler, same label strings.
- **Server error.** `<ServerErrorAlert error={serverError} className="mt-4" />`
  replaces the danger paragraph (still one `role="alert"`, same text).
- **Back action.** A single `<Link>` styled `TERTIARY_CTA`, `href` unchanged.

States (all in the same wrapper, one centred panel `max-w-[36rem]`, 2px edge,
4px radius, no shadow, 48px tile, one `h1` where sensible without new copy):

| State          | Panel                                  | Tile (48px, 2px edge, 24-grid glyph, 3-unit strokes, square caps) | Heading / text (existing string)                   | Roles                  |
| -------------- | -------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- | ---------------------- |
| no dates       | solid paper                            | ink fill, paper calendar-frame glyph                              | `booking.ui.select_dates` as `h1`, ink             | none (page state)      |
| loading        | flat skeleton in a 2px-edged panel     | none                                                              | none (no text, so no heading)                      | `aria-busy="true"`     |
| listing 404    | `bg-danger-bg`, 2px solid danger edge  | filled danger tile, paper "!"                                     | `listings.error.not_found` as `h1`, bold danger    | `role="alert"` on panel |
| quote / generic error | same as 404                     | same                                                              | `error.generic.unexpected` as `h1`, bold danger    | `role="alert"` on panel |

The no-dates panel keeps its back `Link` (`SECONDARY_CTA`, `href` unchanged)
below the heading. The skeleton is flat: every block `rounded-none`, the summary
placeholder a 2px ink-edged panel without shadow, same heights as today. The
two error branches keep their conditions (`ApiError` 404 versus
`error || !listing`, then `quoteError`); only the markup changes. Danger text
sits on the danger tint (6.48), never on ember.

## D3. BookingSuccessPage

- **Success** (confirmed, and also the no-`bookingId` and timed-out paths,
  which render the same success copy today and keep doing so: splitting them
  needs copy and is a follow-up). One centred panel (`max-w-lg`, `mx-auto`):
  `bg-ember border-2 border-border rounded-card`, 64px tile `bg-ink` with a
  paper check glyph (32-grid, 3-unit strokes, square caps, `aria-hidden`), the
  existing `success_title` as the `h1` (Black, ink), the existing
  `success_message` in ink (not muted: no muted ink on ember), `#bookingId` as
  one text node `#{bookingId}` in bold ink. This is the VerifyEmail success
  grammar with ink text only.
- **CTA.** The view-bookings action sits on the panel's paper foot, a 2px ink
  rule above it: a single `<Link to="/bookings">` styled `PRIMARY_CTA`. The
  link is **not** placed on ember (ink fill with paper text on ember is
  technically fine at 15.32 for the label, but the Panel Is The Pairing Rule
  says controls on orange take a paper fill: a paper foot satisfies it without a
  special case).
- **Waiting.** `bookingId && !confirmed && !timedOut`: a dashed stone panel
  (`border-2 border-dashed border-border bg-surface-inset`), `role="status"`
  and `aria-busy="true"`, the existing `processing` string in ink, and the three
  skeleton bars flat (`rounded-none`). No tile (nothing is decided yet; dashed =
  pending, as in the verify pending panel). No polling, sync or timing change.

## D4. BookingCancelPage

A neutral paper sign panel (`max-w-lg`, 2px ink edge, 4px radius, no shadow): a
64px tile with a 2px ink outline and no fill holding an ink dash glyph (a
neutral "not completed" mark, `aria-hidden`), the existing `cancel_title` as the
`h1`, the existing `cancel_message` in `fg-muted` on paper, and on a stone foot
under a 2px ink rule the single link CTA. Back to listing (when `listingId` is
present) and back to search (when absent) keep their strings and hrefs; both are
a `<Link>` styled `SECONDARY_CTA`. No ember and no danger: cancelling the
payment is not an error.

## D5. MyBookingsPage

- **Frame.** `PageWrapper` unchanged. `h1` Black, solid leading. Cards stack
  with a 16px gap.
- **Card.** The `Card` primitive is replaced in this file by a `div` carrying
  `rounded-card border-2 border-border bg-surface-raised p-4 sm:p-5` (no shadow,
  no inset ring). It **keeps the `rounded-card` class**: the e2e locates cards
  by `.rounded-card`. The listing title link is bold ink, underlined on hover
  (as today). Dates in `fg-muted`, nights in `fg-subtle` (7.01 on paper).
  `formatDate` stays.
- **Status tag (local).** A `StatusTag` component in the page file replaces
  `Badge` and `statusTone` (removed with it). Anatomy: `inline-flex items-center
  gap-2 rounded-sm border-2 px-2 py-1 text-xs font-bold`, label text from the
  unchanged `statusLabel()`. Shape carries the status; the label is always
  present:

  | Status          | Edge                  | Fill  | Text                         | Extra cue                      |
  | --------------- | --------------------- | ----- | ---------------------------- | ------------------------------ |
  | PENDING_PAYMENT | **dashed** ink        | paper | ink                          | none (dashed = tentative)      |
  | CONFIRMED       | **solid** ink         | paper | ink                          | none                           |
  | CANCELLED       | solid `border-muted`  | paper | `fg-muted`, `line-through`   | struck text                    |
  | COMPLETED       | solid ink             | paper | ink                          | 8px filled ink square marker   |

  The text node is exactly the label (for example "Cancelled"), so
  `getByText("Cancelled", { exact: true })` still resolves to one node. The
  marker is a sibling `span` with `aria-hidden`.
- **Actions.** `Button` complete payment (primary), cancel (destructive) and
  review (secondary) are unchanged in role, name, condition and handler. Exactly
  one `/cancel/` button exists per cancellable card; the status tag text never
  contains "cancel" as a button (it is a `span`).
- **Skeleton.** Flat: same structure, bars `rounded-none`, the pill block and
  `rounded-md` block replaced by square blocks, cards are 2px-edged. Wrapper
  `aria-busy="true"`.
- **Error.** `error || !data`: a danger sign panel with `role="alert"`, 2px solid
  danger edge, tint fill, filled danger tile with a paper "!", and the existing
  `error.generic.unexpected` text, bold danger, as the `h1` of the state
  (`PageWrapper` supplies the frame; there is no other `h1` in this state).
- **Empty.** `EmptyState` (D8) with the same props.

## D6. Modal

`Modal.tsx` changes the surface only: `shadow-md` removed, `border-2
border-border` added, `rounded-card` kept (4px), flat backdrop (`bg-ink/40`,
no blur, no gradient: the same scrim grammar as the Search filter sheet). The
wrapper keeps `role="dialog"`, `aria-modal="true"` and `aria-labelledby`.
**No behaviour change**: there is still no focus trap, no initial focus or focus
restore, no ESC handling, no backdrop-click close and no scroll lock. These are
real accessibility gaps (see Open points); fixing them needs an `onClose` prop
on `Modal`, which changes its API and every call site, so it is a recorded
follow-up and not part of a visual change. The restyle does not make them
better or worse, and the design records it so the review does not read the new
frame as an accessibility fix.

## D7. CancelBookingModal and ReviewModal

- **Title and body.** The `h2` is Black 20px ink; body text `fg-muted` on paper.
- **Label.** Bold 14px ink (the `FormField` grammar), replaces the 11px
  `font-medium text-fg-muted` label. `htmlFor` ids unchanged.
- **Textarea.** `w-full rounded-sm border-2 border-border bg-surface-raised
  px-4 py-3 text-base text-fg placeholder:text-fg-subtle`, focus: the global
  two-layer ink outline with paper gap (no `focus-visible:border-border`
  override). `maxLength`, `rows`, `placeholder` unchanged.
- **Error.** `ServerErrorAlert` inside the dialog (one `role="alert"`, same text)
  replaces the paragraph in both modals.
- **Stars.** The `★`/`☆` characters are replaced by a drawn 24-grid star in a
  `StarGlyph` (local to `ReviewModal.tsx`): filled = ink fill, mitred joins;
  empty = 2px ink stroke, no fill, so state is shape (filled vs outline), not
  colour. The glyph is `aria-hidden`; the button keeps `aria-label` `"N star(s)"`
  and `aria-pressed` exactly. Button target 44px, focus: two-layer ink and paper
  ring (`focus-visible:outline` per the global rule), replacing the
  `ring-fg ring-offset-2` combo. `text-warning` is removed (no new colour; ink
  on paper 15.32).
- **Success.** `review_success` is a flat panel: paper, 2px solid ink edge, a
  small filled ink tile with a paper check, ink bold text. Replaces the
  `text-success` paragraph (success green on paper is fine but shape-first).
  `setTimeout(onSuccess, 1200)` is untouched.
- **Buttons.** Close (secondary), confirm (destructive), submit (primary):
  unchanged in role, name, `disabled` and handlers.

## D8. EmptyState

Restyled in place: `border-2 border-dashed border-border bg-surface-raised
px-6 py-12`, no radius (square panel; dashed = nothing here yet), the stroke
icon becomes a 32px authored glyph in ink on the 24 grid (3-unit strokes, square
caps, `aria-hidden`), the message `fg-muted` on paper. The optional CTA stays a
nested `Link > Button` (issue #138). `EmptyState` is used by other pages (for
example `HostListingsPage`), so the change is verified there too (task 4.2); the
props and text are unchanged.

## D9. Accessibility, 360 px and motion checklist

- One `h1` per state; loading states have none (no text). `h2` in modals stays.
- Decorative glyphs and tiles are `aria-hidden`; state is never colour alone
  (dashed vs solid vs struck status tags, filled "!" tile vs outlined tile,
  filled vs outline star).
- Live regions: error panels are `role="alert"` (as before, one per state);
  the waiting panel is `role="status"` with `aria-busy`.
- Focus order equals DOM equals visual order; every CTA is one tab stop. Two-layer
  global focus ring everywhere; never clipped (no `overflow-hidden` on panels).
- Target sizes: link CTAs `min-h-11` (44px); star buttons 44px.
- 360 px: single column, no fixed widths, `min-w-0`, `break-words` on user
  strings (title, city, booking id, reason). No horizontal scroll in any state.
  The ember total band wraps its row (`flex-wrap`) when a currency amount is long.
- Reduced motion: nothing animates beyond colour transitions already neutralised;
  skeleton pulse is already disabled under `prefers-reduced-motion`.
- Touch: no hover-only information (star hover preview is additive; click works).

## D10. Existing affordances kept; scope defense

Kept exactly: the quote and listing queries and their retry, checkout redirect
(`window.location.href = url`), polling and Stripe sync, status transitions,
cancellable rule (`CONFIRMED` and future check-in), cancel reason payload,
review payload, `setTimeout` close, modal props. No new feature: no itemised
price breakdown, no map, no payment-method display, no status timeline, no
confirmation email copy, no toast. `Badge` and `Card` primitives stay in
`packages/ui` for other screens.

## D11. Copy

No `t()` key is added, removed or renamed and no string value changes. The star
replacement affects literals in `ReviewModal`, not the dictionary. A unit test
snapshots, as literals, every key these screens read (`booking.ui.*`,
`booking.dashboard.*`, `listings.error.not_found`, `error.generic.unexpected`,
`common.loading`, `common.submitting`, `common.action.close`) and asserts they
equal baseline. **Copy changes: none.** Copy defects found while reading are
recorded under Open points, not fixed.

## D12. Test strategy (TDD)

- **Unit (Vitest + Testing Library), red first**, in the existing test files
  (`BookingFormPage`, `BookingSuccessPage`, `BookingCancelPage`,
  `MyBookingsPage`, `CancelBookingModal`, `ReviewModal`, plus `Modal` and
  `EmptyState` tests): structure, roles, headings and class cues. Class-based
  assertions stand in for computed style (jsdom does not compute Tailwind); e2e
  complements them. The new assertions per screen:
  - Form: one `h1`; summary panel has the 2px border class and no `shadow`; the
    total band carries `bg-ember` and `text-fg` and no `text-fg-muted`,
    `text-fg-subtle` or `text-fg-inverse` inside; `getByText(/^total$/i).closest("div")`
    contains the amount; Pay now is a `button`, not inside an `a`; back and
    no-dates actions are `link`s that contain no `button`; server error renders
    through `role="alert"` with the same text and a tile; no-dates, 404 and quote
    error each have one `h1` and the alerts one `role="alert"`; loading keeps
    `aria-busy` and has no `h1`.
  - Success: ember panel classes on success and on the no-`bookingId` path; the
    waiting panel has `role="status"`, `aria-busy="true"` and the dashed class;
    `#bookingId` matches as one text node; the CTA is a `link` with no `button`.
  - Cancel: neutral panel, the tile is `aria-hidden`, the CTA is a link with the
    correct `href` per `listingId`.
  - My bookings: cards keep `rounded-card`; each status tag has its shape class
    (dashed, solid, line-through, marker) and the exact label text; no `Badge`
    pill; a single `/cancel/` button for a cancellable booking; error is one
    `role="alert"`; skeleton has no `rounded-pill` and keeps `aria-busy`.
  - Modals: no `shadow` class, 2px border class; textarea 2px class; error is a
    single `role="alert"`; star buttons still named "N stars" and carry an
    `svg[aria-hidden]` and no `★`/`☆` characters; success panel text and
    `setTimeout` behaviour (fake timers) unchanged.
  - EmptyState: dashed 2px class, no `rounded-xl`, CTA still resolves.
  - Dictionary-unchanged test as in D11.
- **E2E (Playwright, mocked API)** in `booking-payment-identity.spec.ts`,
  patterned on `listing-detail-identity.spec.ts`, at 1440x900 and 360x800: total
  band background `rgb(230, 95, 53)` and every text node in it `rgb(30, 30, 30)`;
  summary panel 2px ink border and no box shadow; photo border 2px radius 0;
  success panel background ember with every text node ink; waiting panel
  `border-style: dashed` and stone background; cancel panel paper; status tags'
  border styles per status and `text-decoration-line: line-through` for
  cancelled; error panels danger border `rgb(155, 28, 46)`, solid, tint
  `rgb(248, 225, 224)`; modal border 2px, no shadow; no element with a box shadow
  or gradient in any state; no horizontal overflow at 360 in every state; Tab
  reaches Pay now and each link CTA once and shows the 3px ink outline.
- Existing e2e constraints carried: `us-4.1` asserts raw `2026-08-01` and
  `2026-08-04`, `/service fee/`, the no-dates copy and the checkout redirect (its
  mocked URL hard-codes `localhost:5173` and fails off 5173: **do not edit**);
  `us-4.2` and `us-6.1` locate cards with `.rounded-card` and assert the text
  "Cancelled"; unit tests use `getByRole("button", { name: /cancel/ })` expecting
  a single match and star buttons named "N stars".
- Screenshots are attached to the report as artifacts, never compared (same
  policy as `layout.spec.ts`).

## D13. Surface brief and DESIGN.md

Write `apps/web/.impeccable/surfaces/src-pages-bookingformpage-tsx.md` in the
format of the listing detail brief (frontmatter `version: 1`, `slug`,
`primary_target: "src/pages/BookingFormPage.tsx"`, `related_targets` listing the
success, cancel and my-bookings pages and the modals; scope and mode,
audience/job/action/proof/constraints, direction contract with THESIS,
OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH, palette note, unresolved
decisions). Extend `DESIGN.md`: Components gets "Booking and payment" (summary
panel with ember total band, state panels, success and waiting panels, cancel
panel, my-bookings card and status tag grammar, modal frame, star glyph, empty
state), the Overview sentence that lists the screens mentions booking and
payment, the Do/Don't list gets "status is a shape plus text" and "total on
ember is ink". No palette or token change.

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

| ID  | Pairing (where on these screens)                                              | Colours           | Ratio | Needs | Result                       |
| --- | ----------------------------------------------------------------------------- | ----------------- | ----- | ----- | ---------------------------- |
| B1  | Ink on ember: total amount (24px Black, large text)                           | #1E1E1E / #E65F35 | 4.81  | 3     | pass                         |
| B2  | Ink on ember: "Total" label, success title and message (16px bold, normal)    | #1E1E1E / #E65F35 | 4.81  | 4.5   | pass                         |
| B3  | Ink edge on ember: band rule, success panel edge (non-text)                   | #1E1E1E / #E65F35 | 4.81  | 3     | pass                         |
| B4  | Ink on paper: titles, headings, tags, labels, dates values, card title        | #1E1E1E / #F7F5F2 | 15.32 | 4.5   | pass                         |
| B5  | Muted ink on paper: city/country, cancel message, dates, modal body           | #3F3B37 / #F7F5F2 | 10.20 | 4.5   | pass                         |
| B6  | Subtle ink on paper: nights count, placeholders                               | #57534E / #F7F5F2 | 7.01  | 4.5   | pass                         |
| B7  | Muted ink on stone: waiting message, cancel foot text (if any)                | #3F3B37 / #E5E2DD | 8.59  | 4.5   | pass                         |
| B8  | Ink on stone: waiting panel text, secondary link hover fill                   | #1E1E1E / #E5E2DD | 12.90 | 4.5   | pass                         |
| B9  | Ink edge on paper: panels, cards, textareas, tags, modal (non-text)           | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| B10 | Ink dashed edge on stone: waiting panel (non-text)                            | #1E1E1E / #E5E2DD | 12.90 | 3     | pass                         |
| B11 | Ink dashed edge on paper: pending status tag, empty state (non-text)          | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| B12 | Muted ink on paper, struck: cancelled status text                             | #3F3B37 / #F7F5F2 | 10.20 | 4.5   | pass                         |
| B13 | Muted edge on paper: cancelled status tag edge (non-text)                     | #6F6A63 / #F7F5F2 | 4.93  | 3     | pass                         |
| B14 | Paper on ink: primary CTA label and fill, success tile check glyph            | #F7F5F2 / #1E1E1E | 15.32 | 4.5   | pass                         |
| B15 | Danger on danger-bg: error panel heading and `ServerErrorAlert` text (bold)   | #9B1C2E / #F8E1E0 | 6.48  | 4.5   | pass                         |
| B16 | Danger edge on paper: error panel outer edge (non-text)                       | #9B1C2E / #F7F5F2 | 7.42  | 3     | pass                         |
| B17 | Danger edge on danger-bg: error panel inner side (non-text)                   | #9B1C2E / #F8E1E0 | 6.48  | 3     | pass                         |
| B18 | Paper "!" mark on danger tile                                                 | #F7F5F2 / #9B1C2E | 7.42  | 3     | pass                         |
| B19 | Ink focus outline on paper, stone and ember (star, CTAs, textarea)            | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass (stone 12.90, ember 4.81) |
| B20 | Ink star glyph, filled and outline, on paper (non-text)                       | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| B21 | Ink marker square in the completed status tag (non-text)                      | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| B22 | Subtle ink on stone: disabled `Button` label (Pay now, Complete payment)      | #57534E / #E5E2DD | 5.91  | 4.5   | pass                         |
| B23 | Muted edge on stone: disabled `Button` dashed edge (non-text)                 | #6F6A63 / #E5E2DD | 4.15  | 3     | pass                         |
| N1  | Not used: paper text on ember                                                 | #F7F5F2 / #E65F35 | 3.19  | 4.5   | fails, so never placed there |
| N2  | Not used: muted ink on ember                                                  | #3F3B37 / #E65F35 | 3.20  | 4.5   | fails, so never placed there |
| N3  | Not used: subtle ink on ember                                                 | #57534E / #E65F35 | 2.20  | 4.5   | fails, so never placed there |
| N4  | Not used: danger on ember                                                     | #9B1C2E / #E65F35 | 2.33  | 4.5   | fails, so never placed there |

Notes: values were recomputed with the script above. B19 ember ratio is the ink
outline against ember (nothing focusable sits on an ember surface by design).
The success panel keeps paper text off ember (N1): its CTA lives on the paper
foot. The `text-warning` tone used for the review stars is dropped, and no new
colour value is introduced.

## Risks

| Risk                                                                        | Mitigation                                                                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Ember band or success panel text drifts to a muted or paper colour later    | Computed-colour e2e on every text node on each ember surface; contrast table N1 to N3            |
| Status tag shape cues rot with Tailwind refactors                           | Assert text and roles first; classes only for shape cues; e2e asserts computed border and decoration |
| Replacing `Card` with a `div` in MyBookingsPage drifts from the primitive   | Same tokens as the Card (paper, 2px edge, 4px radius); the primitive is untouched for other screens |
| `EmptyState` is shared; restyle affects other lists                         | Used only with message and optional CTA; HostListingsPage tests and screenshots checked (4.2, 7.4) |
| Modal looks finished but still has no focus trap or ESC                     | Stated in D6 and Open points; PR description lists it as the first follow-up                     |
| `us-4.1` checkout-redirect fails off port 5173 (pre-existing)               | Not edited; recorded as unchanged in the step 7 report                                           |

## Open points

None blocking. Recorded follow-ups (not in scope; copy them into the PR
description):

- **Modal accessibility.** Focus trap, initial focus and focus restore, ESC to
  close, backdrop click to close and body scroll lock are all missing. They need
  an `onClose` prop on `Modal` (API change across `CancelBookingModal`,
  `ReviewModal` and tests) and a keyboard test suite.
- **`Link > Button` nesting (issue #138).** `EmptyState` (kept here) and
  `HostListingsPage` still nest a `Button` in a `Link`; a shared link-capable
  `Button` variant (`asChild`) should replace the local CTA constants.
- **Copy changes (need `t()` work):** the timed-out path on the success page
  shows the confirmed copy (needs its own string, "payment is still processing");
  the catch branch of "Complete payment" in `MyBookingsPage` has no error message
  (the rejection is unhandled and silent); the English star `aria-label`
  (`"N stars"`) is hard-coded and not a dictionary string; booking dates render as
  raw ISO on the form but through `formatDate` on My bookings.
- **`Badge` pill in `packages/ui`.** The primitive still draws a pill and encodes
  tone mostly by colour; other screens still use it. A shape-per-tone `Badge`
  would let `MyBookingsPage` drop its local status tag.
- A shared `StatePanel` once three or more screens carry the same tile and panel.
