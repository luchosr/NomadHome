# Design: admin-identity

Ticket NH-123 (#123). Follow-up of `refresh-visual-identity` (NH-118) D9, which
deferred the admin screens. Builds on `warm-palette-swap` (NH-129),
`auth-screens-identity` (NH-125), `listing-detail-identity` (NH-126),
`booking-payment-identity` (NH-124) and `host-identity` (NH-122). Frontend only:
no backend, schema, route, API, API-client, query, mutation or `t()` key change,
no `packages/ui` change, and no new filter, search, pagination or dialog. These
screens are **Operate mode** (scan accounts or listings, read a state, act on
one row), so ambition shows as precision: one clear layout per breakpoint,
shape-coded state, 44px actions and complete accessibility, not extra
decoration or features.

## Files in scope

| File                                                                  | Change                                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/web/src/pages/AdminUsersPage.tsx`                               | Heavy `h1`, local `AccountStatusTag`, table plus cards, 44px actions, states |
| `apps/web/src/pages/AdminListingsPage.tsx`                            | Heavy `h1`, `ListingStatusTag`, table plus cards, 44px actions, states       |
| `apps/web/src/pages/AdminUsersPage.test.tsx`                          | Extend (structure, tag shape, both layouts, states, scoped queries)          |
| `apps/web/src/pages/AdminListingsPage.test.tsx`                       | Extend (same; no `Badge`, `ListingStatusTag` reused)                         |
| `apps/web/src/pages/AdminCopy.test.ts` (new)                          | Dictionary-unchanged guard, as `HostCopy.test.ts`                            |
| `apps/web/e2e/us-8.1-admin-users.spec.ts`                             | Scope strict locators to the visible layout                                  |
| `apps/web/e2e/us-8.2-admin-listings.spec.ts`                          | Scope strict locators to the visible layout                                  |
| `apps/web/e2e/admin-identity.spec.ts` (new)                           | Computed colour, border style, layout and focus checks at 1440 and 360       |
| `apps/web/DESIGN.md`                                                  | Add the "Admin screens" composition under Components (what shipped)          |
| `apps/web/.impeccable/surfaces/src-pages-adminuserspage-tsx.md` (new) | Surface brief                                                                |
| `apps/web/DESIGN.md` sidecar (`design.json`)                          | Add the admin entry                                                          |
| `openspec/changes/admin-identity/reports/*`                           | Verification reports and screenshots                                         |

Read but **not** changed: `packages/ui` (`Button`, `Badge`, `Skeleton`),
`ListingStatusTag.tsx`, `ListingCard.tsx` (already overrides `Badge` locally),
`PageWrapper.tsx`, `HostUpcomingPage.tsx` (pattern source), the admin hooks and
mutations, `router.tsx` (routes under `RoleGuard role="admin"`),
`apps/web/src/api/*`, `apps/web/src/lib/*`, `en.ts`.

## D1. Local constants per file

Each admin page declares the pieces only it uses at module top, as the host,
booking and listing detail pages already do:

```
FLAT_SECONDARY = border-2 ![box-shadow:none]
```

`StatePanel` (error and the empty dashed panel) is a local function in each
page. `FLAT_SECONDARY` is passed to the Re-enable secondary `Button` to replace
the 1px border plus inset ring with a solid 2px edge, the accepted per-file
override from NH-124 and NH-122 (tracked in #138). The only shared piece reused
is `ListingStatusTag` (D4); nothing new is extracted.

| Option                                | Verdict  | Why                                                                       |
| ------------------------------------- | -------- | ------------------------------------------------------------------------- |
| Local constants per file (chosen)     | Chosen   | Matches shipped pages, zero `packages/ui` change, one reviewable diff     |
| Shared `StatePanel` / `StatusTag` now | Deferred | Cross-area extraction (booking, listing detail, host, admin); Open points |
| Shared `Button` variant for flat edge | Rejected | Needs a primitive change; belongs to #138                                 |

## D2. Local `AccountStatusTag` in `AdminUsersPage`

The account state has one consumer, so the tag is a local function in
`AdminUsersPage.tsx`, with the anatomy of `ListingStatusTag`: `inline-flex
items-center gap-2 rounded-sm border-2 px-2 py-1 text-xs font-bold
bg-surface-raised`.

| State    | Edge                 | Fill  | Text                       | Extra cue                    |
| -------- | -------------------- | ----- | -------------------------- | ---------------------------- |
| Active   | **solid** ink        | paper | ink                        | 8px filled ink square marker |
| Disabled | solid `border-muted` | paper | `fg-muted`, `line-through` | struck text                  |

The label is the tag's only text node (the existing `admin.users.*` strings for
Active and Disabled); the marker is an empty `aria-hidden` sibling `span`, so
`getByText("Active")` and `getByText("Disabled")` stay a single match within one
layout. No pill, no tone colour. A shared account tag is not needed: there is no
second consumer.

## D3. Roles stay raw plain text

Roles keep `roles.join(", ")` rendered in `fg-muted` plain text. A role is an
attribute of the account, not a state, so it gets no tag and no shape code; role
badges would add visual weight to the one column that never changes the action
an admin takes. No new copy is introduced. Cards show it in the `dl` under the
existing roles column label.

## D4. Listing status reuses `ListingStatusTag`; `Badge` is not edited

`AdminListingsPage` renders `ListingStatusTag({ status })` exactly as the host
screens do (labels from the unchanged `host.listings.status_*` keys). The local
`statusLabel()` and the `Badge` import are deleted; `listingTypeLabel()` stays.
After this change no admin page imports `Badge`.

`Badge` in `packages/ui` is **not** edited: `ListingCard.tsx:48` is its only
other consumer and already carries a local override, so after this change the
primitive is used only by the `ListingCard` accent tab. Fixing the primitive
itself (shape per tone, no pill) belongs to #138 and would be a `packages/ui`
change outside this ticket.

| Option                                  | Verdict  | Why                                                                |
| --------------------------------------- | -------- | ------------------------------------------------------------------ |
| Reuse `ListingStatusTag` as is (chosen) | Chosen   | Same three statuses and labels as host; zero new component         |
| Edit `Badge` to drop the pill           | Rejected | `packages/ui` change; would touch `ListingCard`; #138              |
| New admin-only listing tag              | Rejected | Duplicates `ListingStatusTag`; two tags for one status drift apart |

## D5. Cards below `sm`, table from `sm` up

Same decision as `host-identity` D18, for the same reason: at 360px a table
behind a horizontal scroll hides the status tag and the moderation action. Each
page renders both layouts from the same data and only one is displayed.

- **Table** (`div.hidden.sm:block.overflow-x-auto`): `thead tr` has `border-b-2
border-border`; `th` is `font-bold text-fg`, same `text-left` and padding.
  Body rows keep a 1px `border-border-muted` rule. Primary cell ink; email,
  roles, type and city `fg-muted`. The `overflow-x-auto` is only a safety net
  from 640px up.
- **Cards** (`ul.sm:hidden`): each `li` is `min-w-0 rounded-card border-2
border-border bg-surface-raised p-4`, no shadow, no ring.
  - Users card: email (`break-all`, bold) beside the `AccountStatusTag`; a `dl`
    with Roles and any other existing columns, labelled with the existing
    `admin.users.*_col` keys; the action at the bottom.
  - Listings card: title (`font-bold`, `break-words`, `min-w-0` column) beside
    the `ListingStatusTag`; a line with type and city; the host email
    (`break-all`); then the action.
- Both layouts use display none when inactive, so one layout is in the
  accessibility tree and no text is announced twice. Data and formatting are
  shared (no new helpers).

## D6. Headings, no ember band

Each admin screen has exactly one `h1`, with the recipe `m-0 mb-6 text-3xl
font-black leading-solid text-fg md:text-4xl` (Overpass 900). No ember title
band (that is the Auth grammar; these are work screens). Ember does not appear
on any admin screen; the destructive action is danger on paper and the
secondary action is ink on paper.

## D7. Copy

No `t()` key is added, removed or renamed and no string value changes. Roles
are raw data, not copy. A unit test `AdminCopy.test.ts`, modelled on
`HostCopy.test.ts`, snapshots as literals every key these screens read
(`admin.users.*`, `admin.listings.*`, `host.listings.status_*`,
`error.generic.unexpected`) and asserts they equal baseline. **Copy changes:
none.**

## D8. Tests

jsdom ignores media queries, so both layouts exist in the DOM and existing
single-match queries must be scoped deliberately, as `host-identity` did for
`us-7.1` with `.filter({ visible: true })`:

- **Unit (Vitest + Testing Library), red first.** `getByText("Active")`,
  `getByText("Disabled")` and `getByRole("button", { name: /disable/i })` become
  `within(table)` / `within(list)` queries or `getAllBy` with a length assert.
  New cases: one `h1`; no pill (`rounded-pill` absent) and no `Badge`; tag shape
  per state (solid plus marker, `line-through` on disabled); `ListingStatusTag`
  reused on listings; head row `border-b-2`; table container `hidden sm:block`,
  card list `sm:hidden`; actions `min-h-11`; Re-enable carries `FLAT_SECONDARY`
  classes; loading has `aria-busy`, no `h1`, no `rounded-pill`; empty shows the
  existing text in a dashed panel; error is one `h1` and exactly one
  `role="alert"`; mutations still fire with the same arguments and invalidate
  the same query keys.
- **E2E (Playwright, mocked API)** `admin-identity.spec.ts`, patterned on
  `host-identity.spec.ts`, at 1440x900 and 360x800 (no hard-coded 5173; base URL
  from config): table head rule 2px ink; tag border styles per state and
  `line-through` on disabled; Re-enable border 2px; action min height 44px; card
  edge 2px ink and radius at most 4px at 360; error panel danger edge and tint;
  no element with a box shadow or gradient; no document horizontal overflow at
  360; Tab reaches each action once and shows the 3px ink outline.
- **Existing specs.** `us-8.1-admin-users` and `us-8.2-admin-listings` strict
  `getByText("Disabled")` and `getByRole("button", { name: /re-enable/i })`
  match the hidden layout too; they are scoped to the visible match with
  `.filter({ visible: true })`. No assertion is weakened. Screenshots are
  attached to the report, never compared.

## D9. Docs

`apps/web/DESIGN.md` gets an "Admin screens" subsection under Components (list
layouts, account state tag, reuse of the listing status tag, moderation
actions, state panels, no ember); the Overview sentence listing the screens
mentions admin. The surface brief
`apps/web/.impeccable/surfaces/src-pages-adminuserspage-tsx.md` follows the host
brief format (frontmatter `version: 1`, `slug`, `primary_target:
"src/pages/AdminUsersPage.tsx"`, `related_targets: ["src/pages/AdminListingsPage.tsx"]`;
scope and mode, audience, job, action, proof, constraints, direction contract,
unresolved decisions). The `design.json` sidecar gets the matching entry.
Verification reports and screenshots go under
`openspec/changes/admin-identity/reports/`. No palette or token change.

## D10. AdminUsersPage

- **Frame.** `PageWrapper`; `h1` (D6).
- **Layouts.** D5. Same data, same row key, same handlers.
- **Status.** `AccountStatusTag` (D2); roles plain text (D3).
- **Actions.** Active accounts show Disable (`variant="destructive"`), disabled
  accounts show Re-enable (`variant="secondary"` plus `FLAT_SECONDARY`); both
  `min-h-11`, `w-full sm:w-auto` in cards, same `onClick`, same label and
  accessible name, same `disabled` while the mutation is pending. No per-row
  accessible name is added (a pre-existing gap that stays unchanged).
- **Loading.** Flat skeleton wrapped in `aria-busy="true"`: square
  `rounded-none` blocks, no pill, no `h1`.
- **Empty.** Local dashed panel: `border-2 border-dashed border-border
bg-surface-raised px-6 py-12`, the existing empty text in `fg-muted`.
- **Error.** Inside `PageWrapper`, a danger `StatePanel`: `role="alert"`, 2px
  solid danger edge, `bg-danger-bg`, 48px filled danger tile with a paper "!"
  (`aria-hidden`), and `error.generic.unexpected` as the state's only `h1`, bold
  danger. Exactly one `role="alert"`.

## D11. AdminListingsPage

Same as D10 with: `ListingStatusTag` (D4) in place of the account tag; the
Disable and Re-enable pair keyed on the listing status exactly as today; the
type line from `listingTypeLabel()`; the card layout from D5 (title bold, type
and city line, host email, status tag, action).

## D12. Accessibility, 360 px and motion checklist

- One `h1` per screen and per error state; loading states have none.
- State is never colour alone: solid plus marker, solid muted struck, dashed
  listing draft; filled "!" tile on errors.
- Exactly one `role="alert"` per error state.
- Focus order equals DOM equals visual order; each action one tab stop; the
  global two-layer focus ring is never clipped (no `overflow-hidden` on panels
  that contain focusable content).
- Targets: Disable and Re-enable are 44px in both layouts.
- 360 px: single column, `min-w-0` and `break-words` on titles, `break-all` on
  emails, action full width in cards; no document-level horizontal scroll and no
  content hidden behind a scroll.
- Reduced motion: only colour transitions; the skeleton pulse is already off
  under `prefers-reduced-motion`.

## D13. No behaviour change

Routes, `RoleGuard role="admin"`, API calls, queries and query keys, mutations
and their invalidation, `disabled` conditions, accessible names and every
visible string are unchanged. The mutations still have no error handling (the
`mutate` promise rejects unhandled when the request fails); this is pre-existing
and kept as is, recorded in Open points.

## Computed contrast table

Script (same WCAG 2.1 formula as `packages/ui/src/contrast.test.ts` and
`host-identity`):

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
#F8E1E0, fg-muted #3F3B37, border-muted #6F6A63.

| ID  | Pairing (where on these screens)                                              | Colours           | Ratio | Needs | Result                       |
| --- | ----------------------------------------------------------------------------- | ----------------- | ----- | ----- | ---------------------------- |
| A1  | Ink on paper: `h1`, table head, titles, emails, Active and Published tag text | #1E1E1E / #F7F5F2 | 15.32 | 4.5   | pass                         |
| A2  | Muted ink on paper: roles, type, city, cells, empty text, struck "Disabled"   | #3F3B37 / #F7F5F2 | 10.20 | 4.5   | pass                         |
| A3  | Ink edge on paper: cards, tags, head rule                                     | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| A4  | Ink dashed edge on paper: empty panel, draft listing tag                      | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| A5  | Muted edge on paper: Disabled tag edge, table row rules                       | #6F6A63 / #F7F5F2 | 4.93  | 3     | pass                         |
| A6  | Ink marker square in Active and Published tags (non-text)                     | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| A7  | Ink on stone: Re-enable hover fill                                            | #1E1E1E / #E5E2DD | 12.90 | 4.5   | pass                         |
| A8  | Paper on danger: Disable label, "!" tile glyph                                | #F7F5F2 / #9B1C2E | 7.42  | 4.5   | pass                         |
| A9  | Danger on danger-bg: error panel `h1` (bold)                                  | #9B1C2E / #F8E1E0 | 6.48  | 4.5   | pass                         |
| A10 | Danger edge on danger-bg: error panel (non-text)                              | #9B1C2E / #F8E1E0 | 6.48  | 3     | pass                         |
| A11 | Ink focus outline on paper and stone (actions)                                | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass (stone 12.90)           |
| N1  | Not used: paper text on ember                                                 | #F7F5F2 / #E65F35 | 3.19  | 4.5   | fails, so never placed there |
| N2  | Not used: muted ink on ember                                                  | #3F3B37 / #E65F35 | 3.20  | 4.5   | fails, so never placed there |
| N3  | Not used: danger on ember                                                     | #9B1C2E / #E65F35 | 2.33  | 4.5   | fails, so never placed there |

Notes: every pairing reuses a ratio already computed in the `host-identity`
table (H1, H2, H5 to H7, H9, H11 to H16) from the same shipped tokens; no new
pairing and no new colour value is introduced. The final numbers are re-computed
with the script above at implementation time and recorded in the verification
report. No ember surface exists on the admin screens, so N1 to N3 are recorded
only as guards. Danger text sits on paper or the danger tint only.

## Risks

| Risk                                                                      | Mitigation                                                                                          |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Duplicated DOM breaks strict locators (unit and e2e)                      | Scope with `within`, `getAllBy` or `.filter({ visible: true })`; no assertion weakened (D8)         |
| Re-enable keeps a 1px edge plus inset ring if `FLAT_SECONDARY` is dropped | Unit test on the class; e2e asserts computed 2px border; #138 tracks the primitive fix              |
| Tag state read by colour alone                                            | Shape per state plus text; unit and e2e assert border style and `line-through`                      |
| Danger used on a failing surface                                          | Danger only on paper or `danger-bg` (A8 to A10); no ember surface                                   |
| Error state moves inside `PageWrapper`                                    | One `h1` and exactly one `role="alert"` asserted in unit tests                                      |
| Fifth copy of `FLAT_SECONDARY` and `StatePanel`                           | Accepted (D1); shared extraction with `StatusTag` and a link-capable `Button` is a follow-up (#138) |
| Mutations without error handling                                          | Pre-existing, behaviour unchanged (D13); documented follow-up                                       |
| `Badge` pill remains in `packages/ui`                                     | Untouched (D4); only the `ListingCard` accent tab, already overridden, uses it; fix is #138         |

## Open points

None blocking. Recorded follow-ups (not in scope; copy them into the PR
description):

- **Shared `StatePanel` and `StatusTag` extraction.** The danger panel is now
  local in both admin pages besides the host pages, `ListingDetailPage` and
  `BookingFormPage`; the account tag and the booking tag are local too. Extract
  them together with a shape-per-tone `Badge`.
- **`Badge` pill in `packages/ui` and `FLAT_SECONDARY` (#138).** After this
  change `Badge` is used only by the `ListingCard` accent tab (local override);
  `FLAT_SECONDARY` remains a per-file override of the secondary `Button`.
- **Mutation error handling.** Disable and Re-enable on both pages reject
  unhandled when the request fails; add error handling (and its copy) in a
  separate ticket.
- **Per-row accessible names.** Disable and Re-enable carry the same name on
  every row; naming them per account or listing needs new copy and is a
  separate ticket.
- **Disabled tag legibility.** The 12px muted struck label (10.20:1 text, 4.93:1
  edge) passes AA but is borderline to read; revisit with the shared `StatusTag`.
