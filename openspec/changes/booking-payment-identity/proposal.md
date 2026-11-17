# Proposal: booking-payment-identity

## Why

The landing, search, auth and listing detail screens ship the Gantry Signage
identity in the warm palette (`refresh-visual-identity` NH-118,
`warm-palette-swap` NH-129, `auth-screens-identity` NH-125,
`listing-detail-identity` NH-126). The screens a guest meets next, at the
moment of paying and afterwards, still render the pre-identity look:

- `BookingFormPage` (`/listings/:id/book`) shows a `rounded-xl` card with a
  `shadow-sm` and a 1px muted edge, a bare photo, `text-fg-subtle` type, a
  `border-t` hairline above the total, a bare `Button` nested in a `Link` for the
  back action, and bare danger paragraphs for the no-dates, 404, quote-error and
  server-error states.
- `BookingSuccessPage` and `BookingCancelPage` are unframed centred text with a
  `Button` nested in a `Link`; the waiting state is a muted paragraph over
  `rounded-sm` skeleton bars.
- `MyBookingsPage` lists bookings in `Card` rows with a `Badge` pill for the
  status (tone by colour), a skeleton with `rounded-pill` and `rounded-md`
  blocks, and a bare danger paragraph as the error state.
- `Modal`, `CancelBookingModal` and `ReviewModal` carry a `shadow-md`, a 1px
  muted `rounded-md` textarea, a light 11px label, a danger paragraph for the
  error, unicode `★`/`☆` characters for the rating and a `text-warning` tone.
- `EmptyState` is a `rounded-xl` card with a 1px muted edge and a stroke icon.

`DESIGN.md` forbids all of these: radii 0 to 4px, no pills, no shadows, no
unicode glyphs as icons, state by outline shape and not colour alone.

