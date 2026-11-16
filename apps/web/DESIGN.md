---
name: NomadHome
description: Gantry signage for long stays; flat black-edged panels, signal yellow, solid Black-weight type, state by shape.
colors:
  signal: "#FFC700"
  black: "#0A0A0A"
  white: "#FFFFFF"
  sign-green: "#00704A"
  surface-inset: "#F2F2F2"
  action-hover: "#2B2B2B"
  fg-muted: "#404040"
  fg-subtle: "#545454"
  border-muted: "#767676"
  success-bg: "#E3F1EA"
  warning: "#7A4F00"
  warning-bg: "#FFF1B8"
  danger: "#B00020"
  danger-hover: "#8A0019"
  danger-bg: "#FBE3E6"
  info: "#00508C"
  info-bg: "#E1EDF7"
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
    backgroundColor: "{colors.black}"
    textColor: "{colors.signal}"
    rounded: "{rounded.sm}"
    padding: "14px 22px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.fg-subtle}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.sm}"
    padding: "14px 22px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-inset}"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "14px 22px"
  button-destructive-hover:
    backgroundColor: "{colors.danger-hover}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  input-disabled:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.fg-subtle}"
  badge-accent:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.black}"
    rounded: "{rounded.card}"
    padding: "4px 12px"
  badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.sign-green}"
    rounded: "{rounded.card}"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.card}"
    padding: "20px"
  nav:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    height: "58px"
  listing-card-hover:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.black}"
---

# Design System: NomadHome

## Overview

**Creative North Star: "Gantry Signage"**

The interface reads like airport and rail wayfinding. Surfaces are flat panels cut from four materials, signal yellow, black, white and sign green, each held by a 2px black edge. Nothing floats and nothing blurs; depth is a hard bar or an edge, never a glow. Type is one family, Overpass, set at Black weight and tight leading for anything that names a place, a price or a count, so the page scans like a board rather than a brochure.

Meaning travels by shape before colour. A destination is a large word, a state is a solid, dashed or struck outline, a connector is an arrow, and a kind of space is a drawn pictogram (bed, desk). The Landing opens on a yellow hero that works as a departure form, then continues as a black departure board of stays, a black three-step strip, a green co-living field, a destination index on yellow, and a black stat strip. Search keeps the same signs at a calmer density: a yellow query band, a white filter panel, and bordered result panels.

This file records what shipped. It describes the replacement of the earlier sand, forest and terracotta look only by absence; none of those values remain.

**Key Characteristics:**

- Four materials only: signal yellow, black, white, sign green; fields are full-bleed and separated by a 2px black rule.
- 2px black edge on every panel, 0 to 4px corners, zero blur shadows.
- Overpass Variable throughout; Black (900) set solid for display and numerals.
- State by outline shape: solid, dashed, struck.
- Authored SVG pictograms and a solid arrow replace icon libraries.

## Colors

A four-material signage palette with black as the structural ink and a small set of tonal status colours darkened for AA text on their pale fills.

### Primary

