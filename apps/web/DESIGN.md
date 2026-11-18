---
name: NomadHome
description: Gantry signage for long stays in a warm palette; flat ink-edged panels, ember orange, sage and paper, solid Black-weight type, state by shape.
colors:
  ember: "#E65F35"
  sage: "#96A8A6"
  paper: "#F7F5F2"
  stone: "#E5E2DD"
  ink: "#1E1E1E"
  fg-muted: "#3F3B37"
  fg-subtle: "#57534E"
  border-muted: "#6F6A63"
  action-hover: "#333333"
  success: "#2F5F3E"
  success-bg: "#E4EEE5"
  warning: "#7A4A00"
  warning-bg: "#F6E7C1"
  danger: "#9B1C2E"
  danger-hover: "#7E1625"
  danger-bg: "#F8E1E0"
  info: "#1F4E79"
  info-bg: "#E1EBF3"
typography:
  display:
    fontFamily: "Overpass Variable, Overpass, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 1.6rem + 4.4vw, 5rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  sign-numeral:
    fontFamily: "Overpass Variable, Overpass, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(3.5rem, 2rem + 7vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Overpass Variable, Overpass, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.75rem, 1.3rem + 2.2vw, 2.75rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Overpass Variable, Overpass, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Overpass Variable, Overpass, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Overpass Variable, Overpass, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  none: "0px"
  sm: "2px"
  card: "4px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  24: "96px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "14px 22px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.fg-subtle}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 22px"
  button-secondary-hover:
    backgroundColor: "{colors.stone}"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "14px 22px"
  button-destructive-hover:
    backgroundColor: "{colors.danger-hover}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  input-disabled:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.fg-subtle}"
  badge-accent:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "4px 12px"
  badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.card}"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  nav:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    height: "58px"
  listing-card-hover:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.ink}"
---

# Design System: NomadHome

## Overview

**Creative North Star: "Gantry Signage"**

The interface reads like airport and rail wayfinding. Surfaces are flat panels cut from a warm palette, ember orange, ink, paper and sage with stone as the inset, each held by a 2px ink edge. Nothing floats and nothing blurs; depth is a hard bar or an edge, never a glow. Type is one family, Overpass, set at Black weight and tight leading for anything that names a place, a price or a count, so the page scans like a board rather than a brochure.

Meaning travels by shape before colour. A destination is a large word, a state is a solid, dashed or struck outline, a connector is an arrow, and a kind of space is a drawn pictogram (bed, desk). The Landing opens on an ember hero that works as a departure form, then continues as an ink departure board of the newest real listings (hidden when there are none), an ink three-step strip, a sage co-living field carrying an ink pictogram sign beside its checklist, a workspace field, a stone destination index, and an ember closing band. Search keeps the same signs at a calmer density: an ember query band, a paper filter panel, and bordered result panels. The Auth screens put an ember title band over one paper form panel, and the listing detail stays on paper with a photo frame, an ink-edged header row and a booking panel whose only ember is its price band. Booking and payment follow on paper too: a summary panel closed by an ember total band, an ember success panel, and a my-bookings list whose status is a tag outline (dashed, solid, struck) before it is a colour. The host screens are work screens with no ember: flat 2px-edged listing rows with a framed thumbnail or pictogram tile and a shape-coded status tag, a bookings table (cards on a phone), and listing forms that share one field grammar. The admin screens (accounts and listings) follow the same work-screen grammar: a flat table with shape-coded state tags, cards on a phone, and 44px moderation actions.

This file records what shipped. The earlier yellow, black and green palette is gone; none of its values remain in source except as negative guards in tests.

**Key Characteristics:**

- Five palette names only: ember, sage, paper, stone, ink. There is no white surface.
- Fields are full-bleed and separated by a 2px ink rule; every panel carries a 2px ink edge.
- 0 to 4px corners, zero blur shadows.
- Overpass Variable throughout; Black (900) set solid for display and numerals.
- State by outline shape: solid, dashed, struck.
- Authored SVG pictograms and a solid arrow replace icon libraries.

