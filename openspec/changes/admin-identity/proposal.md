# Proposal: admin-identity

## Why

The landing, search, auth, listing detail, booking and host screens ship the
Gantry Signage identity in the warm palette (`refresh-visual-identity` NH-118,
`warm-palette-swap` NH-129, `auth-screens-identity` NH-125,
`listing-detail-identity` NH-126, `booking-payment-identity` NH-124,
`host-identity` NH-122). NH-118 D9 deferred the admin screens. The two screens
an admin uses to moderate the platform still render the pre-identity look:

- `AdminUsersPage` (`/admin/users`) draws a plain `<table>` in an
  `overflow-x-auto` wrapper with 1px muted rules, a `text-2xl font-bold` `h1`, a
  `Badge` pill whose tone carries the account state by colour (Active success,
  Disabled danger), roles as a raw `roles.join(", ")` string, and Disable
  (destructive) and Re-enable (secondary) buttons without a 44px target. The
  secondary button keeps the 1px border plus inset ring.
- `AdminListingsPage` (`/admin/listings`) has the same table, `h1` and button
  pair, and a `Badge` pill for the listing status (Published, Draft, Disabled)
  built from a local `statusLabel()` that duplicates the host labels. It is the
  last screen that shows the pill for those statuses, which `host-identity`
  already replaced with `ListingStatusTag`.
- Both pages render a skeleton with `rounded-pill` and `rounded-md` blocks and no
  `aria-busy`, a bare muted paragraph as the empty state and a bare
  `<p role="alert" class="text-danger">` outside `PageWrapper` as the error
  state. At 360px the table scrolls sideways and hides the status and the
  moderation action behind the scroll.
- Neither page handles a failed mutation (the `mutate` promise rejects
  unhandled). That is pre-existing and stays (see Out of scope).

`DESIGN.md` forbids all of these: radii 0 to 4px, no pills, no shadows or inset
rings as edges, state by outline shape and not colour alone, 44px targets.

Ticket NH-123 (GitHub issue #123): "Apply the Gantry Signage identity to the
admin screens". Refs #123; closes #123.

## What

Composition and styling only. Routes (`/admin/users`, `/admin/listings` under
`RoleGuard role="admin"`), API calls, queries and query keys, mutations,
handlers, `disabled` conditions, `t()` strings and accessible names stay.

- **Admin users.** One black `h1` in the heavy Overpass weight, no ember band.
  A local `AccountStatusTag` replaces `Badge`: Active solid ink edge plus an
  8px ink square marker; Disabled solid muted edge, muted struck text; no pill.
  The label is the tag's only text node and reuses the existing `admin.users.*`
  strings. Roles stay as plain muted text (`roles.join(", ")`, no role badges).
- **Admin listings.** Same `h1`. The shared `ListingStatusTag` from
  `host-identity` replaces `Badge` as is (draft dashed, published solid with a
  marker, disabled solid muted and struck). The local `statusLabel()` is
  deleted; `listingTypeLabel()` stays. No `Badge` is left on an admin page.
- **Lists.** From `sm` up, a flat table with a 2px ink head rule, bold ink
  headings and 1px muted row rules. Below `sm`, flat 2px-edged cards (title or
  email, status tag, a `dl` with the existing `*_col` labels, the action). Only
  one layout is exposed to assistive technology and the document never scrolls
  horizontally at 360px. Same pattern as `HostUpcomingPage`.
- **Moderation actions.** Disable and Re-enable are 44px real `Button`s with
  the same handlers and names. Disable stays destructive (paper label on
  danger); Re-enable stays secondary with a local `FLAT_SECONDARY` override for
  a solid 2px edge. Full width inside the cards.
- **States.** Flat `aria-busy` skeleton (no pills, square blocks, no `h1`); the
  empty state is a local dashed 2px panel with the existing text; the error
  state is a danger `StatePanel` inside `PageWrapper` with one `h1` (existing
  `error.generic.unexpected`) and exactly one `role="alert"`.
- Write the surface brief
  `apps/web/.impeccable/surfaces/src-pages-adminuserspage-tsx.md`, extend
  `apps/web/DESIGN.md` with an "Admin screens" subsection under Components and
  update the `DESIGN.md` sidecar `design.json`.

**Copy: no `t()` key is added, removed or renamed and no dictionary value
changes.** A dictionary-unchanged test guards it.

## Impact

- **Capabilities affected**: `platform` (adds requirements for the admin users
  page, admin listings page, account state tag, listing status in admin, admin
  lists, moderation actions, admin states, contrast, 360 px/keyboard/motion and
  no behaviour change). `admin` (or the capability that owns moderation) is
  **consumed unchanged**: its scenarios constrain routes, API calls and visible
  content ("status shows Disabled" still holds with a tag), so no `## MODIFIED`
  entry is needed.
- **Breaking changes**: no. No API, schema, route, `t()` key or shared primitive
  prop change. No new dependency. `packages/ui` is not touched.
- **Migration required**: no. No backend, Prisma or API-client change.
- **Out of scope**: the `Badge` pill in `packages/ui` (it stays; after this
  change its only consumer is the `ListingCard` accent tab, which already
  overrides it; the primitive fix belongs to #138); a link-capable `Button` and
  the `FLAT_SECONDARY` override (#138); role badges and any new copy; new
  filters, search, pagination or dialogs; error handling for the Disable and
  Re-enable mutations (pre-existing unhandled rejection, documented follow-up);
  a shared `StatePanel` / `StatusTag` extraction; any backend, route, API, query
  or mutation change.

## Risks & Mitigations

| Risk                                                                                                   | Likelihood | Mitigation                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Table and cards both exist in the DOM, so strict `getByText("Disabled")` / button locators match twice | High       | Scope unit queries (`within(table)`, `within(list)`, `getAllBy`); e2e uses `.filter({ visible: true })`; no assertion is weakened |
| Re-enable keeps a 1px edge plus inset ring if `FLAT_SECONDARY` is forgotten                            | Medium     | Class asserted in unit test and computed border width in e2e; override tracked in #138                                            |
| Status shown by colour alone after dropping `Badge`                                                    | Medium     | Shape per state (solid plus marker, solid muted struck) plus text; unit and e2e assert border and decoration                      |
| Danger text or fill placed on a surface that fails AA                                                  | Low        | Danger only on paper or `danger-bg`; contrast table in design.md                                                                  |
| Error state moves inside `PageWrapper`, so the alert and `h1` change position                          | Low        | Unit test asserts one `h1` and exactly one `role="alert"`; existing error copy unchanged                                          |
| Fifth local copy of `FLAT_SECONDARY` / `StatePanel`                                                    | Known      | Accepted per `host-identity` D1; shared extraction with `StatusTag` and a link-capable `Button` is a follow-up (#138)             |
| Failed Disable or Re-enable mutation still rejects unhandled                                           | Known      | Pre-existing and out of scope (behaviour unchanged); documented as follow-up                                                      |
| `Badge` pill remains in `packages/ui`                                                                  | Known      | Untouched by design; only the `ListingCard` accent tab (local override) uses it afterwards; primitive fix is #138                 |

## Rollout

Big bang in one PR; no flag. The PR description links the change-id, says
"Refs #123; closes #123", attaches the 1440 px and 360 px screenshots and lists
the follow-ups from design.md Open points.
