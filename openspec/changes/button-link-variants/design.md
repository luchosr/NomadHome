# Design: button-link-variants

Ticket NH-138 (#138). Follow-up of `listing-detail-identity` (NH-126), with extra
scope from `booking-payment-identity` (NH-124) and `host-identity` (NH-122);
`admin-identity` (NH-123) recorded the same deviations. Scope is `packages/ui`
and `apps/web` only: no `apps/api`, route, query, mutation, `t()` key or copy
change, no new dependency, no palette or `globals.css` change. Visual output is
unchanged except two recorded differences (D8 hover unification, D4 focus gap).
This is a primitive cleanup: the ambition is one source of truth for the button
recipe and a focus ring that is the same everywhere.

## Files in scope

| File                                                                                        | Change                                                                     |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `packages/ui/src/components/button.tsx`                                                     | Export `buttonVariants` and its props type; `border-2` edge, no ring; 44px |
| `packages/ui/src/components/card.tsx`                                                       | `border-2`, drop `ring-1 ring-inset ring-border`                           |
| `packages/ui/src/index.ts`                                                                  | Export `buttonVariants` and `ButtonVariantProps`                           |
| `packages/ui/src/components/button.test.tsx`, `card.test.tsx`                               | Update class assertions, add no-ring and `buttonVariants` parity cases     |
| `apps/web/src/components/EmptyState.tsx`                                                    | Single `<Link className={buttonVariants(...)}>`, no nested Button          |
| `apps/web/src/pages/ListingDetailPage.tsx`, `HostListingsPage.tsx`                          | Replace `CTA_BASE`/`PRIMARY_CTA`/`SECONDARY_CTA` with `buttonVariants`     |
| `apps/web/src/pages/BookingFormPage.tsx`                                                    | Same; back link keeps its pixels via tertiary (D6)                         |
| `apps/web/src/pages/BookingCancelPage.tsx`, `BookingSuccessPage.tsx`, `VerifyEmailPage.tsx` | Replace local CTA constants; Cancel hover unified (D8)                     |
| `apps/web/src/components/CancelBookingModal.tsx`, `ReviewModal.tsx`                         | Delete `FLAT_SECONDARY`                                                    |
| `apps/web/src/pages/MyBookingsPage.tsx`, `AdminUsersPage.tsx`, `AdminListingsPage.tsx`      | Delete `FLAT_SECONDARY`                                                    |
| `apps/web/src/pages/EditListingPage.tsx`, `components/ListingPhotosCard.tsx`                | Delete `FLAT_SECONDARY` and `FLAT_CARD_CLASS` usage                        |
| `apps/web/src/components/ListingAvailabilityCard.tsx`, `listingFormStyles.ts`               | Delete `FLAT_CARD_CLASS` usage and export (keep `LABEL_CLASS`)             |
| Unit tests of the migrated screens and `Admin*Page.test.tsx`                                | Update `FLAT_SECONDARY` assertions; add single-anchor assertions           |
| `apps/web/e2e/*` (shared helper, `admin-identity`, `focus-hover`, per-screen)               | Single-anchor, one tab stop, computed shadow none, two-layer focus ring    |
| `apps/web/DESIGN.md`, surface briefs, `design.json` sidecar                                 | Remove override and "no gap ring" wording (D10)                            |
| `openspec/specs/platform/spec.md` (via delta spec after approval)                           | Requirements listed in Impact                                              |
| `openspec/changes/button-link-variants/reports/*`                                           | Verification reports and screenshots                                       |

Read but **not** changed: `globals.css` (focus rule), `Badge`, `router.tsx`,
`apps/web/src/api/*`, `en.ts`, `apps/api`.

Audit command for the implementation and the verification report:
`rg -n "FLAT_|box-shadow:none|ring-1" openspec/specs apps packages` must return
no code hit afterwards (archived changes excepted).

## D1. Export `buttonVariants()` and apply it to `Link`

`button.tsx` already defines the recipe with `cva`. Export it as
`buttonVariants` with the type `ButtonVariantProps = VariantProps<typeof
buttonVariants>` (variants `primary`, `secondary`, `tertiary`, `destructive`;
default `primary`). Call sites render
`<Link to=... className={cn(buttonVariants({ variant }), "w-full sm:w-auto")}>`
using the `cn` they already have or plain template strings merged by the
primitive's `cn`. `packages/ui` stays router-free.

| Option                                            | Verdict  | Why                                                                         |
| ------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| Export `buttonVariants()` (chosen)                | Chosen   | One recipe, zero dependency, works with any anchor (router `Link`, `<a>`)   |
| `Slot` / `asChild` (`@radix-ui/react-slot`)       | Rejected | New dependency for one use; not installed                                   |
| `LinkButton` component in `packages/ui`           | Rejected | Couples ui to react-router, or needs a polymorphic `as` prop and its typing |
| Keep local CTA constants and fix only the nesting | Rejected | Leaves seven drifting copies; the hover drift already happened (D8)         |

The primitive carries what the local constants repeated: `min-h-11` (44px) and
`no-underline` on the base so an anchor never inherits the browser underline;
the `tertiary` variant keeps `hover:underline` and `underline-offset-4`, which
wins over `no-underline` on hover through the `hover:` variant. Same
`transition-colors duration-med ease-out` and `active:translate-y-px` as `Button`.
`disabled:` utilities stay in the string; they are inert on an anchor (Risks).

## D2. `Button` consumes the same `cva`

`Button` becomes `cn(buttonVariants({ variant }), className)`. There is one
recipe, so a hover or edge change reaches buttons and links together. A unit
test asserts `buttonVariants({ variant })` is a subset of the class list
rendered by `<Button variant>` for every variant.

## D3. Secondary edge: `border-2` plus `border-border`, no ring; Card the same

The base already has `border-2`. Secondary becomes `border-border
bg-transparent text-fg hover:bg-surface-inset` (drop `border`, `ring-1
ring-inset ring-border`, `disabled:ring-0`). Disabled keeps
`disabled:border-dashed disabled:border-border-muted` on the 2px base, so the
dashed edge still renders at 2px. `Card` becomes `rounded-card border-2
border-border bg-surface-raised p-5` with no ring.

The outer box is identical: the old 1px border plus the 1px inset ring occupied
the same 2px, and the ring is inset, so layout does not move. The only visible
difference is anti-aliasing at rounded corners (Risks).

## D4. Focus gap restored by removing overrides, not by CSS

The global rule in `packages/ui/src/styles/globals.css` is `:focus-visible {
outline: 3px solid var(--focus); outline-offset: 2px; box-shadow: 0 0 0 2px
var(--focus-gap) }` in `@layer base`. Tailwind's `ring-*` and shadow utilities
set `box-shadow` in a later layer and `![box-shadow:none]` forces it off, so the
paper gap layer disappeared on exactly the secondary buttons and Cards. With no
ring or shadow utility left, the base rule wins and every focusable button, link
and card shows the 3px outline plus the 2px paper gap, and shows a box-shadow
**only** while `:focus-visible`. No CSS file changes. This is the second
intentional visual change: a gap that the spec already required.

The statement "secondary replaces the gap layer" is removed from the platform
spec (focus ring requirement) and from `apps/web/DESIGN.md` (~l.324 and the
moderation actions paragraph).

## D5. Delete every `FLAT_SECONDARY`, `FLAT_CARD_CLASS` and `![box-shadow:none]`

Eight `FLAT_SECONDARY` constants (EmptyState, CancelBookingModal, ReviewModal,
MyBookingsPage, AdminUsersPage, AdminListingsPage, EditListingPage,
ListingPhotosCard) and the shared `FLAT_CARD_CLASS` in `listingFormStyles.ts`
(EditListingPage, ListingPhotosCard, ListingAvailabilityCard) are removed with
their usages; `className` keeps only what is page-specific (for example
`min-h-11` stays only where it is not already in the primitive, and is removed
where D1 made it redundant). `LABEL_CLASS` in `listingFormStyles.ts` stays.

## D6. Tertiary: BookingFormPage back link keeps today's pixels

`BookingFormPage`'s back link (`TERTIARY_CTA`) renders
`buttonVariants({ variant: "tertiary" })` plus `className="px-2 underline
hover:no-underline"`, which reproduces today's look (padded, underlined at rest,
plain on hover) without a new variant. The extension wins over the variant's
`px-0` and `hover:underline` through tailwind-merge. Rejected: a `link` variant
(adds primitive surface for one caller; revisit if a second caller appears).

