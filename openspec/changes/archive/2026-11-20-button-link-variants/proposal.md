# Proposal: button-link-variants

## Why

The Gantry Signage identity shipped screen by screen (`refresh-visual-identity`
NH-118, `listing-detail-identity` NH-126, `booking-payment-identity` NH-124,
`host-identity` NH-122, `admin-identity` NH-123). Each of those changes recorded
the same two deviations from `DESIGN.md` and deferred them to #138, because
fixing them needs a `packages/ui` change:

- **Links styled as buttons.** `@nomadhome/ui` only exports a `<button>`, so a
  navigation action either nests `<Button>` inside `<Link>` (an interactive
  element inside an interactive element: two tab stops, two roles, invalid
  HTML) or copies the button classes into a local constant. Today
  `EmptyState.tsx` still nests `<Link><Button>`; `ListingDetailPage`
  (`CTA_BASE`, `PRIMARY_CTA`, `SECONDARY_CTA`), `HostListingsPage`,
  `BookingFormPage` (`CTA_BASE`, `SECONDARY_CTA`, `TERTIARY_CTA`),
  `BookingCancelPage` (`SECONDARY_CTA`), `BookingSuccessPage` (`PRIMARY_CTA`) and
  `VerifyEmailPage` (`PRIMARY_LINK`) each carry a private copy of the recipe.
  The copies have already drifted: `BookingCancelPage` hovers to
  `bg-surface-raised`, every other secondary hovers to `bg-surface-inset`.
- **The secondary ring shadow.** The secondary `Button` and `Card` draw their 2px
  edge as `border` (1px) plus `ring-1 ring-inset`, which Tailwind composes as a
  `box-shadow`. `DESIGN.md` forbids shadows and rings as edges, and the global
  focus rule (`:focus-visible { outline: 3px solid var(--focus); outline-offset:
2px; box-shadow: 0 0 0 2px var(--focus-gap) }`) loses its paper gap layer
  whenever a ring or shadow utility applies. Eight call sites work around it
  with `FLAT_SECONDARY` (`border-2 ![box-shadow:none]`) and three card sites
  with `FLAT_CARD_CLASS`. The admin identity design already records that the
  action buttons show "the 3px ink outline without the paper gap ring"
  contrary to the spec's two-layer ring.

