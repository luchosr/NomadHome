---
version: 1
slug: "src-pages-hostlistingspage-tsx"
primary_target: "src/pages/HostListingsPage.tsx"
related_targets:
  [
    "src/pages/HostUpcomingPage.tsx",
    "src/pages/CreateListingPage.tsx",
    "src/pages/EditListingPage.tsx",
    "src/pages/BecomeHostPage.tsx",
    "src/components/ListingStatusTag.tsx",
    "src/components/listingFormStyles.ts",
    "src/components/AmenityCheckboxGrid.tsx",
    "src/components/CreateListingForm.tsx",
    "src/components/ListingDetailsForm.tsx",
    "src/components/ListingPhotosCard.tsx",
    "src/components/ListingAvailabilityCard.tsx",
  ]
---

## Scope and visitor mode

Host dashboard and listing forms (HostListingsPage at /host/listings, HostUpcomingPage at /host/upcoming, CreateListingPage at /host/listings/new, EditListingPage at /host/listings/:id/edit, BecomeHostPage at /become-host, plus the listing form, photos and availability components): Operate, inheriting the landing world (gantry signage). The host scans their listings, reads a status, fills a long form, uploads photos and blocks dates. Ambition shows as precision: one clear column per screen, shape-coded status, one field grammar shared by every form and complete accessibility, not extra decoration or features.

## Audience, job, action, proof, constraints

- Audience: a signed-in host (or a guest becoming one) managing one to a few co-living properties or workspaces, on a laptop or a phone.
- Job: know which listings are live, publish or pull one, keep a listing accurate, and see who is coming.
- Action: New listing and Edit (host listings); Create listing, Save, Publish or Unpublish, Upload photo, Delete, Block (forms); Become a host.
- Proof: real listing and booking data only: title, type, city, country, primary photo, status, confirmed-bookings count, guest email, dates, amount. Nothing invented; no analytics, earnings or occupancy figures.
- Constraints: Tailwind + shadcn/ui + packages/ui, t() for all copy (no key or string value changed), WCAG 2.1 AA, 360 px to 1440 px, no route, API, query, mutation, validation or schema change, nothing changed in packages/ui.

## Direction contract

THESIS: A host's inventory is a timetable: flat rows with a status you read by its outline before its colour, and forms that all speak one field grammar. Refuses the stock admin card of a shadow, a rounded pill badge, a red or green status chip and a different input style on every form.

OWN-WORLD: The landing's wayfinding world on paper, held by 2px ink edges, with no ember at all: these are work screens, not destinations, so the ember title band stays with Auth and the primary action is the ink button. A listing status is a tag: draft is dashed (not live yet), published is solid with an ink square marker, disabled is solid in a muted edge with struck text. A listing without a photo shows the bed or desk pictogram on stone instead of an empty square. An error is a danger-tint panel with a filled danger tile and one H1. Field errors and hints are left bars, so they are shape, not colour.

STORY: The host opens a list of 2px-edged rows, reads each status by its tag, edits one in a single column of cards and fields that look the same on Create and Edit, and checks upcoming bookings as a table, or as cards on a phone.

FIRST VIEWPORT: Host listings: the Black-weight title beside the ink New listing link, then flat rows each with a 64px framed thumbnail or pictogram tile, title, type and city, a status tag and Edit. Edit: title, the status tag with Publish or Unpublish, then 2px-edged cards for details, photos and availability. Bookings: title over a flat table from sm, 2px-edged cards below it.

FORM: Local pieces per file (a local StatePanel, a local booking StatusTag), plus two shared host files: ListingStatusTag and listingFormStyles (LABEL_CLASS, CONTROL_CLASS, HINT_CLASS, ERROR_BAR_CLASS, CHECKBOX_CLASS). Link CTAs are single links styled with buttonVariants, never a Button inside a Link. Create wraps each field in FormField; Edit shares the same classes. AmenityCheckboxGrid is one real checkbox per amenity with a drawn check glyph. Every form error renders through ServerErrorAlert. The edit cards use the plain Card (border-2, no ring).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict and DESIGN.md.

## Palette note

No palette or token change and no ember on any host screen. Ink on paper carries titles, labels and tag text (15.32); muted ink carries meta lines, hints and table cells (10.20); success carries the confirmed-bookings count in bold (6.82). The disabled and cancelled tag edge uses border-muted (4.93 on paper); its 12px muted struck label is legible at 10.20 but small. Danger text sits on paper or the danger tint only.

## Unresolved decisions

- StatePanel is local to HostListingsPage, HostUpcomingPage and EditListingPage, besides ListingDetailPage and BookingFormPage; a shared extraction is the next refactor, with a shared booking StatusTag (HostUpcomingPage copies the MyBookingsPage tag).
- The Badge pill in packages/ui remains for AdminListingsPage until issue #123.
- NH-138 closed the former Link-in-Button nesting and the local primitive overrides: link CTAs use buttonVariants, and secondary Button and Card are plain border-2 with the full two-layer focus ring.
- Photo treatment beyond the square frame, and no photo placeholders, belong to issue #121; the hard-coded English `Photo N` alt in ListingPhotosCard needs t() work.
- The check glyph is duplicated in AmenityCheckboxGrid and BecomeHostPage.
- Pre-existing: Create uses a GroupedSelect for country and currency while Edit uses text inputs; the BecomeHost terms error is not linked by aria-describedby; hints on every form are not linked either.