## D7. `Badge` stays a pill

`Badge` is untouched. It keeps its pill shape and has no ring; the accepted
deviation recorded in `admin-identity` D4 stays accepted. Its only consumer is
the `ListingCard` accent tab, which already overrides it locally.

## D8. Hover and active unified on the primitive

All migrated links get the primitive's hover and active states.
`BookingCancelPage`'s `hover:bg-surface-raised` was drift from the other
secondaries (`hover:bg-surface-inset`) and is dropped; it is the one intentional
hover change and is recorded in the proposal. `sm:w-auto` and `block`/`w-full`
widths stay as `className` extensions, merged by tailwind-merge in `cn`.

## D9. Tests

- **Unit, `packages/ui` (red first).** For every variant, the class string has
  no `ring` and no `shadow` utility; secondary has `border-2` and
  `border-border`; disabled secondary keeps `border-dashed` and
  `border-border-muted`; `buttonVariants()` is consistent with `Button` (D2);
  `buttonVariants` carries `min-h-11` and `no-underline`; `Card` has `border-2`
  and no `ring-`. Update `button.test.tsx` (`toHaveClass("border",
"bg-transparent")` becomes the `border-2` form).
- **Unit, `apps/web`.** `EmptyState`: exactly one `link` with the same name and
  href, no `button`, `container.querySelector("a button")` is null. Each
  migrated screen: the CTA is one anchor with the same name and href, and the
  local constants are gone. `Admin*Page.test.tsx` replace the
  `toHaveClass("border-2", "![box-shadow:none]")` assertions with the plain
  secondary variant and no `![box-shadow:none]`.