- **Signal Yellow** (#FFC700): hero, destination index and CTA fields; the accent badge; lettering on black panels (prices, codes, primary button text); hover fill for result cards and departure-board rows; text selection.

### Secondary

- **Sign Green** (#00704A): the co-living field, the live/work pictogram panel, success text and edge. White text sits on it.

### Neutral

- **Black** (#0A0A0A): nav, departure board, stat tiles, primary button fill, every panel edge, body text.
- **White** (#FFFFFF): the canvas and every raised panel.
- **Inset Grey** (#F2F2F2): image wells, disabled fills, secondary and card hover.
- **Muted Ink** (#404040) and **Subtle Ink** (#545454): secondary text and placeholders; **Muted Edge** (#767676) for neutral badge edges and disabled outlines.
- **Action Hover** (#2B2B2B): primary button hover.

### Status (badges, errors)

- Success: Sign Green on #E3F1EA. Warning: #7A4F00 on #FFF1B8. Danger: #B00020 (hover #8A0019) on #FBE3E6. Info: #00508C on #E1EDF7.

### Named Rules

**The Four Materials Rule.** Backgrounds are signal, black, white or sign green. Status tints appear only inside badges and error text.
**The Ink-On-Field Rule.** Black text on signal and white; signal text on black; white text on green. Signal never sits on white as text.

## Typography

**Display, Body and Label Font:** Overpass Variable (self-hosted via fontsource; fallbacks -apple-system, Segoe UI, sans-serif)
**Mono:** system monospace stack, declared but unused on the surveyed pages.

**Character:** a humanist highway-sign grotesque. Black weight, near-solid leading and negative tracking make headings read as sign lettering; regular and bold weights carry quiet text.

### Hierarchy

- **Display** (900, clamp 2.5rem to 5rem, 0.95): H1/H2 defaults, section titles use the 4xl step (clamp 2.25rem to 3.75rem, solid leading 0.92).
- **Sign numeral** (900, clamp 3.5rem to 6rem, 0.92, tabular): night count in the hero panel and stat figures; the hero numeral is further fitted to its panel by container-query width.
- **Destination** (900, container-fitted, clamp from 1.5rem up to 11.5rem, 0.85): the hero city field; size is derived from the typed name length against its container width so any city fills the line.
- **Index city** (900, 3rem to 8rem by breakpoint, solid): destination index rows.
- **Title** (700 to 900, 1.25rem to 2.25rem): card and board titles, H3 default is 700 at 1.25rem.
- **Body** (400, 1rem, 1.55): copy, capped near 56ch.
- **Label** (700, 0.875rem): buttons, badges (0.75rem), field labels, nav links.

### Named Rules

**The Solid Setting Rule.** Anything that names a place, price or count is Black weight with leading at or below 1.05 and tracking -0.03em.
**The Tabular Number Rule.** Prices, night counts and stat figures use tabular numerals.

## Layout

Content sits in a centred 1280px wrapper with 24px gutters (48px from md). Sections are full-bleed colour fields with 64px (96px from md) vertical padding, separated by a 2px black rule. The hero is a two-column form at lg (fluid destination left, 26rem white date panel right, a full-width action row below with pictogram panel, arrow and a 80px-tall Search button) and stacks below. The departure board is a CSS grid whose areas reflow between a three-column mobile layout and a five-column lg row (code, thumbnail, city and title, price, arrow). Search places a 18rem sticky filter panel beside results at md, and turns it into a bottom sheet with a scrim below md. The spacing scale is 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px. Mobile holds down to 360px. The nav is sticky at 58px (56px plus a 2px bottom rule) and scroll padding is 4.5rem so focus stays clear of it.

## Elevation & Depth

Flat. Depth comes from edges, field colour changes and inversion on hover, not blur. The preset defines hard-bar shadows (0 1px, 2px, 4px, 6px offset, zero blur, black) but the surveyed components use none of them; treat them as reserved. No gradients, no glass.

### Named Rules

**The Flat Panel Rule.** A raised surface is a white or coloured panel with a 2px black edge. Hover changes fill (to signal, inset grey or black), never adds a shadow.

## Shapes

Square signs. Radius is 0 for the hero destination field and image-bearing badges inside cards, 2px for buttons and inputs, 4px for cards and badges; board rows, stat tiles and index rows are square. The 2px edge is drawn as a 2px border, or as a 1px border plus 1px inset ring on secondary buttons and Card, which is how the primitives keep a 2px edge. Pictograms share a 32 grid with 3-unit strokes, square caps and mitred joins, filled masses in currentColor; the arrow is a solid right-pointing block arrow. The logo is a signal square with a black arch over a base bar.

## Components

### Buttons

- **Primary:** black fill, signal lettering, 2px black border, 2px radius, 14px 22px padding, 14px bold. Hover #2B2B2B; active nudges 1px down. The hero submit enlarges it to 80px minimum height and up to 2.25rem lettering.
- **Secondary:** transparent, black text, 2px black edge, hover inset grey.
- **Tertiary:** text-only link style, underline on hover.
- **Destructive:** danger fill, white text, darker on hover.
- **Disabled:** shape change, not only colour. Primary and secondary become dashed muted-edge on inset grey with subtle ink; tertiary is struck through.

### Inputs

- 2px black edge, white fill, 2px radius, 12px 16px padding, subtle-ink placeholder. Focus turns the fill white and applies the focus ring. Invalid swaps the edge to danger; disabled is dashed on inset grey. The hero city field is the exception: borderless with a 4px bottom rule that is dashed while empty and carries Black display type, and its focus ring replaces the rule colour.

### Badges

- Tone is carried by outline: neutral, success and info solid; warning dashed; danger solid and struck; accent is signal fill with black edge. Over images the accent badge is square and pinned to the top-left corner with right and bottom edges only.

### Cards and panels

- **Card primitive:** white, 4px radius, 2px edge, 20px padding, no shadow; interactive variant fills inset grey on hover.
- **Result card (Search):** link panel with a 2px edge, 4:3 photo well (bed or desk pictogram when there is no photo), title (900, clamp to two lines), city, 30px price with tabular numerals, up to three amenities with square 8px markers. Hover and focus fill signal. Fixed title and amenity heights keep prices aligned across a row.
- **Departure board row:** black board of full-width link rows divided by 2px white rules; each row has a signal code tile, thumbnail, city, large title, signal price, tone badge and an arrow tile. Hover and focus invert to signal fill with black text and a black focus ring.
- **Destination index row:** city names at up to 8rem on yellow with a trailing arrow; hover inverts to black with signal text.
- **Stat tile and step tile:** black tile with signal figure or numbered signal square.

### Navigation

- Sticky, black, 2px bottom rule, 1280px inner wrapper. Logo mark plus name in 900 at 1.25rem. Links 14px bold white, underline on hover. Primary action is a signal button (hover to white); secondary is a white-outlined button inverting on hover. Logged-in mobile collapses to a bordered menu toggle and a dropdown under a white rule. The focus colour on the nav is signal.

### Filter chips (Search)

- Bordered 2px chips, white, hover signal, checked black with signal text and a check mark.

### Focus

- Two layers: a 3px outline in the focus colour at 2px offset plus a 2px white gap ring. The focus colour is black by default and flips to signal on black or green fields; board rows flip back to black when they turn signal.

### Motion

- Colour transitions only: 140ms (inputs), 220ms (panels), ease-out cubic-bezier(0.22, 0.61, 0.36, 1); 1px active press on buttons; skeletons pulse. Reduced motion removes all of it.

## Do's and Don'ts

### Do:

- **Do** separate sections with full-bleed colour fields and a 2px black rule.
- **Do** carry state by outline shape (solid, dashed, struck) as well as colour.
- **Do** set places, prices and counts in Black weight, solid leading, tabular numerals.
- **Do** use the authored Pictogram and Arrow components for kind-of-space and connection; add glyphs to the same 32 grid.
- **Do** keep every focus ring two-layer, and flip the focus colour to the field's contrast partner.
- **Do** write user-facing strings through `t()`.

### Don't:

- **Don't** add blur shadows, gradients, rounded pills or glass; radii stay 0 to 4px.
- **Don't** introduce a fifth surface colour or colour-only status.
- **Don't** put signal-coloured text on white.
- **Don't** use icon fonts or third-party icon sets for wayfinding glyphs.

## Disclosed placeholders (not brand rules)

The following are synthetic demo content in the build, flagged in source and in openspec/changes/refresh-visual-identity/design.md (D8, D9), and must be replaced or removed before public launch; they are not design-system content and must not be reused as patterns of truth: the stats strip (4 cities, 142 rooms, 92%, +62 NPS), the testimonial and its attribution, the featured stays (codes, titles, prices, state tags), the destination index entries and details, the co-living example monthly rate, and the remote Unsplash photos. PRODUCT.md forbids fabricated testimonials or usage statistics; the board's tag tones (available, featured, filling soon) illustrate badge shapes only.
