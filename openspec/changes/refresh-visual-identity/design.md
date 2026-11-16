# Design: refresh-visual-identity

Sources: `apps/web/PRODUCT.md`, `apps/web/.impeccable/surfaces/src-pages-homepage-tsx.md`.

## D1. Direction: Gantry Signage

Wayfinding signage metaphor. One panel states one fact. Arrows connect
decisions (Live / Work -> Search). Rationale: the product is a fast, trust-
critical booking decision; signage vocabulary is universally legible and
distinctive versus generic travel-marketplace styling.

## D2. Palette and contrast

| Role       | Value                             | Use                             |
| ---------- | --------------------------------- | ------------------------------- |
| Signal     | `#FFC700`                         | Primary sign panels             |
| Black      | near-black (final value at build) | Type on signal, action panels   |
| White      | `#FFFFFF`                         | Secondary panels, cards         |
| Sign green | `#00704A`                         | Secondary panels, success state |

Pairings are fixed in tokens, not chosen per use:
black on `#FFC700` (about 14:1, passes AA and AAA), white on `#00704A`
(about 5.9:1, passes AA for normal text), black on white. Anything not in the
pairing table is disallowed. Task 6.1 verifies the computed ratios rather than
trusting these estimates.

## D3. Token migration

Old scales (`sand`, `ink`, `forest`, `terracotta`) are removed rather than
aliased, so leftover usages fail loudly at build/lint. Consumers outside the
migrated screens are re-pointed to semantic role utilities (`bg-surface`,
`text-fg`, `bg-signal`, ...) in task 1.2. Semantic roles are the supported API;
raw palette names are internal.

## D4. Typography

Display and text typefaces are chosen at build (task 1.3), constrained to
grotesque families outside the common default-font list (not Inter, DM Sans,
Roboto, Open Sans, Space Grotesk, etc.), open licence, self-hosted, variable
if possible, `font-display: swap`. Display type is set solid (line-height
about 0.9-1.0), very large, using a fluid `clamp()` scale that holds at 360 px.
The choice and licence are recorded here when made.

**Decision (task 1.3):** Overpass, used for both display and text. Variable
(wght 100-900), SIL Open Font License 1.1, derived from Highway Gothic (road
signage lineage). Self-hosted through the `@fontsource-variable/overpass`
package (5.3.0, latin subset, `woff2`) in `packages/ui`; loaded with
`font-display: swap`. Display weights 800-900 set solid; the stay-length numeral
uses weight 900. Alternatives weighed on a rendered specimen: Archivo
(variable width axis) and Barlow (static); rejected as less faithful to the
wayfinding world and, for Barlow, heavier to ship.

## D5. State by shape, not colour alone

Solid = available / selected, dashed = tentative / unavailable-for-now,
struck = unavailable / cancelled. Colour reinforces but never alone carries
state (WCAG 1.4.1). Applies to `Badge`, availability indicators in listing
cards and filter chips.

## D6. Pictograms and verification

`Pictogram` (bed, desk) and `Arrow` are custom inline SVG in `packages/ui`,
decorative by default (`aria-hidden`) unless given a label. No icon-font or
CDN dependency is introduced. Repo has no visual-regression baseline or golden
screenshots; Playwright specs are behavior-only. Plan: keep existing e2e
(`search.spec.ts` and others) green, update selectors that depended on old
copy/markup, and add one 360 px and one desktop screenshot assertion for
landing and search only.

## D7. Shared nav (`Layout.tsx`)

The slim nav touches the shared layout used by every page. Only its styling
changes; routes, links and role-gated items are untouched.

## D8. SYNTHETIC placeholders (user decision)

The landing **StatsSection** and **TestimonialSection** contain **synthetic**
content: invented figures and an invented quote with no real source. They are
kept for layout/visual completeness in this pass by explicit user decision.
Each must carry a code comment marking it synthetic. They MUST be replaced with
real data or removed before public launch (task 11.1); presenting them as real
metrics or testimonials is a trust and legal risk.

## D9. Out of scope / follow-ups

Follow-up tickets (to be created after this change): host dashboard and
listing forms, admin screens, booking and payment flow, auth screens, listing
detail page. They inherit tokens and primitives automatically but receive no
bespoke composition work here.

## D10. Search results return amenity codes (additive API field)

Context: the spec and brief require result cards to show 2-3 amenities, but
`SearchResultItemSchema` has no amenity field and `SearchRepository.search`
only uses amenities as a filter (`amenities: { some: { amenityCode } }`).
Without data the card cannot be built (spec drift found during planning).

Decision: add an **optional** `amenities: string[]` to `SearchResultItemSchema`
(`packages/shared`), populated by the search repository.

- Why additive and optional: no breaking change for existing consumers or
  tests; items without amenities serialise as `[]`; no Prisma schema or
  migration change (the `ListingAmenity` join already exists).
- Shape: amenity **codes** (e.g. `wifi`), not labels. Labels stay in the web
  layer through existing `t()` keys `search.filter_amenity_*`
  (`apps/web/src/lib/searchData.ts` maps code to label key). Unknown codes
  without a key are skipped by the card, not rendered raw.
- Cap vs slice: the API returns **all** codes for each listing; the card
  slices to the first 3. Capping in the API is not trivial (Prisma `take` on a
  nested include is per-parent and would hide codes that later filters or UI
  variants could need) and the per-listing amenity count is small. Order is
  deterministic: `ListingAmenity` has no position column, so the include uses
  `orderBy: { amenityCode: "asc" }` (alphabetical by code).
- Performance: no N+1. Extend the existing `prisma.listing.findMany` `include`
  with `amenities: { select: { amenityCode: true }, orderBy: { amenityCode: "asc" } }`;
  Prisma resolves it in one extra batched query for the page (max 100
  listings), not one query per listing. The mapper returns
  `l.amenities.map((a) => a.amenityCode)`. The `where` clause, `count`,
  pagination and sort are untouched.
- Verification: red API test in `apps/api/src/search.test.ts`, shared Zod
  schema test, curl against the real endpoint (tasks 4.x, 9.x).
