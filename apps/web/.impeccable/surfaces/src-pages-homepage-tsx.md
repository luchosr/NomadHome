---
version: 1
slug: "src-pages-homepage-tsx"
primary_target: "src/pages/HomePage.tsx"
related_targets: ["src/pages/SearchPage.tsx"]
---

## Scope and visitor mode

Landing (HomePage): Persuade. Search (SearchPage): Operate, inheriting the same world.

## Audience, job, action, proof, constraints

- Audience: digital nomad deciding where to live and work for 1 week to 3 months.
- Action: search by city and dates, in the first viewport, as a working form.
- Proof: real listings (photo, price, type, wifi, desk). There is no stats strip or testimonial. The featured stays are real listings (the newest three published), hidden when none exist; only the remote placeholder photos on the co-living and workspace fields remain to be replaced before launch.
- Search: compare many listings fast; cards with photo, type, nightly price, 2-3 amenities; filters in a side panel on desktop and a sheet on mobile; no map.
- Constraints: Tailwind + shadcn/ui + packages/ui, t() for all copy, WCAG 2.1 AA, mobile down to 360 px, USD only, no post-MVP features implied.

## Direction contract

THESIS: A long stay is a destination, and the page is the overhead sign that points to it. Refuses the category default of a hero photo with a search bar over a card grid.

OWN-WORLD: International airport and rail wayfinding. Ember enamel panels (#E65F35) with ink edges, ink grotesque set solid and very large, paper and sage (#96A8A6) as secondary panels, a custom pictogram set (bed, desk) drawn as SVG, arrows as the only connector. State is carried by shape (solid, dashed, struck) as well as colour. One panel states one fact. Recognizable with all content removed: ember gantry panels, ink type, arrows, pictograms.

STORY: The visitor understands that NomadHome books a place to live and a place to work together for weeks, believes it because the listings and prices are real and plainly stated, and acts by entering a city and dates.

FIRST VIEWPORT: A full-width ember sign panel. The city input is the destination line in the largest type; the dates and a monumental stay-length numeral sit in a second panel to its right; below, Live and Work pictograms share one arrow pointing at the search action, which is a solid ink panel and the most prominent control. Slim navigation above, no hero photo.

FORM: Airport and rail wayfinding gantry, candidate 3 of my grounded list of seven, seed:b4445a662b2b8efb. Raises: monumental stay-length numeral (from the crisis-wall challenger), state by shape not hue (from the emission-line rail), one panel one fact (from the glazier partition).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Palette revision

NH-129 (warm-palette-swap) replaced the original yellow, black, white and green palette with ember #E65F35, sage #96A8A6, paper #F7F5F2, stone #E5E2DD and ink #1E1E1E. The world, form and layout above are unchanged; see apps/web/DESIGN.md for the shipped system.

## Unresolved decisions

- Concrete typeface, chosen at build from outside the default-font list.
- No image generation in this environment: pictograms are authored SVG; listing photos come from seed or hosts.
- Host, admin, and booking screens are out of scope for this pass.