## Colors

A warm palette with ink as the structural colour. The panel is the pairing: each field has exactly one approved text colour (ratios computed with the WCAG 2.1 formula, asserted in packages/ui/src/contrast.test.ts).

### Primary

- **Ember** (#E65F35): hero, destination index, query band and CTA fields; the accent badge; the selection highlight; hover fill for departure-board rows and unchecked filter chips; large accent text on ink panels (prices, footer headings, step numerals, pictograms) at 18px bold or larger.

### Secondary

- **Sage** (#96A8A6): the co-living field and the hero facts list. Background only: never text, never a line, never a bare block. A sage field always holds ink text and, for anything substantial, an ink panel or a paper card.

### Neutral

- **Ink** (#1E1E1E): nav, departure board, step tiles, primary button fill, every panel edge, body text, the default focus outline.
- **Paper** (#F7F5F2): the canvas, every raised panel and every control fill, including controls on orange; text on ink.
- **Stone** (#E5E2DD): image wells, disabled fills, secondary-button, interactive-card and listing-card hover.
- **Muted Ink** (#3F3B37) and **Subtle Ink** (#57534E): secondary text and placeholders on paper and stone only; **Muted Edge** (#6F6A63) for neutral badge edges and disabled outlines.
- **Action Hover** (#333333): primary button hover.

### Status (badges, errors)

- Success: #2F5F3E on #E4EEE5 (a deep green, deliberately not sage). Warning: #7A4A00 on #F6E7C1. Danger: #9B1C2E (hover #7E1625) on #F8E1E0. Info: #1F4E79 on #E1EBF3. Tints sit near 1.1:1 against paper, so they appear only inside badges and error text that keep a 2px edge.

### Named Rules

**The Panel Is The Pairing Rule.** Ember and sage panels carry ink text and ink 2px edges (ink on ember 4.81, ink on sage 6.71). Ink panels carry paper text (15.32). Paper and stone carry ink, muted or subtle ink. Controls on orange take a paper fill with ink text and an ink edge.
**The Ember Text Rule.** Ember is text only on ink, and only at 18px bold or larger (4.81, thin). Ember on paper is 3.19, on stone 2.69, on sage 1.40: never text, never a link colour on a light surface. Smaller text on ink is paper.
**The No Muted On Colour Rule.** fg-muted and fg-subtle never sit on ember (3.20, 2.20) or sage (4.47, 3.07). The hero city placeholder is ink for that reason.
**The Danger Rule.** Danger crimson (#9B1C2E) is 23 degrees of hue from ember and 2.33:1 on it: error text and destructive buttons never sit on an orange panel; errors render in paper areas and state stays carried by shape (solid plus struck).
**The No White Rule.** White is not in the palette (white on ember is 3.47). Every light surface is paper or stone.
**The Sage Sparingly Rule.** Use sage for the co-living field and the hero facts list; never as a bare block without an ink panel or paper card on it.

## Typography

**Display, Body and Label Font:** Overpass Variable (self-hosted via fontsource; fallbacks -apple-system, Segoe UI, sans-serif)
**Mono:** system monospace stack, declared but unused on the surveyed pages.

**Character:** a humanist highway-sign grotesque. Black weight, near-solid leading and negative tracking make headings read as sign lettering; regular and bold weights carry quiet text.

### Hierarchy

- **Display** (900, clamp 2.5rem to 5rem, 0.95): H1/H2 defaults, section titles use the 4xl step (clamp 2.25rem to 3.75rem, solid leading 0.92).
- **Sign numeral** (900, clamp 3.5rem to 6rem, 0.92, tabular): night count in the hero panel; the hero numeral is further fitted to its panel by container-query width.
- **Destination** (900, container-fitted, clamp from 1.5rem up to 11.5rem, 0.85): the hero city field; size is derived from the typed name length against its container width so any city fills the line.
- **Index city** (900, 3rem to 8rem by breakpoint, solid): destination index rows.
- **Title** (700 to 900, 1.25rem to 2.25rem): card and board titles, H3 default is 700 at 1.25rem.
- **Body** (400, 1rem, 1.55): copy, capped near 56ch.
- **Label** (700, 0.875rem): buttons, badges (0.75rem), field labels, nav links.

### Named Rules

**The Solid Setting Rule.** Anything that names a place, price or count is Black weight with leading at or below 1.05 and tracking -0.03em.
**The Tabular Number Rule.** Prices and night counts use tabular numerals.

## Layout

Content sits in a centred 1280px wrapper with 24px gutters (48px from md). Sections are full-bleed colour fields with 64px (96px from md) vertical padding, separated by a 2px ink rule. The hero is a two-column form at lg (fluid destination left, 26rem paper date panel right, a full-width action row below with pictogram panel, arrow and a 80px-tall Search button) and stacks below. The departure board is a CSS grid whose areas reflow between a three-column mobile layout and a five-column lg row (code, thumbnail, city and title, price, arrow). Neighbouring fields never share a background: the board is paper, Locations is stone. Search places a 18rem sticky filter panel beside results at md, and turns it into a bottom sheet with a scrim below md. The spacing scale is 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px. Mobile holds down to 360px. The nav is sticky at 58px (56px plus a 2px bottom rule) and scroll padding is 4.5rem so focus stays clear of it.

## Elevation & Depth

Flat. Depth comes from edges, field colour changes and inversion on hover, not blur. The preset defines hard-bar shadows (0 1px, 2px, 4px, 6px offset, zero blur, ink) but the surveyed components use none of them; treat them as reserved. No gradients, no glass.

### Named Rules

**The Flat Panel Rule.** A raised surface is a paper or coloured panel with a 2px ink edge. Hover changes fill (to ember, ink, stone), never adds a shadow.

## Shapes

Square signs. Radius is 0 for the hero destination field and image-bearing badges inside cards, 2px for buttons and inputs, 4px for cards and badges; board rows, step tiles and index rows are square. The 2px edge is drawn as a 2px border, or as a 1px border plus 1px inset ring on secondary buttons and Card, which is how the primitives keep a 2px edge. Pictograms share a 32 grid with 3-unit strokes, square caps and mitred joins, filled masses in currentColor; the arrow is a solid right-pointing block arrow. The logo is an ember square with an ink arch over a base bar.

## Components

### Buttons

- **Primary:** ink fill, paper lettering, 2px ink border, 2px radius, 14px 22px padding, 14px bold. Hover #333333; active nudges 1px down. The hero submit enlarges it to 80px minimum height and up to 2.25rem lettering.
- **Secondary:** transparent, ink text, 2px ink edge, hover stone.
- **Tertiary:** text-only link style, underline on hover.
- **Destructive:** danger fill, paper text, darker on hover; never on an orange panel.
- **Disabled:** shape change, not only colour. Primary and secondary become dashed muted-edge on stone with subtle ink; tertiary is struck through.

### Inputs

- 2px ink edge, paper fill, 2px radius, 12px 16px padding, subtle-ink placeholder. Invalid swaps the edge to danger; disabled is dashed on stone. The hero city field is the exception: borderless and transparent on the ember panel with a 4px bottom rule that is dashed while empty and carries Black display type; its placeholder is the same ink as typed text (4.81), told apart by the dashed rule, and its focus ring replaces the rule colour.

### Badges

- Tone is carried by outline: neutral, success and info solid; warning dashed; danger solid and struck; accent is ember fill, ink text and ink edge. Over images the accent badge is square and pinned to the top-left corner with right and bottom edges only. The packages/ui Badge pill is now used only by the ListingCard accent tab (a local override); host and admin screens use state tags instead.

### Cards and panels

- **Card primitive:** paper, 4px radius, 2px edge, 20px padding, no shadow; interactive variant fills stone on hover.
- **Result card (Search):** link panel with a 2px edge, 4:3 photo well on stone (bed or desk pictogram when there is no photo), title (900, clamp to two lines), city, 30px price with tabular numerals, up to three amenities with square 8px markers. Hover and focus fill stone (the card holds fg-muted and fg-subtle, which fail on ember and sage). Fixed title and amenity heights keep prices aligned across a row.
- **Departure board row:** the board lists real listings, the three newest published stays from the search endpoint, so there are no invented codes, tags or prices. Rows are full-width links to /listings/<id> on an ink board, divided by 2px paper rules. Anatomy: an ember code tile carrying the bed (property) or desk (workspace) pictogram; a 4:3 thumbnail with a 2px edge, showing the real photo or, when there is none, the pictogram on a stone well; the city and country; the title in Black weight, clamped to two lines; a meta line of type plus up to three amenity labels separated by middots (hidden from assistive tech, which hear commas); the nightly rate formatted in its own currency (no conversion) in ember tabular numerals followed by "/ night" (omitted when the rate is not a positive amount); and an arrow tile. No badge or state tag. Hover and focus invert to ember fill with ink text; the code tile and arrow tile switch to ink with an ember pictogram or arrow, the price turns ink and the title underlines. Loading shows three skeleton rows sized like real rows; an empty or failed request renders nothing.
- **Destination index row:** the Locations field sits on stone, so it never touches the ember closing band. City names at up to 8rem in ink, divided by 2px ink rules, with a trailing arrow; hover and focus invert to ink fill with paper text. The "Explore all" link is a paper button on stone that inverts to ink on hover. The entries are an editorial index linking to search by city, not listing data.
- **Step tile:** ink tile with a numbered ember square carrying ink digits.
- **Sign panel on sage:** the co-living field holds an ink panel carrying an ember pictogram only, beside the checklist; it states no rate.

### Auth screens

- **Title band:** AuthShell opens Login and Register with a full-bleed ember band closed by a 2px ink rule. The 32rem column holds the H1 (Black, solid leading, 4xl) and a one-line ink subtitle; no muted ink on ember.
- **Form panel:** one paper panel, 2px ink edge, 4px radius, no shadow, in the same 32rem column under the band (padding 20px, 32px from sm). Fields stack at 20px; the submit is the full-width primary button.
- **Footer row:** inside the panel, under a 2px ink rule, on stone: prompt text then a bold, always-underlined ink link with a 44px minimum target, separated by a 4px margin.
- **Field error:** a 4px solid danger left bar, bold 14px danger text on paper, linked to its input by aria-describedby while shown; not an alert.
- **Form-level error:** a danger-bg panel with a 2px danger edge, a filled danger square tile carrying a paper exclamation, bold danger text; role alert.
- **Verify tile (VerifyEmail):** one panel and one fact per state, with a 64px tile carrying a 32-grid glyph. Pending is a dashed stone panel with a dashed tile; success is an ember panel with an ink-filled tile and paper check; error is a paper panel with a danger-outlined tile and cross. The action is a Link styled as the primary button. BecomeHostPage inherits the restyled field and form-level error wrappers.

### Listing detail

Local pieces of ListingDetailPage; no ember title band (that is the Auth grammar), the page stays on paper.

- **Gallery frame:** the primary photo in a 2px ink edge, square, up to 480px tall, with a 24px bottom margin. Extra photos are small non-interactive 2px-edged thumbnails that wrap beneath it. With no photo the frame is a 256px dashed-edge stone panel.
- **Type tag:** 2px edge, paper fill, bold 12px uppercase, square corners.
- **Header row:** Black-weight H1 set solid (headline step, 5xl from md) under the tag; city and country, then the address, in a 2px-ruled row that stacks below sm and splits with a 2px rule from sm.
- **Amenity tags:** 2px-edged paper tags, 2px radius, bold 14px ink, in a wrapping list under an H2.
- **Star glyph:** a drawn 24-grid star, ink fill, mitred joins, decorative; the rating text carries the value. No rating states that there are no reviews; only the review count is shown.
- **Booking panel:** paper, 2px ink edge, 4px radius, sticky at md:top-24 beside the content, stacked below md. Ember is used only as its price band: the nightly rate in Black tabular ink with "per night", closed by a 2px ink rule. Body padding is 16px, 20px from sm. The date picker sits in a wrapper that narrows the day cells (40px, 38px button) below sm so seven columns fit a 360px panel. Book now is the full-width primary button (disabled until dates are valid); a visitor gets a full-width secondary Log in to book with a 2px edge and no box shadow.
- **State panels:** not-found and error share a 36rem panel with a 48px square tile and one H1. Not-found is paper with an ink-filled tile and a square outline glyph; error is danger-bg with a danger edge, a danger-filled tile and an exclamation, role alert.

### Booking and payment

Local pieces of BookingFormPage, BookingSuccessPage, BookingCancelPage and MyBookingsPage, plus Modal, the two booking dialogs and EmptyState. No ember title band; panels stay on paper, ember is used once per screen and always carries ink. Page wrappers are px-4 (max-w-xl form, max-w-lg success and cancel).

- **Link actions:** one Link styled as the button (local constants, 44px minimum height, 2px radius and edge), never a Button inside a Link. Primary is ink fill, secondary is transparent with a stone hover, tertiary is a bold underlined text link. EmptyState still nests Link and Button (issue #138).
- **Summary panel (form):** paper, 2px ink edge, 4px radius, no shadow, body padding 16px (20px from sm). The photo sits inside the padded body with its own 2px edge and no radius. Title in bold ink, city and country in muted ink. Dates, nightly rate times nights and the service fee are plain label and value rows (dates are the raw ISO strings).
- **Total band:** the last child of the panel on ember, opened by a 2px ink rule. The label (bold 16px) and the amount (Black 24px, tabular) are ink only and wrap onto two lines when a currency amount is long. Pay now sits outside the band as the full-width primary button, followed by a centred tertiary back link.
- **State panels (form):** a 36rem panel, 2px edge, 4px radius, 48px square tile with a 24-grid glyph (3-unit strokes, square caps) and one H1. No dates is paper with an ink tile and a calendar glyph, path M4 6H20V20H4ZM4 12H20M8 3V6M16 3V6, and a secondary back link. Listing not found and quote or generic error are danger-bg with a solid danger edge, a filled danger tile with an exclamation and bold danger text, role alert. Loading is a square skeleton with aria-busy and no heading.
- **Success panel:** ember, 2px edge, 4px radius. A 64px ink tile with a paper check, a Black H1, the message in medium ink and the booking id as one bold ink text node. A paper foot under a 2px rule holds the single primary link to /bookings; no control sits on ember. The timed-out and no-booking-id paths render this same panel.
- **Waiting panel:** dashed 2px edge on stone, role status and aria-busy, the processing text in bold ink over three square skeleton bars drawn in ink at 10% (bg-ink/10) so they read on stone. No tile: nothing is decided yet.
- **Cancel panel:** paper, 2px edge, 4px radius, a 64px tile with an ink outline and a dash glyph, a Black H1, muted-ink message, and a stone foot under a 2px rule with one secondary link (back to the listing, or to search without a listing id) whose hover fill is paper. No ember and no danger: cancelling the payment is not an error.
- **My bookings card:** a div with 2px ink edge, 4px radius (the rounded-card class is kept), paper fill, no shadow, padding 16px (20px from sm). The listing title is a bold ink link; dates in muted ink and the night count in subtle ink. Actions keep their Button variants. Loading is the same cards as skeleton blocks with aria-busy; an error is the danger panel with a filled tile and one H1, role alert; empty is EmptyState.
- **Status tag:** a 2px-edged paper tag, 2px radius, bold 12px, label text exactly as the dictionary gives it. Pending is a dashed ink edge; confirmed is solid ink; cancelled is a solid muted edge (border-muted, 4.93 on paper) with muted struck-through text; completed is solid ink with an 8px ink square marker (aria-hidden). Status is the shape plus the text, never colour alone, and the tag has no pill radius.
- **Modal frame:** the dialog panel has a 2px ink edge, 4px radius, paper fill, no shadow, over a flat ink/40 scrim with no blur. It is a visual restyle only: there is still no focus trap, ESC, backdrop close or scroll lock.
- **Dialog fields:** a bold 14px ink label over a 2px-edged paper textarea with the global two-layer focus ring; a failed submit renders ServerErrorAlert (role alert). The secondary Close button overrides the primitive's inset ring with a solid 2px border and no box shadow.
- **Star glyph (review):** a drawn 24-grid star in a 44px button, aria-hidden. Filled is solid ink; empty is a 2px ink outline, so the rating is shape, not colour. The buttons keep their "N stars" labels and aria-pressed. Success is a flat paper panel with a 2px edge, a small ink tile with a paper check and bold ink text.
- **Empty state:** a flat 2px dashed ink panel on paper, square, with a 32px calendar glyph in ink, muted-ink message and an optional secondary link button.

### Host dashboard and listing forms

Local pieces of HostListingsPage, HostUpcomingPage, CreateListingPage, EditListingPage and BecomeHostPage, plus ListingStatusTag, listingFormStyles, AmenityCheckboxGrid and the listing form, photos and availability components. Work screens: one H1 per screen in Black (3xl, 4xl from md), no ember title band and no ember anywhere; the primary action is the ink button.

- **Link actions:** New listing and Edit are single Links styled as the button (local CTA constants, 44px minimum height, 2px radius and edge), primary ink fill and secondary transparent with a stone hover. New listing is full width below sm. Secondary Buttons (Unpublish, Upload photo) carry FLAT_SECONDARY (border-2, forced no box shadow) to replace the primitive's 1px border plus inset ring; this is a local override tracked in issue #138.
- **Listing row:** a div with 2px ink edge, 4px radius (rounded-card kept), paper fill, no ring and no shadow, padding 16px (20px from sm), 16px between rows. A 64px square thumbnail with a 2px ink edge, radius 0 and a stone well holds the photo (alt is the listing title) or, when there is none, the bed (property) or desk (workspace) Pictogram at 32px, aria-hidden. The title is bold ink, the type and city line is muted ink, the confirmed-bookings count is bold success. The status tag and Edit sit on the right (below the text under sm).
- **Listing status tag:** a 2px-edged paper tag, 2px radius, bold 12px, label as its only text node (the host.listings.status\_\* strings). Draft is a dashed ink edge; published is solid ink with an 8px ink square marker (aria-hidden); disabled is a solid muted edge (border-muted, 4.93 on paper) with muted struck-through text. Status is the shape plus the text, never colour alone, and there is no pill radius. Shared by HostListingsPage and EditListingPage.
- **State panels:** loading is the same flat rows as skeletons under aria-busy with a square thumbnail block and no heading; empty is a dashed 2px panel on paper with the existing text and no extra link; error is a 36rem danger-bg panel with a solid danger edge, a filled 48px danger tile with an exclamation and one H1 in bold danger, role alert. The edit page loading skeleton is plain 2px-edged divs (no Card, so no ring) and not found uses the error panel.
- **Host bookings:** from sm a flat table (2px ink head rule, bold ink headings, 1px muted row rules, muted cells, tabular amount) in an overflow-x-auto safety container; below sm each booking is a 2px-edged card with the title, the local booking status tag (the MyBookingsPage shapes: pending dashed, confirmed solid, cancelled solid muted and struck, completed solid with a marker) and a definition list for guest (break-all), dates and amount. Only one layout is displayed at a time.
- **Field grammar:** one set of classes from listingFormStyles shared by Create, Edit, Availability and Become host. Labels are bold 14px ink over the control; controls (selects and textareas mirror the Input primitive) have a 2px ink edge, 2px radius, raised paper fill, 16px text, subtle-ink placeholder, a paper fill on focus and a danger edge when aria-invalid, with the global two-layer focus ring (no outline override). Hints are muted 14px text on a 4px muted left bar and show only while the field has no error; a field error is bold danger text on a 4px danger left bar. Create wraps each field in FormField and links an erroring control to its error with aria-describedby; hints are not linked. Every form-level error (server, save, publish, upload, block) renders through ServerErrorAlert, role alert.
- **Amenity checkbox:** one real native checkbox per amenity (role, checked state, label click and Space unchanged), appearance-none, 20px square, 2px ink edge, radius 0, ink fill when checked with a drawn paper check glyph (aria-hidden) over it. The label is a 44px-high row; the grid is two columns, three from sm. The Become host terms checkbox uses the same box and glyph with its error on the danger left bar and no added role.
- **Edit cards:** the details form, photos and availability are Card panels with FLAT_CARD_CLASS (border-2, forced no box shadow) because the primitive composes a ring-1 shadow. Headings are bold 18px ink H2. Photos are square, 2px-edged, radius 0 tiles in a two column grid (three from sm) with a destructive Delete; availability rows are 2px-edged, radius 0 rows with tabular ink dates and a destructive Delete; the Block, Save and submit buttons are 44px high.

### Admin screens

Local pieces of AdminUsersPage and AdminListingsPage, reusing ListingStatusTag. Work screens: one H1 per screen in Black (3xl, 4xl from md), no ember anywhere.

- **Account state tag:** a local 2px-edged paper tag, 2px radius, bold 12px, label as its only text node. Active is a solid ink edge with an 8px ink square marker (aria-hidden); Disabled is a solid muted edge (border-muted, 4.93 on paper) with muted struck-through text. Shape plus text, never colour alone, no pill. Roles are raw muted text (`roles.join(", ")`), with no role badge.
- **Listing status:** AdminListingsPage renders the shared ListingStatusTag (dashed draft, solid published with a marker, struck disabled); it no longer imports the Badge pill.
- **Layouts:** from sm a flat table (2px ink head rule, bold ink headings, 1px muted row rules, muted secondary cells) in an overflow-x-auto safety container; below sm each row is a 2px-edged card (rounded-card, paper fill, no ring, no shadow) with the email or title beside the state tag, the secondary lines and a full-width action. Both layouts are rendered and only one is displayed, so one layout is exposed to assistive tech.
- **Long strings:** long cells (email, title, city, host email) sit in a `max-w-[…] [overflow-wrap:anywhere]` wrapper; the action cell is `whitespace-nowrap` with `pr-1` on the last td and th so the 3px focus ring is not clipped by the scroll container. `table-fixed` is not used.
- **Moderation actions:** Disable is the destructive Button and Re-enable the secondary Button with FLAT_SECONDARY (border-2, forced no box shadow; the #138 override); both are 44px high (min-h-11), the same label and handler in both layouts. The Buttons show a 3px ink focus outline without the paper gap ring because the Button variants set their own box shadow. There is no disabled-while-pending state, and the mutations have no error handling (pre-existing).
- **State panels:** loading is flat skeleton rows under aria-busy with no heading; empty is a dashed 2px panel on paper with muted text; error is a 36rem danger-bg panel with a solid danger edge, a filled 48px danger tile with an exclamation and one H1 in bold danger, role alert. StatePanel is a local function in each page.

### Navigation

- Sticky, ink, 2px bottom rule, 1280px inner wrapper. Logo mark plus name in 900 at 1.25rem. Links 14px bold paper, underline on hover. Primary action is an ember button with ink text (hover to paper); secondary is a paper-outlined button inverting on hover. Logged-in mobile collapses to a bordered menu toggle and a dropdown under a paper rule. The focus outline on the nav is paper.

### Filter chips (Search)

- Bordered 2px chips, paper, hover ember, checked ink with paper text and a check mark.

### Focus

- Two layers: a 3px outline at 2px offset plus a 2px zero-blur gap ring. Default is an ink outline with a paper gap, which serves paper (15.32), stone (12.90), sage (6.71) and ember (4.81). Ink fields override to a paper outline with an ink gap (15.32). Board rows turn ember on focus and keep the ink outline inset; destination rows turn ink and flip to a paper outline. Secondary buttons use a 1px inset ring that replaces the gap layer; the outline layer alone still passes. The native date-picker indicator keeps Chrome's own focus ring.

### Hover grammar

- Board rows: ember fill, ink text. Destination rows (on stone): ink fill, paper text. Cards: stone. Primary buttons: #333333. Secondary buttons: stone. Unchecked chips: ember with ink text. A hovered fill is always a colour whose approved text pairing is already in the rows above.

### Motion

- Colour transitions only: 140ms (inputs), 220ms (panels), ease-out cubic-bezier(0.22, 0.61, 0.36, 1); 1px active press on buttons; skeletons pulse. Reduced motion removes all of it.

## Do's and Don'ts

### Do:

- **Do** separate sections with full-bleed colour fields and a 2px ink rule.
- **Do** put ink text and ink edges on ember and sage; put paper-filled controls on orange.
- **Do** use ember as text only on ink and only at 18px bold or larger.
- **Do** carry state by outline shape (solid, dashed, struck) as well as colour.
- **Do** set places, prices and counts in Black weight, solid leading, tabular numerals.
- **Do** use the authored Pictogram and Arrow components for kind-of-space and connection; add glyphs to the same 32 grid.
- **Do** keep every focus ring two-layer: ink outline with paper gap, flipped to paper outline with ink gap on ink fields.
- **Do** state a form error by shape: a left-barred field error, a filled-tile panel for form-level errors.
- **Do** set the price on an ember band in ink; ember carries the price band alone on the listing detail.
- **Do** state a booking status as a shape plus its text (dashed, solid, struck, solid with a marker), and set the total on an ember band in ink.
- **Do** state a listing status as a shape plus its text (dashed draft, solid published with a marker, struck disabled), and give every listing form the same field grammar.
- **Do** state an account or listing state on the admin screens as a shape plus its text, keep moderation actions 44px, and let long strings wrap inside a max-width cell so the actions stay visible.
- **Do** mark absent media with a dashed stone panel, not a slate or white block.
- **Do** write user-facing strings through t().

### Don't:

- **Don't** use fg-muted or fg-subtle on ember or sage.
- **Don't** put danger text or destructive buttons on an orange panel.
- **Don't** introduce a white surface, a sixth palette colour or colour-only status.
- **Don't** use sage as text or a line, or as a bare block with nothing on it.
- **Don't** put ember text on paper, stone or sage.
- **Don't** put an error, danger text or muted ink on the ember title band; forms and errors stay on paper.
- **Don't** add blur shadows, gradients, rounded pills or glass; radii stay 0 to 4px.
- **Don't** add an ember title band to the listing detail, or put muted ink, subtle ink or danger on its price band.
- **Don't** put muted ink, subtle ink, paper or danger text on the booking total band or the success panel, or place a control on the success panel's ember.
- **Don't** put ember on a host screen, or use raw red text (text-red-600), a pill or a tone-only chip for a host state.
- **Don't** put ember on an admin screen, or use the Badge pill or a tone-only chip for an account or listing state.
- **Don't** use icon fonts or third-party icon sets for wayfinding glyphs.

## Known build notes (not rules)

Accepted at the finish review (disposition ship), recorded in openspec/changes/warm-palette-swap/design.md: the hero 0-nights numeral is fg-subtle on paper (7.01) and may be quieted later; the error state was not visually captured; the date-input calendar icon keeps the native focus ring.

## Disclosed placeholders (not brand rules)

The featured stays are real listings (NH-121, openspec/changes/remove-synthetic-landing-content): the stats strip, the testimonial, the example co-living rate and the workspace status strip were removed from the build. What remains is not design-system content and must not be reused as a pattern of truth: the remote Unsplash photos on the co-living and workspace fields (to be replaced with real or licensed self-hosted photography), and the editorial Locations index, whose entries and detail lines are curated links to search by city, not listing data. PRODUCT.md forbids fabricated testimonials or usage statistics. Before public launch real listings must exist; otherwise the featured board is hidden by design.
