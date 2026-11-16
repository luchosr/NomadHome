# Proposal: refresh-visual-identity

## Why

The current look (sand / forest / terracotta, Instrument Serif + DM Sans) was
wired in by `add-design-foundation` as a v1 "warm editorial hospitality" system.
Ticket NH-118 (GitHub #118) asks for a completely new visual identity, defined
from scratch with Impeccable. The product truth in `apps/web/PRODUCT.md` is a
traveller who must decide fast and trust what they see; the new direction
serves that with wayfinding clarity instead of editorial mood.

Chosen direction: **Gantry Signage** — international airport / rail wayfinding.
Signal-yellow panels (`#FFC700`), black grotesque set solid and very large,
white and sign-green (`#00704A`) secondary panels, custom SVG pictograms (bed,
desk), arrows as connectors. State is carried by shape (solid, dashed, struck)
as well as colour. One panel states one fact. The full contract lives in
`apps/web/.impeccable/surfaces/src-pages-homepage-tsx.md`.

## What

- New design tokens replace the sand / ink / forest / terracotta scales in the
  shared Tailwind preset (signal yellow, black, white, sign green, semantic
  roles, sign-scale type, radii, flat elevations).
- New brand fonts and base styles in `packages/ui` (grotesque display + text
  family chosen at build, outside the common default-font list), new canvas,
  focus ring and heading rules.
- `packages/ui` primitives (`Button`, `Badge`, `Input`, `Card`, `Skeleton`) are
  restyled with the same public APIs; new `Pictogram` and `Arrow` primitives
  are added.
- The landing page (`HomePage.tsx`, `pages/home/*`) and the search screen
  (`SearchPage.tsx`, `SearchResults`, `SearchFilterPanel`, `ListingCard`) are
  migrated:
  - Landing first viewport: a full-width yellow sign panel; the city input is
    the largest destination line; dates plus a monumental stay-length numeral
    in a second panel; Live and Work pictograms sharing one arrow into a solid
    black search-action panel; slim nav; no hero photo.
  - Search: Operate mode, comparable listing cards (photo, type, nightly
    price, 2-3 amenities), filters in a side panel on desktop and a sheet on
    mobile, no map.
- Search API: each search result item additionally returns an optional
  `amenities: string[]` of the listing's amenity codes (additive, no schema or
  migration change), so the card can show 2-3 amenities (design.md D10).
- Landing stats and testimonial sections stay as **synthetic placeholders**
  (explicit decision), labelled as such in `design.md`, with a pre-launch
  replacement task.
- `DESIGN.md` is generated from the shipped build via Impeccable.

## Impact

- **Capabilities affected**: `platform` (design tokens, base styles/fonts,
  shared primitives; adds pictogram, state-by-shape and contrast rules) and
  `search` (result items gain an optional `amenities` field, see below).
- **Breaking changes**: no. The search API change is an optional additive
  field (`amenities: string[]`), existing consumers ignore it. Primitive prop surfaces and exports are unchanged;
  tokens named after the old scales (`sand-*`, `forest-*`, `terracotta-*`) are
  removed from the preset, so any remaining consumer outside the migrated
  screens must be re-pointed to semantic role utilities (see design.md D3).
- **Migration required**: no data migration and no Prisma schema change; the API change is additive only.
- **Out of scope**: host, admin, booking, auth and listing-detail screens
  (restyled only through shared primitives and tokens; bespoke redesign is
  follow-up tickets), any behavior or API change other than the additive
  search-result `amenities` field, new filters, sorting or pagination changes,
  amenity labels in the API (labels stay in `t()`), stack changes (Tailwind +
  shadcn/ui + `packages/ui` stay), map view, new copy features, i18n, dark
  mode, and anything on the Post-MVP/Never lists in `openspec/project.md`
  section 3.

## Risks & Mitigations

| Risk                                                                                     | Likelihood | Mitigation                                                                                                                                       |
| ---------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Black-on-yellow is fine but white-on-`#00704A` or small text on yellow fails WCAG 2.1 AA | Medium     | Contrast is an explicit requirement and a dedicated verification task; tokens pair each surface with a fixed approved foreground                 |
| Unmigrated screens look inconsistent next to the new landing/search                      | High       | Tokens and primitives carry the new look everywhere; list follow-up tickets for host, admin, booking screens; no old-scale classes left dangling |
| Oversized type and monumental numerals break at 360 px                                   | Medium     | Fluid `clamp()` scale, explicit 360 px checks in tasks and e2e                                                                                   |
| Chosen typeface has licensing or loading cost                                            | Medium     | Choose an open-license family; self-host with `font-display: swap`; decision recorded in design.md                                               |
| Synthetic stats/testimonial mistaken for real claims at launch                           | Medium     | Labelled synthetic in design.md; pre-launch replacement task (task 11.1)                                                                         |
| No visual-regression baseline exists today                                               | High       | Add targeted Playwright screenshots for landing and search only where cheap; otherwise rely on e2e behavior specs staying green (design.md D6)   |

## Rollout

Big bang for tokens and primitives (foundational, no runtime flag), shipped
with the landing and search migration in one PR chain. Host/admin/booking
bespoke redesign follows in separate tickets.
