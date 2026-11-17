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

Meaning travels by shape before colour. A destination is a large word, a state is a solid, dashed or struck outline, a connector is an arrow, and a kind of space is a drawn pictogram (bed, desk). The Landing opens on an ember hero that works as a departure form, then continues as an ink departure board of the newest real listings (hidden when there are none), an ink three-step strip, a sage co-living field carrying an ink pictogram sign beside its checklist, a workspace field, a stone destination index, and an ember closing band. Search keeps the same signs at a calmer density: an ember query band, a paper filter panel, and bordered result panels.

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

- Tone is carried by outline: neutral, success and info solid; warning dashed; danger solid and struck; accent is ember fill, ink text and ink edge. Over images the accent badge is square and pinned to the top-left corner with right and bottom edges only.

### Cards and panels

- **Card primitive:** paper, 4px radius, 2px edge, 20px padding, no shadow; interactive variant fills stone on hover.
- **Result card (Search):** link panel with a 2px edge, 4:3 photo well on stone (bed or desk pictogram when there is no photo), title (900, clamp to two lines), city, 30px price with tabular numerals, up to three amenities with square 8px markers. Hover and focus fill stone (the card holds fg-muted and fg-subtle, which fail on ember and sage). Fixed title and amenity heights keep prices aligned across a row.
- **Departure board row:** the board lists real listings, the three newest published stays from the search endpoint, so there are no invented codes, tags or prices. Rows are full-width links to /listings/<id> on an ink board, divided by 2px paper rules. Anatomy: an ember code tile carrying the bed (property) or desk (workspace) pictogram; a 4:3 thumbnail with a 2px edge, showing the real photo or, when there is none, the pictogram on a stone well; the city and country; the title in Black weight, clamped to two lines; a meta line of type plus up to three amenity labels separated by middots (hidden from assistive tech, which hear commas); the nightly rate formatted in its own currency (no conversion) in ember tabular numerals followed by "/ night" (omitted when the rate is not a positive amount); and an arrow tile. No badge or state tag. Hover and focus invert to ember fill with ink text; the code tile and arrow tile switch to ink with an ember pictogram or arrow, the price turns ink and the title underlines. Loading shows three skeleton rows sized like real rows; an empty or failed request renders nothing.
- **Destination index row:** the Locations field sits on stone, so it never touches the ember closing band. City names at up to 8rem in ink, divided by 2px ink rules, with a trailing arrow; hover and focus invert to ink fill with paper text. The "Explore all" link is a paper button on stone that inverts to ink on hover. The entries are an editorial index linking to search by city, not listing data.
- **Step tile:** ink tile with a numbered ember square carrying ink digits.
- **Sign panel on sage:** the co-living field holds an ink panel carrying an ember pictogram only, beside the checklist; it states no rate.

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
- **Do** write user-facing strings through t().

### Don't:

- **Don't** use fg-muted or fg-subtle on ember or sage.
- **Don't** put danger text or destructive buttons on an orange panel.
- **Don't** introduce a white surface, a sixth palette colour or colour-only status.
- **Don't** use sage as text or a line, or as a bare block with nothing on it.
- **Don't** put ember text on paper, stone or sage.
- **Don't** add blur shadows, gradients, rounded pills or glass; radii stay 0 to 4px.
- **Don't** use icon fonts or third-party icon sets for wayfinding glyphs.

## Known build notes (not rules)

Accepted at the finish review (disposition ship), recorded in openspec/changes/warm-palette-swap/design.md: the hero 0-nights numeral is fg-subtle on paper (7.01) and may be quieted later; the error state was not visually captured; the date-input calendar icon keeps the native focus ring.

## Disclosed placeholders (not brand rules)

The featured stays are real listings (NH-121, openspec/changes/remove-synthetic-landing-content): the stats strip, the testimonial, the example co-living rate and the workspace status strip were removed from the build. What remains is not design-system content and must not be reused as a pattern of truth: the remote Unsplash photos on the co-living and workspace fields (to be replaced with real or licensed self-hosted photography), and the editorial Locations index, whose entries and detail lines are curated links to search by city, not listing data. PRODUCT.md forbids fabricated testimonials or usage statistics. Before public launch real listings must exist; otherwise the featured board is hidden by design.
