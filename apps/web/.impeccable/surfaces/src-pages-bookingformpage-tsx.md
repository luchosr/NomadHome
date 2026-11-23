---
version: 1
slug: "src-pages-bookingformpage-tsx"
primary_target: "src/pages/BookingFormPage.tsx"
related_targets:
  [
    "src/pages/BookingSuccessPage.tsx",
    "src/pages/BookingCancelPage.tsx",
    "src/pages/MyBookingsPage.tsx",
    "src/components/Modal.tsx",
    "src/components/CancelBookingModal.tsx",
    "src/components/ReviewModal.tsx",
    "src/components/EmptyState.tsx",
  ]
---

## Scope and visitor mode

Booking and payment (BookingFormPage at /listings/:id/book, BookingSuccessPage, BookingCancelPage, MyBookingsPage at /bookings, plus the cancel and review dialogs and the shared EmptyState): Operate, inheriting the landing world (gantry signage). The guest has already chosen a stay and dates. They confirm a price, pay through Stripe Checkout, wait for confirmation, read a status, cancel or review. Ambition shows as precision: one sign panel per screen, exact pairings, shape-coded state, no extra features.

## Audience, job, action, proof, constraints

- Audience: a signed-in guest who arrived from the listing detail booking panel, from Stripe's success or cancel redirect, or from the account navigation.
- Job: be sure of what will be charged, pay without doubt, then keep track of the booking.
- Action: Pay now (form); View bookings (success); back to the listing or to search (cancel); complete payment, cancel or review (my bookings).
- Proof: real quote and booking data only: listing title, city, country, photo, raw check-in and check-out dates, nightly rate times nights, service fee, total charged, booking id, status. Nothing invented; no itemised breakdown, status timeline or payment-method display.
- Constraints: Tailwind + shadcn/ui + packages/ui, t() for all copy (no key or string value changed), WCAG 2.1 AA, 360 px to 1440 px, no route, API, query, Stripe, polling or schema change, nothing changed in packages/ui.

## Direction contract

THESIS: A booking is a ticket: the stay and dates set out as plain rows, one ember band that states the total in ink, and a status you read by its outline before its colour. Refuses the stock checkout card of a shadow, a rounded pill badge and green and red status chips.

OWN-WORLD: The landing's wayfinding world on paper, held by 2px ink edges. Ember appears once per screen at most and always carries ink: the total band on the form and the success panel. State is shape: pending is dashed (a dashed stone panel while waiting, a dashed status tag), done is solid, gone is struck through, completed adds an ink square marker, an error is a danger-tint panel with a filled danger tile, a neutral stop (payment cancelled) is a paper panel with an outlined tile. Dialogs and the empty state use the same 2px edge with no shadow.

STORY: The guest reads the stay, sees the total on the ember band, pays with one button, lands on a panel that confirms or waits, and finds the booking later with a tag that says its state in shape and words.

FIRST VIEWPORT: Form: the Black-weight title over one paper summary panel (framed photo, title, place, dates, price rows) closed by the ember total band, then Pay now and a quiet back link, in a 36rem column. Success: one ember panel with an ink check tile, title, message and booking id, closed by a paper foot holding the single View bookings link. My bookings: title over 2px-edged cards, each with a status tag and its actions.

FORM: Local pieces inside each file (D1 to D13 in openspec/changes/booking-payment-identity/design.md). Link CTAs are single links styled with buttonVariants from @nomadhome/ui (the back link is tertiary plus px-2 underline hover:no-underline), never a Button inside a Link. Pay now stays the Button primitive. Form states use a local StatePanel (48px tile; calendar glyph for no dates, "!" for errors, one H1). Success and cancel use a 64px tile and a foot under a 2px rule. MyBookings has a local StatusTag and flat 2px cards that keep rounded-card. Modal drops the shadow for a 2px ink edge and a flat ink/40 scrim, and is a native dialog (showModal, onClose, Escape and backdrop close, focus return, scroll lock). ReviewModal draws its own 24-grid star glyph (filled or outlined, aria-hidden, aria-labels unchanged). EmptyState is a flat 2px dashed panel with a calendar glyph. Errors inside dialogs use ServerErrorAlert.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict and DESIGN.md.

## Palette note

No palette or token change. Ink is the only text on ember (4.81): the total label and amount, the success title, message and booking id. No muted ink, subtle ink, paper or danger text sits on ember (3.19, 3.20, 2.20, 2.33). The cancelled tag edge uses border-muted (4.93 on paper, 4.15 on stone). Muted and subtle ink appear only on paper or stone.

## Unresolved decisions

- Modal accessibility is closed by NH-146 (openspec/changes/modal-a11y): Modal is a native dialog with showModal(), a required onClose, Escape and backdrop close, focus move and return, Tab containment, inert background and a body scroll lock. Not tracked here any more.
- NH-138 removed the Link-in-Button nesting (EmptyState, HostListingsPage) and the local secondary-button overrides: the secondary Button is plain border-2 border-border and shows the full two-layer focus ring.
- Copy defects not fixed here: the timed-out path on the success page shows the confirmed copy; the Complete payment handler has no catch, so a failure is silent; star aria-labels are hard-coded English; the form shows raw ISO dates while My bookings uses formatDate.
- The Badge pill in packages/ui still encodes tone mostly by colour; MyBookingsPage carries a local status tag until a shape-per-tone Badge exists.
- A shared StatePanel once three or more screens carry the same tile and panel (the form keeps its own copy of the one in ListingDetailPage).
- The MyBookings loading skeleton still uses the default Skeleton radius (2px); only the form and waiting skeletons are square.