Ticket NH-138 (GitHub issue #138): "Render link-style buttons without nesting a
button inside a link and drop the secondary ring shadow". Follow-up of NH-126,
with extra scope from NH-124 and NH-122. Refs #138; closes #138.

This change **closes the deviations recorded in the archived
`listing-detail-identity`, `booking-payment-identity`, `host-identity` and
`admin-identity` designs** (local CTA constants, `FLAT_SECONDARY`,
`FLAT_CARD_CLASS`, the missing focus gap on secondary buttons and cards).

## What

Primitive and call-site cleanup. Routes, API calls, queries, handlers, `t()`
strings, accessible names, hrefs and tab order stay. Visual output is unchanged
except the two intentional differences below.

- **`buttonVariants()` in `@nomadhome/ui`.** Export the `cva` helper the
  `Button` already uses, plus its variant props type (`primary`, `secondary`,
  `tertiary`, `destructive`). It carries the 44px minimum height and an
  anchor-safe `no-underline` (the tertiary hover underline is kept). `Button`
  consumes the same helper, so the two cannot drift. Link-style actions render
  `<Link className={buttonVariants({ variant })}>`: one anchor, one tab stop,
  one `link` role. No router dependency enters `packages/ui`.
- **Secondary edge without a ring.** Every variant paints its edge with
  `border-2`; the secondary variant sets `border-border` on top of it and drops
  `ring-1 ring-inset ring-border` and `disabled:ring-0`. `Card` does the same.
  No variant or card has a box shadow at rest (computed `none`).
- **Focus ring restored by deletion.** Removing the ring utilities and the
  `![box-shadow:none]` overrides lets the global `:focus-visible` rule show its
  3px outline plus the 2px paper gap on every button, link and card. No CSS
  change.
- **Migration.** `EmptyState`, `ListingDetailPage`, `HostListingsPage`,
  `BookingFormPage`, `BookingCancelPage`, `BookingSuccessPage` and
  `VerifyEmailPage` use `buttonVariants`; every local CTA constant is deleted.
  `w-full sm:w-auto` and `block` widths stay as `className` extensions.
- **Delete the overrides.** Every `FLAT_SECONDARY` (EmptyState,
  CancelBookingModal, ReviewModal, MyBookingsPage, AdminUsersPage,
  AdminListingsPage, EditListingPage, ListingPhotosCard) and `FLAT_CARD_CLASS`
  (`components/listingFormStyles.ts`; EditListingPage, ListingPhotosCard,
  ListingAvailabilityCard) goes, plus the `![box-shadow:none]` in them.
- **Docs.** `apps/web/DESIGN.md` loses the override wording and the "no gap
  ring" statement; surface briefs and the `design.json` sidecar are updated
  where they mention it.

**Intentional visual changes (two):** (1) the focus ring now shows its paper gap
on secondary buttons and cards, as the spec always said; (2) the Cancel page
secondary links hover to `bg-surface-inset` like every other secondary (was
`bg-surface-raised`).

**Copy: no `t()` key is added, removed or renamed and no dictionary value
changes.** Contrast: no colour pairing changes (same tokens, same surfaces), so
design.md carries no contrast table.

## Impact

- **Capabilities affected**: `platform` (ADDED: single-anchor link-style
  buttons, `buttonVariants` export, migrated screens. MODIFIED: Button variant
  edges, Card edge, photos and availability cards, moderation actions, focus
  ring, and every requirement that names `FLAT_SECONDARY` or `FLAT_CARD_CLASS`
  such as my bookings and host screen states). Other capabilities are consumed
  unchanged.
- **Breaking changes**: no for users. `@nomadhome/ui` gains an export and a
  slightly different class string on secondary `Button` and `Card`; `Button`'s
  props and behaviour are unchanged. No API, schema, route or `t()` change. No
  new dependency (no `@radix-ui/react-slot`).
- **Migration required**: no backend or API-client change. `apps/web` resolves
  `@nomadhome/ui` through `workspace:*` and `dist/` (`main`/`exports` point at
  `./dist`), so the `packages/ui` build must run before web typecheck, tests and
  e2e (see Risks).
- **Out of scope**: `apps/api`, routes, `t()` keys and copy; the `Badge` pill
  (stays, accepted deviation, untouched); a shared `StatePanel` / `StatusTag`
  extraction; a polymorphic `LinkButton` or `asChild`; disabled link-style
  actions (anchors have no `disabled` and no migrated CTA is disabled); any
  palette, token or `globals.css` change.

## Risks & Mitigations

| Risk                                                                                     | Likelihood | Mitigation                                                                                                       |
| ---------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Sub-pixel corner differences going from 1px border plus 1px inset ring to one 2px border | Low        | Same 2px outer box; screenshots at 1440 and 360 px attached to the report, never compared pixel by pixel         |
| Cancel page hover changes from `surface-raised` to `surface-inset`                       | Known      | Intentional unification (D8), recorded as the one deliberate visual change besides the focus gap                 |
| Anchors have no `disabled`; a future disabled link CTA would not be inert                | Low        | No migrated CTA is disabled; documented in design.md Open points                                                 |
| `w-full sm:w-auto` and `block` widths conflict with the variant classes                  | Low        | Passed as `className` extensions merged by tailwind-merge; unit and e2e assert the widths                        |
| Disabled secondary dashed edge must still render at 2px                                  | Medium     | Variant keeps `disabled:border-dashed disabled:border-border-muted` on the base `border-2`; unit test asserts it |
| Web consumes a stale `packages/ui/dist` and fails to find `buttonVariants`               | Medium     | Build `packages/ui` before web checks; confirm the root scripts and CI order in the tasks                        |
| Focus gap now visible on secondary buttons and Cards (user-visible change)               | Known      | Intentional and matches the spec; e2e asserts outline 3px plus 2px gap shadow when focused                       |
| Tests asserting `FLAT_SECONDARY` classes, `ring` and the outline-only focus fail         | High       | Update them in the same PR (button.test, Admin\*Page.test, admin-identity.spec, focus-hover.spec); none weakened |
| Another `Link` consumer still nests a Button                                             | Low        | e2e helper asserts zero `a button` and `button a` on every migrated screen                                       |

## Rollout

Big bang in one PR; no flag. The PR description links the change-id, says
"Refs #138; closes #138", attaches 1440 px and 360 px screenshots, names the two
intentional visual changes and lists the follow-ups from design.md Open points.
