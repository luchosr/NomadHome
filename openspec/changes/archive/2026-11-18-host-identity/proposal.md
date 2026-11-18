# Proposal: host-identity

## Why

The landing, search, auth, listing detail and booking screens ship the Gantry
Signage identity in the warm palette (`refresh-visual-identity` NH-118,
`warm-palette-swap` NH-129, `auth-screens-identity` NH-125,
`listing-detail-identity` NH-126, `booking-payment-identity` NH-124). NH-118
D9 deferred the host screens. The screens a host uses every day to run their
listings still render the pre-identity look:

- `HostListingsPage` (`/host/listings`) shows `Card` rows with a 1px edge plus
  inset ring, a `rounded-lg` thumbnail that is an empty stone square when there
  is no photo, a `Badge` pill whose tone carries the status by colour, a
  `Button` nested in a `Link` for New listing and Edit, a skeleton with
  `rounded-pill` and `rounded-md` blocks, a bare muted paragraph as the empty
  state and a bare danger paragraph, outside `PageWrapper`, as the error state.
- `HostUpcomingPage` (`/host/upcoming`) draws its table with 1px muted rules and a
  `fg-subtle` medium-weight head, a `Badge` pill per booking status and the same
  bare error paragraph.
- `CreateListingForm` and `ListingDetailsForm` use light `fg-muted` labels, 1px
  muted `rounded-md` selects and textareas next to the 2px `Input`, plain
  `text-xs` hints and errors, a 16px native checkbox with `accent-action`, and a
  bare danger paragraph for the server or save error. `ListingDetailsForm`
  duplicates the `AmenityCheckboxGrid` markup inline.
- `EditListingPage` shows a `Badge` pill for the listing status, a bare danger
  paragraph for the publish error and for the not-found state.
  `ListingPhotosCard` renders its upload error in `text-red-600` (outside the
  token set, no `role`) and `rounded-md` photos; `ListingAvailabilityCard` uses
  `rounded-md` 1px rows and a bare danger paragraph.
- `BecomeHostPage` has a 16px `rounded` terms checkbox and a bare `text-xs`
  error under it, unlike the `FormField` grammar of the two fields above it.

`DESIGN.md` forbids all of these: radii 0 to 4px, no pills, no shadows or inset
rings as edges, state by outline shape and not colour alone, 44px targets.

