---
version: 1
slug: "src-pages-listingdetailpage-tsx"
primary_target: "src/pages/ListingDetailPage.tsx"
related_targets: []
---

## Scope and visitor mode

Listing detail (ListingDetailPage, /listings/:id): Operate, inheriting the landing world (gantry signage). The visitor is checking one stay and deciding whether to pick dates. The gallery and header lean Persuade, because the photo and the place name are the first proof; everything below them is Operate.

## Audience, job, action, proof, constraints

- Audience: a nomad who arrived from Search or the landing board, or from a shared link, with or without dates in the URL.
- Job: judge whether this stay fits, then pick dates and move to booking.
- Action: choose dates in the booking panel and follow Book now (guest), or Log in to book (visitor). Hosts see the listing without a booking action.
- Proof: real listing data only: photos, type, title, city, country, address, description, amenities, average rating and review count, capacity, nightly rate in its own currency. Nothing invented; absent data hides its block or states its absence (no photos, no reviews).
- Constraints: Tailwind + shadcn/ui + packages/ui, t() for all copy, WCAG 2.1 AA, 360 px to 1440 px, no route, API or schema change, existing DateRangePicker and booking flow kept.

## Direction contract

THESIS: A listing page is the sign at the destination: the place named in solid type, the facts set out like a departure-board row, one ember price band over the booking panel. Refuses the stock detail page of a floating card, rounded pills and a slate placeholder.

OWN-WORLD: The landing's wayfinding world, with no ember title band (that belongs to the Auth screens): the page stays on paper, held by 2px ink edges, with ember used once, as the price band of the booking panel. Type tag, amenity tags, the departure-board row and the panels are flat, square to 4px, edge-drawn. State is shape: absent media is a dashed stone panel, not-found is a paper panel with an ink tile, error is a danger-tint panel with a filled danger tile.

STORY: The visitor sees the real place first, reads its name, location and facts at a glance, believes it because the price, rating and amenities are plain data, and acts by picking dates and booking.

FIRST VIEWPORT: Slim navigation, the 2px-edged photo frame (up to 480px tall, dashed stone placeholder when there is no photo), then at md the main column (type tag, Black-weight title, city and address board row) beside the 24rem sticky booking panel whose ember band states the price in ink. Below md the panel stacks under the content at full width.

FORM: Local pieces inside the page, not shared components (D1 to D12 in openspec/changes/listing-detail-identity/design.md): wrapping non-interactive thumbnails under the frame; TypeTag and AmenityTag as 2px-edged paper tags; a city and address board row with 2px rules; a drawn 24-grid star in ink; the booking panel as paper with an ember price band closed by a 2px rule and the sticky offset md:top-24; StatePanel for not-found and error with a 48px tile and one H1; a skeleton sized like the real layout. The date picker sits in a wrapper that shrinks its day cells below sm so seven columns fit the panel.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict and DESIGN.md.

## Palette note

No palette or token change. Ember appears only as the price band, and the price text on it is ink (4.81). No muted ink, subtle ink or danger sits on ember. Muted and subtle ink appear only on paper.

## Unresolved decisions

- Gallery interaction: thumbnail selection or lightbox, and distinct alt text per photo (needs copy); thumbnails are non-interactive and share the title as alt text.
- DateRangePicker still shows default react-day-picker blue for today, the nav chevrons and the selected range. Its --rdp-\* overrides in DateRangePicker.tsx sit on a wrapper that .rdp-root re-declares; scope them to .rdp-root with ember and ink tokens, and capture an explicit selected-range state. Also centre the picker (mx-auto) inside the panel.
- Book now and Log in to book are single links styled with buttonVariants from @nomadhome/ui (no nested button, no shadow override), as on the other migrated screens (NH-138).
- Guest reviews are not rendered, only the count.
- Optional heavier stroke for the error "!" glyph in the state tile.
- Host, admin and booking screens remain out of scope.