- **E2E (Playwright, mocked API), shared helper.** Assert zero `a button` and
  `button a` on every migrated screen; one Tab stop per CTA; computed
  `box-shadow: none` at rest on secondary buttons and Cards; when focused, the
  two-layer ring (outline 3px plus a 2px `--focus-gap` shadow). Update
  `admin-identity.spec.ts` (comment ~l.674 and the outline-only assertion
  ~l.665 to 690, which becomes the two-layer assertion) and
  `focus-hover.spec.ts` (~l.47). No assertion is weakened; screenshots go to the
  report and are never compared.
- **Gate.** `pnpm` typecheck, lint, unit and e2e for the two packages, after a
  `packages/ui` build (Risks), plus `node scripts/check-mvp-scope.mjs` and
  `openspec validate button-link-variants --strict`.

## D10. Docs

`apps/web/DESIGN.md`: remove the `FLAT_SECONDARY` and `FLAT_CARD_CLASS`
sentences (Link actions ~l.294, Edit cards ~l.301, Moderation actions ~l.311)
and the "no gap ring" wording (~l.324); describe link-style actions as
`buttonVariants` and the edge as `border-2` for Button and Card. Update the
surface briefs under `apps/web/.impeccable/surfaces/` and the sidecar
`design.json` only where they mention the override or the missing gap ring.
Verification reports and screenshots go to
`openspec/changes/button-link-variants/reports/`. No palette or token change.

## D11. No behaviour change

Routes, hrefs, accessible names, visible strings, tab order, handlers, queries
and `disabled` conditions on real `<button>`s are unchanged. A migrated link CTA
keeps its name and `href`; what changes is that it is one anchor instead of an
anchor wrapping a button (EmptyState) or a locally styled anchor (the rest).

## Contrast

No colour pairing changes: the primitive reuses the same tokens on the same
surfaces (ink, paper, stone, danger), and the only new paint is the existing
`--focus-gap` paper layer behind the existing 3px outline. No contrast table is
needed; the existing token contrast tests in `packages/ui` still apply and must
stay green.

## Risks

| Risk                                                                                    | Mitigation                                                                                                                                                |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sub-pixel corner differences (1px border plus ring to 2px border)                       | Same outer box (D3); 1440 and 360 px screenshots in the report                                                                                            |
| Hover unification on BookingCancelPage                                                  | Intentional (D8); recorded in the proposal                                                                                                                |
| Anchors have no `disabled`                                                              | No migrated CTA is disabled; if one appears, render a `<Button disabled>` instead (Open points)                                                           |
| `w-full sm:w-auto` / `block` conflict with variant classes                              | `className` extension merged by tailwind-merge (D8); asserted in unit and e2e                                                                             |
| Disabled secondary dashed edge must still render at 2px                                 | Kept on the `border-2` base (D3); unit test asserts it                                                                                                    |
| Web consumes `packages/ui/dist`, so `buttonVariants` is missing until the ui build runs | `apps/web` depends on `workspace:*` with `main`/`types` at `./dist`; build ui first in the task order, local scripts and CI; verify the root script order |
| Focus gap now appears on secondary buttons and Cards                                    | Intentional, matches the spec (D4); e2e asserts both layers                                                                                               |
| Existing tests pin the override classes and the outline-only focus                      | Updated in the same PR (D9); none weakened                                                                                                                |
| Tertiary back link drifts from today's pixels                                           | D6 extension reproduces it; unit test asserts `px-2 underline hover:no-underline`                                                                         |

## Open points

None blocking. Recorded follow-ups (not in scope; copy them into the PR
description):

- **Disabled link-style actions.** Anchors cannot be `disabled`. If a future CTA
  needs a disabled state, render the `Button` primitive, or add `aria-disabled`
  and `tabIndex={-1}` handling with its own spec.
- **Shared `StatePanel` and `StatusTag` extraction.** Still open from
  `admin-identity`; unrelated to the button primitive.
- **`Badge` pill.** Stays as the accepted deviation (D7); a shape-per-tone
  `Badge` belongs to a separate ticket.
- **`link` variant.** Reconsider only if a second caller needs the padded
  underlined tertiary look (D6).
