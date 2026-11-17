# Proposal: listing-detail-identity

## Why

The landing, search and auth screens ship the Gantry Signage identity in the
warm palette (`refresh-visual-identity` NH-118, `warm-palette-swap` NH-129,
`auth-screens-identity` NH-125). The listing detail page (`/listings/:id`) is the
screen a visitor reaches from a search result or a departure-board row, and the
screen that holds the booking decision, yet it still renders the pre-identity
look: a `rounded-xl` hero photo and `rounded-lg` thumbnails, a `bg-slate-100`
rounded placeholder (a raw Tailwind colour outside the palette), a `rounded-full`
amenity pill, a ⭐ emoji for the rating, `text-fg-subtle` type and location
lines, a `shadow-sm` booking card with a 1px muted edge, a skeleton with
`rounded-xl` and `rounded-pill` blocks, and two bare paragraphs for the
not-found and generic error states. `DESIGN.md` forbids all of these: radii 0 to
4px, no pills, no shadows, no emoji as icons, no colour outside the palette.

The page also has gaps that matter at the moment of decision: the not-found and
error states have no heading, the error paragraph is plain danger text with no
shape cue, the thumbnail strip is a horizontally scrolling region, and the price
(the number the visitor decided on) is plain bold text in a card that looks
like a generic web shop.

Ticket NH-126 (GitHub issue #126), follow-up of NH-125: "Apply the Gantry
Signage identity to the listing detail page". Refs #126; closes #126.

## What

Composition and styling only. Behaviour, data fetching, routes, the guest,
host and visitor branches, the booking link, the `DateRangePicker` and every
`t()` key stay.

- **Gallery.** The primary photo gets a 2px ink edge and no radius. Thumbnails
  are flat, 2px-edged and non-interactive (no click, no lightbox, no new
  feature). The no-photo placeholder is a stone panel with a dashed 2px ink edge
  (dashed = absent or tentative, as elsewhere in the system).
- **Header.** The listing type becomes a square bordered tag. The title is the
  `h1` in Overpass 900 with solid leading. City and country, and the address,
  read as a departure-board row (ruled top and bottom, divided cells).
- **Amenities** become flat 2px-bordered tags in a list instead of pills.
- **Rating** uses a drawn star glyph (authored SVG, decorative, `aria-hidden`)
  instead of the emoji; the visible text is otherwise the same.
- **Booking panel** becomes a paper sign panel with a 2px ink edge, no shadow and
  an ember price band at its top carrying the price and "/ night" in **ink**
  (never paper text on ember, never `fg-muted` or `fg-subtle` on ember). It is
  sticky from `md` up. Its controls (`DateRangePicker`, Book now, Log in to
  book) are unchanged in behaviour and look.
- **Loading skeleton** is flat: no radius and no pill blocks.
- **Not-found** is a solid paper sign panel and the **generic error** is a
  `role="alert"` panel with the danger edge and filled danger tile (the
  `ServerErrorAlert` grammar from NH-125). Each gets exactly one `h1` using its
  existing string.
- **360 px.** One column; the booking panel follows the content; no horizontal
  overflow.
- Write the surface brief
  `apps/web/.impeccable/surfaces/src-pages-listingdetailpage-tsx.md` and extend
  `apps/web/DESIGN.md` with the listing detail composition.

**Copy: no `t()` key is added, removed or renamed and no dictionary value
changes.** A dictionary-unchanged test guards this. The only visible text
difference is that the decorative ⭐ literal in the page source is replaced by
a drawn glyph (it was never a dictionary string).

## Impact

- **Capabilities affected**: `platform` (adds requirements for the listing
  detail identity, booking panel, state panels, 360 px/keyboard behaviour and
  no-behaviour-change). `listings` is **consumed unchanged**: its "Listing
  detail page UI" requirement constrains content and the CTA by role, and no
  scenario there changes, so no `## MODIFIED` entry is needed.
- **Breaking changes**: no. No API, schema, route, `t()` key or shared
  primitive prop change. No new dependency.
- **Migration required**: no. No Prisma change, no data migration, no backend
  change, no API-client change.
- **Out of scope**: gallery interaction (selecting a thumbnail, lightbox,
  carousel), distinct alt text per photo (needs copy), restyling
  `DateRangePicker`, rendering guest reviews, new pictograms, nav or `Layout`
  changes, copy rewrites, and fixing the existing `Link` wrapping a `Button`
  (see follow-ups in design.md).

## Risks & Mitigations

| Risk                                                                                  | Likelihood | Mitigation                                                                                                             |
| ------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Text on the ember price band uses a muted ink by habit                                | Medium     | Price and unit are ink by construction; a computed-colour e2e asserts the colour of every text node in the band        |
| Sticky booking panel overlaps the sticky nav or clips the focus ring                  | Medium     | `md:top-24` clears the 58px nav; no `overflow: hidden` on the panel; e2e scrolls and checks position and ring          |
| `DateRangePicker` (out of scope) looks off against the new panel                      | Medium     | It sits on the paper part of the panel, unchanged; its visuals are recorded as a follow-up with a screenshot           |
| Existing tests or e2e specs match the not-found or error text or the emoji            | Low        | Text strings unchanged; roles added, not removed; review pass before implementation (tasks 6)                          |
| Photo or placeholder height changes cause layout shift or 360 px overflow             | Medium     | Same max heights as today; `min-w-0` and `object-cover`; no-overflow asserted at 360 in every state                    |
| Departure-board row text wraps badly with a long city or address at 360 px            | Medium     | Cells stack below `sm`; `break-words`; long-value e2e at 360                                                           |
| Hand-drawn star glyph drifts from the 24-grid stroke rules                            | Low        | Authored on a 24 viewBox, square joins, reviewed in the visual check                                                   |

## Rollout

Big bang in one PR; no flag. The PR description links the change-id, says
"Refs #126; closes #126", and attaches the 1440 px and 360 px screenshots.