Ticket NH-124 (GitHub issue #124): "Apply the Gantry Signage identity to the
booking and payment screens". Refs #124; closes #124.

## What

Composition and styling only. Behaviour, data fetching, routes, Stripe checkout
and its redirect, polling and sync on the success page, status logic, query
keys, validation and every `t()` key stay.

- **Booking form.** The summary becomes a paper sign panel (2px ink edge, 4px
  radius, no shadow) with an ember band that holds the total in **ink** (existing
  strings only). The listing photo is framed with a 2px ink edge. Dates and the
  service fee stay plain text (the e2e reads the raw ISO dates). Pay now stays a
  real `Button`. The no-dates action and the back action become a single `Link`
  styled with local button-class constants (the `ListingDetailPage` pattern: one
  tab stop, valid HTML). The server error uses the shipped `ServerErrorAlert`.
  The no-dates, loading (flat skeleton), 404 and quote-error states become sign
  panels; the error ones are `role="alert"` danger panels with a filled tile.
- **Booking success.** The success state (and the no-`bookingId` or timed-out
  path, which today shows the same success copy) is an ember sign panel with an
  ink check tile and ink text only. The waiting state is a dashed stone panel
  with `role="status"` and `aria-busy`, with a flat skeleton. `#bookingId` stays
  one text node. The view-bookings CTA is a single link.
- **Booking cancel.** A neutral paper sign panel with an outlined tile; the two
  CTAs (back to listing, back to search) become single links; roles, names and
  hrefs are kept.
- **My bookings.** Flat bordered cards that keep the `rounded-card` class (the
  e2e locates cards by it). A local status tag in the page file replaces
  `Badge`: shape per status plus text (pending dashed, confirmed solid ink,
  cancelled struck with a solid muted edge, completed solid with a filled
  marker); the label strings are unchanged. Flat skeleton (no pills). The error
  is a `role="alert"` danger sign panel. Action buttons are unchanged in role and
  name.
- **Modals.** `Modal` loses the shadow and gains a 2px ink edge and a flat
  backdrop, with no behaviour change. `CancelBookingModal` and `ReviewModal` get
  a 2px ink textarea, a bold label (the `FormField` grammar), the error as
  `ServerErrorAlert` or the left-bar grammar inside the dialog, a drawn star glyph
  in place of the unicode stars (aria-labels such as "4 stars" unchanged), a
  two-layer ink and paper focus ring and a flat success panel. The `setTimeout`
  behaviour is kept.
- **EmptyState** is restyled in place (flat, 2px dashed ink edge, no `rounded-xl`).
  Its nested `Link > Button` stays (issue #138).
- Write the surface brief
  `apps/web/.impeccable/surfaces/src-pages-bookingformpage-tsx.md` and extend
  `apps/web/DESIGN.md` with a "Booking and payment" subsection.

**Copy: no `t()` key is added, removed or renamed and no dictionary value
changes.** A dictionary-unchanged test guards this. The only visible text
difference is that the unicode `★`/`☆` literals in `ReviewModal` are replaced by
a drawn glyph (they were never dictionary strings).

## Impact

- **Capabilities affected**: `platform` (adds requirements for the booking and
  payment identity, state panels, my-bookings status tags, modals, empty state,
  contrast, 360 px/keyboard behaviour and no-behaviour-change). The `bookings`,
  `payments` and `reviews` capabilities are **consumed unchanged**: their
  scenarios constrain behaviour and content by role and name, and none changes,
  so no `## MODIFIED` entry is needed.
- **Breaking changes**: no. No API, schema, route, `t()` key or shared primitive
  prop change. No new dependency. `packages/ui` is not touched.
- **Migration required**: no. No Prisma change, no data migration, no backend
  change, no API-client change.
- **Out of scope**: Modal accessibility behaviour (focus trap, initial focus and
  restore, ESC, backdrop close, scroll lock), which needs an `onClose` prop on
  `Modal`; copy changes (timeout versus success on the success page, the catch
  message for "Complete payment", English star aria-labels, ISO dates versus
  `formatDate`); the `Badge` pill in `packages/ui`; the nested `Link > Button` in
  `EmptyState` and `HostListingsPage` (#138); any Stripe, redirect, polling or
  status-logic change.

## Risks & Mitigations

| Risk                                                                                    | Likelihood | Mitigation                                                                                                          |
| --------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Existing e2e/unit tests break on structure (`.rounded-card`, "Cancelled", `/cancel/`)   | Medium     | Class and text kept by design; review pass before implementation (task 4); `/cancel/` single match asserted         |
| Total row restructure breaks `getByText(/^total$/i).closest("div")`                     | Medium     | Label and amount stay siblings in one `div`; unit test asserts the closest-div query still returns the amount       |
| Text on the ember band (total, success panel) drifts to a muted or paper colour         | Medium     | Ink by construction; computed-colour e2e on every text node on each ember surface; contrast table N1 to N3          |
| Status shown by colour alone after dropping `Badge`                                     | Medium     | Shape per status (dashed, solid, struck, marker) plus text; unit and e2e assert border style and text-decoration    |
| Modal restyle is mistaken for an a11y fix                                               | Medium     | D6 and Open points state the gap explicitly; no behaviour change asserted; follow-up recorded for the PR            |
| Single `Link` CTA loses the keyboard focus ring or target size                          | Low        | Local classes carry `min-h-11`; global two-layer ring; e2e Tab test per page                                        |
| `us-4.1` hard-coded `localhost:5173` mocked checkout URL fails off port 5173            | Known      | Not edited; the isolated-port run records it as pre-existing and unchanged by this change (task 7.3)                |
| Hand-drawn glyphs (check, cross, star, tiles) drift from the 24-grid stroke rules       | Low        | Authored on a 24 viewBox, square joins, reviewed in the visual check                                                |

## Rollout

Big bang in one PR; no flag. The PR description links the change-id, says
"Refs #124; closes #124", attaches the 1440 px and 360 px screenshots and lists
the follow-ups from design.md Open points.