Ticket NH-122 (GitHub issue #122): "Apply the Gantry Signage identity to the
host dashboard and listing forms". Refs #122; closes #122.

## What

Composition and styling only. Routes, queries and query keys, mutations,
handlers, `react-hook-form` registration and options (`noValidate`,
`valueAsNumber`, `isValid` gate), `disabled` conditions, the hidden file input,
`t()` strings, accessible names and every `href` stay.

- **Host listings.** Black `h1`; New listing and Edit become single `<Link>`s
  styled with local CTA constants (same `href`, same name, 44px). Rows become
  flat 2px ink panels; the thumbnail is a square frame with a 2px ink edge and,
  with no photo, a bed (property) or desk (workspace) `Pictogram` tile. A shared
  `ListingStatusTag` replaces `Badge`: draft dashed, published solid with a
  marker, disabled solid muted and struck, label strings unchanged.
- **Host bookings.** Black `h1`; a flat table with a 2px ink head rule and bold
  ink head; a local booking status tag with the `MyBookingsPage` shape grammar;
  the table keeps its own horizontal scroll wrapper at 360px. `EmptyState` is
  used unchanged.
- **States.** Flat `aria-busy` skeletons (no pills); listings empty is a local
  dashed panel with the existing `host.listings.no_listings` text and no CTA;
  the error state on host listings, host bookings and edit listing is a
  `role="alert"` danger panel with a filled tile and one `h1` reusing
  `error.generic.unexpected`.
- **Listing forms.** The `FormField` grammar on Create (bold ink label, 2px ink
  edge, radius 2px or less, danger edge when invalid, left-bar hint and error)
  and the same labels and controls on Edit (no per-field errors added). Shared
  field-class constants for the two forms. `AmenityCheckboxGrid` becomes the
  only amenity grid, with a square 2px real checkbox and a 44px target.
  Server, save, publish, upload and block errors render through
  `ServerErrorAlert`. Submit buttons are 44px.
- **Edit cards.** Photos and availability stay in the `Card` primitive with a
  bold ink `h2`; photos framed square; destructive buttons stay on paper.
- **Become host.** One `h1`; terms checkbox square, 44px target, error in the
  `FormField` left-bar grammar. No ember band on any host screen.
- Write the surface brief
  `apps/web/.impeccable/surfaces/src-pages-hostlistingspage-tsx.md` and extend
  `apps/web/DESIGN.md` with a "Host dashboard and listing forms" subsection.

**Copy: no `t()` key is added, removed or renamed and no dictionary value
changes.** The hard-coded `Photo N` alt in `ListingPhotosCard` is kept as is.

## Impact

- **Capabilities affected**: `platform` (adds requirements for the host listings
  page, listing status tag, host bookings page, host states, listing form field
  grammar, amenity checkbox, edit cards, create/edit/become-host composition,
  contrast, and 360 px/keyboard/no-behaviour-change). `listings`,
  `host-tooling`, `bookings` and `identity` are **consumed unchanged**: their
  scenarios constrain routes, API calls and visible content ("status badge
  updates to Published" still holds with a tag), so no `## MODIFIED` entry is
  needed.
- **Breaking changes**: no. No API, schema, route, `t()` key or shared primitive
  prop change. No new dependency. `packages/ui` is not touched.
- **Migration required**: no. No backend, Prisma or API-client change.
- **Out of scope**: `EmptyState` and `Modal` (untouched); the `Badge` pill in
  `packages/ui` (so `AdminListingsPage` stays inconsistent until #123); a
  link-capable `Button` and the `FLAT_SECONDARY` override (#138); listing photo
  treatment beyond the frame (#121); a shared booking `StatusTag` extraction;
  copy changes, including the hard-coded `Photo N` alt; per-field errors on the
  Edit form; any change to validation, publish rules or uploads.

## Risks & Mitigations

| Risk                                                                                | Likelihood | Mitigation                                                                                                    |
| ----------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `us-2.2` `getByText("Published")` / `getByText("Draft")` hit two nodes              | Medium     | The tag holds the label as its only text node; the marker is an `aria-hidden` empty `span`; e2e re-run        |
| Form restyle drops a `register` option, `noValidate` or the `isValid` gate          | Medium     | Only `className` and wrappers change; unit tests assert submit disabled state and payload unchanged           |
| Status shown by colour alone after dropping `Badge`                                 | Medium     | Shape per status (dashed, solid plus marker, struck) plus text; unit and e2e assert border and decoration     |
| Host bookings table overflows the page at 360px                                     | Medium     | Own `overflow-x-auto` wrapper on the table only; e2e asserts no document-level horizontal overflow at 360     |
| Restyled checkbox stops being a real input (keyboard, form state, label click)      | Low        | `appearance-none` on the native `input`; glyph is an `aria-hidden` sibling; tests use `getByRole("checkbox")` |
| Struck "Disabled" tag becomes hard to read                                          | Low        | `fg-muted` on paper 10.20:1, muted edge 4.93:1; e2e asserts computed colour and `line-through`                |
| Error panel `h1` plus `ServerErrorAlert` yields two `role="alert"` in one state     | Low        | Page error states render only the panel; unit tests assert exactly one `role="alert"`                         |
| Host screens stay inconsistent with Admin listings (`Badge`) and secondary `Button` | Known      | `packages/ui` untouched by design; tracked in #123 and #138                                                   |

## Rollout

Big bang in one PR; no flag. The PR description links the change-id, says
"Refs #122; closes #122", attaches the 1440 px and 360 px screenshots and lists
the follow-ups from design.md Open points.
