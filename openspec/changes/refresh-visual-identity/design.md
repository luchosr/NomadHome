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

Pairings are fixed in tokens, not chosen per use. Anything not in the table
below is disallowed. Ratios are computed with the WCAG 2.1 relative-luminance
formula (same as `packages/ui/src/contrast.test.ts`, which asserts the
thresholds). Black is `#0A0A0A`.

| Pairing (foreground on background)        | Ratio | Requirement | Result     |
| ----------------------------------------- | ----- | ----------- | ---------- |
| black on signal `#FFC700`                 | 12.65 | text 4.5    | pass       |
| signal on black                           | 12.65 | text 4.5    | pass       |
| white on sign green `#00704A`             | 6.15  | text 4.5    | pass       |
| sign green on white                       | 6.15  | text 4.5    | pass       |
| black on white                            | 19.80 | text 4.5    | pass       |
| white on black                            | 19.80 | text 4.5    | pass       |
| fg-muted `#404040` on white               | 10.37 | text 4.5    | pass       |
| fg-muted on surface-inset `#F2F2F2`       | 9.26  | text 4.5    | pass       |
| fg-muted on signal                        | 6.63  | text 4.5    | pass       |
| fg-subtle `#545454` on white              | 7.57  | text 4.5    | pass       |
| fg-subtle on surface-inset                | 6.76  | text 4.5    | pass       |
| fg-subtle on signal (card hover)          | 4.84  | text 4.5    | pass       |
| border-muted `#767676` on white           | 4.54  | UI 3        | pass       |
| border-muted on surface-inset             | 4.06  | UI 3        | pass       |
| white on danger `#B00020`                 | 7.33  | text 4.5    | pass       |
| danger on danger-bg `#FBE3E6`             | 6.01  | text 4.5    | pass       |
| warning `#7A4F00` on warning-bg `#FFF1B8` | 6.29  | text 4.5    | pass       |
| info `#00508C` on info-bg `#E1EDF7`       | 6.99  | text 4.5    | pass       |
| sign green on success-bg `#E3F1EA`        | 5.28  | text 4.5    | pass       |
| black on sign green (focus layer alone)   | 3.22  | UI 3        | pass, thin |

Disallowed pairings (never used for text): white or signal on the opposite
light colour (white on signal 1.56, signal on white 1.56), and sign green on
signal (3.93, below 4.5).

**Finding fixed during task 6.1:** `fg-subtle` was `#595959`, which measured
4.48:1 on signal (the hover colour of listing cards) and missed AA by 0.02. It
is now `#545454` (4.84:1 on signal, 7.57:1 on white).

**Focus ring.** A single black outline reached only 3.22:1 on sign green, too
little headroom. The ring is now two layers: a 3 px outline in `--focus` (black
by default, signal on dark and green fields) plus a 2 px white gap
(`--focus-gap`) drawn with a zero-blur `box-shadow`. One layer is always at
least 4.5:1 against every field: black on signal 12.65 and on white 19.80,
white on sign green 6.15 and on black 19.80. `contrast.test.ts` asserts this.

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

Disabled controls follow the same grammar: disabled = dashed border on an
inset fill with subdued text (`Button`, `Input`); a disabled tertiary
(link-style) `Button` is struck through. This was added during task 2.x and
accepted by the user.

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

The landing's featured-stay, co-living, workspace and location **photos** are
also placeholders: remote Unsplash and picsum.photos URLs (some are random
picsum seeds), unchanged from before NH-118. They are kept by explicit user
decision, carry no provenance or licence guarantee, depend on network access,
and are not the product's own photography. They MUST be replaced with the
product's real or properly licensed, self-hosted photography before public
launch (task 11.1). The photos in screenshots of the search results come from a
mocked payload, not from product data.

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
