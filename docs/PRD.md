# NomadHome — Product Requirements Document (MVP)

> **Status**: Draft v0.1
> **Last updated**: 2026-05-26
> **Owner**: Product (Luciano Ramello)
> **Scope**: MVP only. Post-MVP capabilities are listed in the appendix as deferred, not as requirements.
> **Source of truth**: This PRD describes intent. The canonical, machine-validated requirements live in `openspec/specs/`. When this document and an approved OpenSpec change disagree, OpenSpec wins and this PRD must be updated.

---

## 1. Executive Summary

NomadHome is a SaaS marketplace connecting digital nomads and remote teams with co-living spaces and workspaces, and the property hosts/operators who provide them. The MVP ships the smallest end-to-end booking loop that proves the product: a guest can discover a listing, book it, pay through Stripe Checkout, complete the stay, and leave a review; a host can list inventory and see upcoming bookings; an admin can keep the marketplace clean.

The MVP is a **learning vehicle**, not a growth vehicle. Success is measured by the number of completed end-to-end stays, host activations, and the depth of qualitative feedback we gather from both sides — not by GMV or vanity volume metrics.

## 2. Problem Statement

Digital nomads, remote workers, and distributed teams need flexible housing and workspace across cities, with terms shorter than a traditional lease and richer than a hotel stay. Today they assemble this from a patchwork of channels — Airbnb for short stays, individual co-living operators for medium stays, separate coworking platforms for desks, plus informal Facebook and Slack groups for the long tail. The result is fragmented discovery, inconsistent trust signals, no portable identity or review history, and operational friction at every step.

On the supply side, independent co-living and workspace operators lack a focused channel to reach this audience. Generic short-term rental platforms optimize for nightly stays and miss the community-led, longer-stay use case that defines co-living.

NomadHome consolidates discovery, booking, payment, and a basic trust layer into a single platform purpose-built for this audience.

## 3. Goals and Non-Goals

### 3.1 MVP Goals

1. Validate that guests will book co-living and workspace stays through a dedicated platform when given a clean end-to-end flow.
2. Validate that independent hosts and small operators will list inventory and complete payouts through the platform.
3. Establish the architectural foundation (auth, listings, booking, payments, reviews) so post-MVP capabilities can be added without core refactors.
4. Generate enough qualitative signal from real stays to inform Post-MVP prioritization with evidence, not opinion.

### 3.2 Non-Goals (MVP)

The MVP explicitly does not deliver:

- PWA, offline support, native mobile apps
- Internationalization (English-only UI; codebase is i18n-ready via a `t()` helper)
- OAuth or social login
- In-app messaging between guests and hosts
- Push notifications (transactional email only)
- Calendar sync (iCal, Google Calendar)
- Automated host payouts, refund automation, multi-tier billing, invoices
- Community features (member directory, events, interest groups, house rules)
- Roommate matching or compatibility scoring
- Dynamic pricing, yield management, occupancy optimization
- Channel manager integrations (Airbnb, Booking.com)
- Analytics dashboards for hosts or admins beyond minimal lists
- Dispute resolution workflows
- Public partner API
- Multi-currency (USD-only for MVP unless Stripe Checkout default differs)
- Background checks, government ID verification (basic email-verified identity only)

Any request to add the above triggers Scope Defense per `CLAUDE.md` §9 Checkpoint F.

## 4. Success Metrics

The MVP is **learning-led**. We optimize for evidence over volume.

### 4.1 Primary (qualitative validation targets)

| Metric | Target | Why it matters |
| ------ | ------ | -------------- |
| Onboarded hosts with at least one active listing | 10 | Proves we can attract supply without paid acquisition |
| Completed end-to-end stays (booked, paid, checked out, reviewed) | 20 | Proves the full loop works in the wild |
| Post-stay guest interviews completed | 15 | Generates the qualitative signal that drives Post-MVP prioritization |
| Post-stay host interviews completed | 5 | Surfaces supply-side friction |

### 4.2 Secondary (health signals, not targets)

- Search-to-booking conversion (instrumented, not optimized for in MVP)
- Time-to-first-booking for new listings
- Review submission rate (% of completed stays with a guest review)
- Stripe Checkout payment failure rate
- Auth/booking error rate from server logs

### 4.3 Explicitly not measured in MVP

GMV, take rate, MRR, occupancy %, retention cohorts, NPS. These are Post-MVP concerns. Setting them as MVP targets would distort the learning agenda.

## 5. Personas

### 5.1 Digital Nomad / Remote Worker (primary guest)

- **Context**: Works remotely, travels 4–12 months a year, books stays of 1 week to 3 months at a time, values flexibility and community.
- **Jobs to be done**: Find a place to live and work in a new city without committing to a lease; meet other nomads; get reliable internet and a workspace without piecing it together.
- **Top frustrations today**: Airbnb is overpriced and not built for stays beyond a few weeks; individual co-living operators are hard to compare; trust is opaque.
- **What MVP must deliver for them**: Search by city and dates, see honest listings with photos and amenities, book and pay in one flow, leave a review after the stay.

### 5.2 Remote Team Lead (secondary guest)

- **Context**: Manages a distributed team of 4–20 people, plans 1–2 team offsites per year, needs co-living plus workspace for the group.
- **Jobs to be done**: Book group accommodation and meeting/workspace in one place; predictable all-inclusive pricing; clear cancellation terms.
- **Top frustrations today**: Coordinating across multiple bookings, no group-booking primitives in existing platforms.
- **MVP treatment**: Treated as multiple parallel guest bookings against the same listing. Group-booking as a first-class object is **Post-MVP**.

### 5.3 Property Host / Co-living Operator (primary supplier)

- **Context**: Owns or operates one to a few co-living properties or workspaces, currently lists on Airbnb and direct channels, wants a focused audience.
- **Jobs to be done**: List inventory with minimal friction, see upcoming bookings, get paid reliably.
- **Top frustrations today**: Airbnb optimization is hostile to longer stays; direct channels mean DIY marketing; tax and payout handling is opaque.
- **What MVP must deliver for them**: Create and edit listings (photos, description, amenities, nightly rate, availability), see a list of upcoming bookings, receive payouts (manual flow in MVP).

### 5.4 Platform Admin (internal)

- **Context**: Internal NomadHome operator. Probably the founder during MVP.
- **Jobs to be done**: Moderate the marketplace at the bare minimum needed to keep it trustworthy.
- **MVP scope**: List users, disable a user, list listings, disable a listing. Nothing more.

## 6. MVP Scope (Capabilities)

This section maps to the MVP table in `CLAUDE.md` §2 and is the canonical list of capability buckets for OpenSpec. Each capability will be specified in detail under `openspec/specs/<capability>/spec.md` via the OpenSpec workflow.

| # | Capability | One-line description |
|---|------------|----------------------|
| 1 | Identity | Email/password registration and login; JWT + refresh tokens; roles: `guest`, `host`, `admin`; bcrypt password hashing; basic auth event audit log |
| 2 | Listings | Hosts can create, edit, publish, and unpublish listings (properties and workspaces) with photos, amenities, nightly rate, and an availability calendar |
| 3 | Search | Guests can search listings by city, date range, and type (property/workspace); basic filters (price, amenities, capacity) |
| 4 | Booking | Guests can request a reservation for a date range; hosts auto-accept (instant booking only in MVP); guests can cancel before check-in per policy |
| 5 | Payments | Stripe Checkout for guest payment at booking time; platform takes a split service fee (guest-side) + commission (host-side); host payouts are **manual** in MVP |
| 6 | Reviews | One guest review per completed booking: 1–5 stars + free text; reviews visible on listing detail |
| 7 | Host tooling | Minimal host dashboard: list of own listings, list of upcoming bookings on those listings |
| 8 | Admin | Role-guarded admin views in `apps/web/`: list users, disable a user; list listings, disable a listing |
| 9 | Platform | English-only, mobile-responsive web; all user-facing strings routed through a `t()` helper for future i18n |
| 10 | Compliance | bcrypt hashing, HTTPS in production, basic audit log of auth events |

## 7. Revenue Model (MVP)

NomadHome charges a **split fee** on every completed booking:

- **Guest service fee**: A percentage added on top of the host's listed price at checkout. Disclosed in the price breakdown before the guest pays.
- **Host commission**: A percentage deducted from the host's payout amount.

The exact percentages are a business decision tracked outside this PRD; the system must support configuring them as platform-level settings without code changes (e.g., environment variables or a single config table row).

Constraints:

- Both fees are calculated at booking time and snapshotted onto the booking record so changes to the configured rates do not retroactively alter existing bookings.
- Payouts are **manual** in MVP: the admin sees what is owed to each host and triggers a payout out-of-band (bank transfer, Wise, etc.). The platform records that the payout happened.
- No refunds, partial refunds, or fee waivers are automated in MVP. They are handled by admin intervention.

Automation of payouts, refunds, and invoicing is explicitly Post-MVP.

## 8. User Stories and Acceptance Criteria

User stories follow the format: *As a [persona], I want [capability] so that [outcome].* Acceptance criteria are written in Given/When/Then and will be lifted verbatim into OpenSpec delta specs.

### 8.1 Identity

**US-1.1** — As a new visitor, I want to register with email and password so that I can become a guest or host.

- **Given** a valid email not yet registered and a password meeting policy (min 10 chars, 1 letter, 1 number)
- **When** I submit the registration form
- **Then** my account is created with role `guest` by default, my password is stored as a bcrypt hash, and I receive a verification email
- **And** the auth audit log records `user.registered` with timestamp and IP

**US-1.2** — As a registered user, I want to log in so that I can access my account.

- **Given** valid credentials for a verified account
- **When** I submit the login form
- **Then** I receive an access token (JWT, short-lived) and a refresh token (longer-lived) and the audit log records `user.login_succeeded`
- **Given** invalid credentials, **Then** I receive a generic error (no enumeration), and the audit log records `user.login_failed`

**US-1.3** — As a guest, I want to upgrade to a host role so that I can list a property.

- **Given** I am logged in as a guest
- **When** I complete the host onboarding form
- **Then** my account gains the `host` role in addition to `guest`, and I can access host-only routes

### 8.2 Listings

**US-2.1** — As a host, I want to create a listing so that guests can discover and book it.

- **Given** I am authenticated as a host
- **When** I submit a listing with title, description, type (`property` or `workspace`), city, capacity, nightly rate, at least one photo, and at least one amenity
- **Then** the listing is created in `draft` status, owned by me, and visible only to me until published

**US-2.2** — As a host, I want to publish a listing so that it appears in guest search results.

- **Given** I own a `draft` listing with the minimum required fields
- **When** I publish it
- **Then** its status becomes `published` and it becomes searchable
- **And** I can revert to `draft` at any time to remove it from search

**US-2.3** — As a host, I want to manage listing availability so that I do not get double-booked.

- **Given** I own a published listing
- **When** I block a date range that has no existing blocks or bookings overlapping it
- **Then** that range is unavailable for booking and does not appear as bookable in search results

- **Given** I own a published listing
- **And** the date range I attempt to block overlaps an existing `BOOKING_HOLD` (whether the underlying booking is in `PENDING_PAYMENT` or `CONFIRMED`)
- **When** I submit the block
- **Then** the operation fails with `409 OVERLAP_CONFLICT`
- **And** the response includes the conflicting booking's identifier so I can contact the affected guest (full response shape in `docs/data-model.md` §3.10)
- **And** the existing booking is left unchanged

- **Given** I own a published listing
- **And** the date range I attempt to block overlaps an existing `HOST_BLOCK` of my own, or an `ADMIN_BLOCK`
- **When** I submit the block
- **Then** the operation fails with `409 OVERLAP_CONFLICT`
- **And** the response identifies the conflicting block; for an `ADMIN_BLOCK` the host's remedy is to contact an admin

### 8.3 Search

**US-3.1** — As a guest, I want to search listings by city and date range so that I can find places to stay.

- **Given** I provide a city, a check-in date, and a check-out date
- **When** I submit the search
- **Then** I receive a paginated list of published listings in that city that have availability for the entire requested range
- **And** the listing card shows photo, title, type, nightly rate, and computed total for the requested range

Pagination contract (canonical spec: `openspec/specs/search/spec.md`):

- Query parameters: `?page=<int ≥ 1>&pageSize=<int ∈ [1, 100]>`. Defaults: `page=1`, `pageSize=20`.
- Response envelope: `{ data: ListingCard[], pagination: { total, page, pageSize, hasMore } }` — `total` is the count across all pages; `hasMore` is `page * pageSize < total`.
- Out-of-range parameters return `400` with a structured Zod validation error; the controller is not invoked. Rationale: ADR archived under `openspec/changes/archive/<date>-decide-search-pagination/design.md`.

**US-3.2** — As a guest, I want to filter search results so that I can narrow down candidates.

- **Given** I have a result set
- **When** I apply filters (price range, type, amenities, capacity)
- **Then** the results update and only listings matching all filters are shown

### 8.4 Booking

**US-4.1** — As a guest, I want to book a listing so that I can secure my stay.

- **Given** I am authenticated and a listing is available for my requested dates
- **When** I confirm the booking and complete Stripe Checkout
- **Then** a `booking` record is created with status `confirmed`, the dates are blocked on the listing's availability, both the guest service fee and host commission are snapshotted, and a confirmation email is sent to the guest and the host

**US-4.2** — As a guest, I want to cancel a booking before check-in so that I can recover if my plans change.

- **Given** I have a `confirmed` booking with a check-in date in the future
- **When** I cancel it
- **Then** the booking status becomes `cancelled`, the dates are released on the listing's availability, the host is notified by email
- **And** any refund is recorded as `pending_admin` (refund execution is manual in MVP)

### 8.5 Payments

**US-5.1** — As a guest, I want to pay for a booking through a trusted checkout so that I do not have to enter card details on a small platform.

- **Given** I have selected a listing and date range
- **When** I proceed to payment
- **Then** I am redirected to a Stripe Checkout session showing the host price, the guest service fee, and the total
- **And** on successful payment, I am redirected back to a confirmation page

**US-5.2** — As an admin, I want to see what is owed to each host so that I can trigger payouts.

- **Given** I am authenticated as an admin
- **When** I view the payouts page
- **Then** I see, per host, the sum of confirmed-and-checked-out bookings minus the host commission, minus any payouts already recorded

**US-5.3** — As an admin, I want to record a payout to a host so that I can mark the affected bookings as settled and track the out-of-band transfer.

- **Given** I am authenticated as an admin
- **And** the target host has at least one settled-but-unpaid booking — status `confirmed` with check-out date in the past, not yet linked to any `PayoutBooking`
- **When** I open the payouts view and select that host
- **Then** I see the total amount owed grouped by currency, computed as the sum of `booking.payoutCents` (i.e. `subtotalCents − hostCommissionCents`) over their eligible bookings

- **Given** I am viewing the amount owed to a specific host
- **When** I submit a payout record providing:
  - **method** — one of `bank_transfer`, `wise`, `paypal` (matches the strings in `docs/data-model.md` §3.16 `Payout.method`)
  - **external reference** — the transaction ID from the chosen method (recorded on `Payout.externalReference`)
  - **the set of bookings** the payout covers (each must be one of the host's settled-and-unpaid bookings)
- **Then** a `Payout` row is created with my user id as `recordedByAdminId`
- **And** a `PayoutBooking` row links each covered booking to the new payout
- **And** those bookings no longer appear in the amount-owed view for that host
- **And** the operation is atomic — either every `PayoutBooking` insert succeeds and the `Payout` is created, or the entire request fails and no partial state is left behind

- **Given** I attempt to record a payout whose booking set includes a booking already linked to an existing `PayoutBooking`
- **When** I submit the request
- **Then** the operation fails with `409 CONFLICT` referencing the conflicting `bookingId` (the `PayoutBooking.bookingId` UNIQUE constraint prevents double-settlement)
- **And** no `Payout` row is created

> Note: refund execution, partial refunds, and host-Stripe-Connect-based automated payouts are explicitly Post-MVP per `openspec/project.md` §3.1 row "Payments." Manual payout recording is the entire MVP money-out workflow.

### 8.6 Reviews

**US-6.1** — As a guest, I want to review a listing after my stay so that I can share my experience.

- **Given** I have a `confirmed` booking whose check-out date has passed
- **When** I submit a review with 1–5 stars and optional free text
- **Then** the review is attached to the booking and the listing, and is visible on the listing's detail page
- **And** I cannot submit more than one review per booking

### 8.7 Host Tooling

**US-7.1** — As a host, I want to see my upcoming bookings so that I can prepare for arrivals.

- **Given** I am authenticated as a host
- **When** I open my dashboard
- **Then** I see a list of bookings on my listings with status `confirmed` and check-in in the future, sorted by check-in date

### 8.8 Admin

**US-8.1** — As an admin, I want to disable a user so that I can remove bad actors.

- **Given** I am authenticated as an admin
- **When** I disable a user
- **Then** that user can no longer log in, their listings (if any) are hidden from search, and existing confirmed bookings are flagged for admin review

**US-8.2** — As an admin, I want to disable a listing so that I can remove misleading or unsafe inventory.

- **Given** I am authenticated as an admin
- **When** I disable a listing
- **Then** the listing is removed from search and cannot be booked; existing confirmed bookings remain visible to host and guest with a notice

**US-8.3** — As an admin, I want disabling a user to cascade to their upcoming bookings as a guest so that affected hosts are aware and can react.

- **Given** I am authenticated as an admin
- **And** the target user has one or more `confirmed` future bookings as a guest
- **When** I disable that user
- **Then** each affected booking is flagged for admin review with reason `GUEST_DISABLED`
- **And** the bookings remain in status `confirmed` — the admin decides whether to cancel and refund out-of-band, consistent with US-4.2 and US-5.2

> Note: when the disabled user is also a host with active listings, the host-side cascade in US-8.1 still applies. A single admin "disable user" action can therefore produce both `HOST_DISABLED` and `GUEST_DISABLED` flag rows for different bookings of the same disabled user.

## 9. Customer Journey (MVP)

The MVP supports a trimmed version of the 14-step journey in `product-description.md`. Steps not yet supported are noted.

1. **Discovery (off-platform)** — Out of scope for MVP; assumed via word of mouth and direct outreach during the pilot.
2. **Landing** — Public homepage explains who NomadHome is for and offers a search bar.
3. **Search** — Guest searches by city and dates (US-3.1, US-3.2).
4. **Listing detail** — Guest reviews photos, amenities, location (basic map), and past reviews.
5. **Registration** — Guest creates an account (US-1.1, US-1.2). No ID verification, no application step in MVP.
6. **Booking and payment** — Instant booking via Stripe Checkout (US-4.1, US-5.1). No application or host approval step in MVP.
7. **Pre-arrival** — Automated confirmation email with host contact and check-in instructions provided by the host on the listing. No in-app messaging.
8. **Check-in** — Out-of-platform; host handles directly.
9. **During the stay** — Out-of-platform; no in-app messaging, events, or maintenance tickets in MVP.
10. **Check-out** — Date-based; no digital check-out flow.
11. **Review** — Guest leaves a review (US-6.1). Host-to-guest reviews are Post-MVP.
12. **Retention** — Out of scope for MVP.

## 10. Technical Constraints

The full technical stack is locked in `CLAUDE.md` §3. PRD-level constraints:

- **Architecture**: Monorepo, layered (controller → service → repository), domain-driven boundaries per capability listed in §6. Admin functionality lives behind role-guarded routes in `apps/web/`; no separate `apps/admin/` in MVP.
- **API contract**: REST. Zod schemas in `packages/shared/` are the single source of truth for request/response shapes, shared between frontend and backend.
- **Auth**: JWT access tokens (short-lived) plus refresh tokens stored server-side as revocable opaque records. Refresh tokens use an absolute 30-day TTL from issuance with **sliding rotation on use**: each successful refresh issues a brand-new refresh token (also 30-day TTL) and revokes the presented one. **Reuse detection**: presenting an already-revoked refresh token revokes every other active refresh token belonging to the same user and logs `user.refresh_token_reuse_detected`. **Logout** revokes only the refresh token used to call the logout endpoint; other devices remain logged in. Access-token TTL is the remaining open item, deferred to the first ticket of `add-identity`. Full specification: `openspec/specs/identity/spec.md`; rationale: ADR archived under `openspec/changes/archive/<date>-decide-refresh-token-policy/design.md`.
- **Payments**: Stripe Checkout only (no Stripe Elements, no custom card collection). Webhook handler updates booking status on `checkout.session.completed`.
- **Email**: Resend or SendGrid for transactional email. No marketing email infrastructure in MVP.
- **i18n readiness**: All user-facing strings go through a `t(key)` helper backed by an English-only lookup table. No `i18next` dependency in MVP.
- **Testing**: Vitest (unit + integration) with ≥80% coverage on changed lines; Playwright for critical user-flow E2Es (register, search, book, review).
- **Compliance**: HTTPS in production; bcrypt for password hashing; basic auth event audit log (registered, login_succeeded, login_failed, password_reset_requested).

## 11. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Insufficient supply on launch leads to empty search results and abandoned visits | High | High | Pre-launch host outreach; do not open guest signups until ≥10 listings are live |
| Manual payouts create operational error and host distrust | Medium | High | Tight payout audit log; weekly payout cadence published; clear host T&Cs that MVP payouts are manual |
| Stripe Checkout fee structure surprises hosts at first payout | Medium | Medium | Hosts see expected payout amount per booking in their dashboard before confirming the listing goes live |
| Scope creep from stakeholders requesting Post-MVP items (messaging, community, mobile) | High | High | Checkpoint F in `CLAUDE.md` §9 enforces explicit scope-defense; PRD non-goals list (§3.2) is canonical |
| Trust gap because there is no ID verification | Medium | Medium | MVP positioned to a small, hand-picked pilot audience where trust is human-mediated; broader trust tooling is Post-MVP |
| Stripe account / KYC delays block hosts | Medium | Medium | Manual payouts in MVP sidestep this; hosts do not need their own Stripe account |
| Spec drift between this PRD and OpenSpec specs | Medium | Medium | OpenSpec is the source of truth; any PR that changes behavior must touch the relevant spec, and this PRD is updated in the same change |

## 12. Open Questions and Assumptions

Each item below blocks or shapes a downstream OpenSpec change. Resolve before the corresponding capability is implemented.

- **[OPEN]** Exact guest service fee % and host commission % — needed before US-5.1.
- **[OPEN]** Cancellation policy windows and refund tiers — needed before US-4.2.
- **[OPEN]** Minimum and maximum stay rules per listing — assumed Post-MVP unless flagged otherwise.
- **[OPEN]** Photo storage backend (S3, Cloudflare R2, Supabase) — needed before US-2.1.
- **[OPEN]** Initial pilot recruitment plan for hosts and guests — owned by Product, not Engineering.
- **[ASSUMPTION]** USD-only pricing for MVP. Multi-currency is Post-MVP.
- **[ASSUMPTION]** Email verification is required before a user can book or list, but not before they can browse.
- **[ASSUMPTION]** Bookings cannot span across listings (no multi-listing cart in MVP).
- **[ASSUMPTION]** Group bookings for remote teams are handled as N parallel single-guest bookings; first-class group-booking is Post-MVP.

## 13. Rollout

- **Phase 0 — Foundation** (OpenSpec change `init-monorepo` and successors): monorepo skeleton, CI/CD, auth, listings.
- **Phase 1 — Booking loop**: search, booking, Stripe Checkout, reviews.
- **Phase 2 — Operator surfaces**: host dashboard, admin views, manual payout reporting.
- **Phase 3 — Closed pilot**: hand-picked hosts (target ≥10), invite-only guest access, structured post-stay interviews.
- **Phase 4 — Decision gate**: review qualitative findings, decide on the first Post-MVP capability to promote (likely candidates: in-app messaging, community profiles, automated payouts).

No fixed calendar timeline; phase exit is gated on the success metrics in §4.

## 14. Appendix A — Post-MVP Backlog (Deferred)

The following are not requirements of this PRD. They are listed for context so future scope-promotion conversations have a starting point. Each line will become its own PRD section (or its own PRD) when promoted.

- PWA, offline support, native mobile (iOS / Android)
- Internationalization (i18n) and multi-currency
- OAuth and social login (Google, Apple)
- In-app messaging (guest ↔ host ↔ community manager)
- Push notifications
- Calendar sync (iCal, Google Calendar)
- Automated host payouts, refund automation, invoices, billing tiers
- Community features: member directory, events, interest groups, house rules
- Roommate matching and compatibility scoring
- Dynamic pricing and yield management
- Channel manager integrations (Airbnb, Booking.com)
- Analytics dashboards (host-side and admin-side)
- Dispute resolution workflows
- Public partner API
- Identity verification (government ID, selfie match, background checks)
- GDPR data export and self-service deletion tooling
- Host-to-guest reviews
- Group / team-offsite bookings as a first-class object
- Multi-listing cart / multi-leg trips
- Access control: digital keys, QR codes, smart-lock integrations
- Loyalty, referrals, alumni community

## 15. Appendix B — Glossary

- **Booking** — A confirmed reservation by a guest against a listing for a specific date range.
- **Listing** — A bookable inventory item owned by a host (either a `property` for co-living stays or a `workspace` for desks/meeting rooms).
- **Host** — A user with the `host` role who owns one or more listings.
- **Guest** — A user with the `guest` role who books listings. Default role for new accounts.
- **Admin** — Internal NomadHome operator with platform-wide moderation powers.
- **Service fee** — Percentage added to the host price at checkout, paid by the guest.
- **Host commission** — Percentage deducted from the host's payout, paid by the host implicitly.
- **Payout** — Transfer of booking proceeds (minus host commission) from the platform to the host. Manual in MVP.
- **Capability** — A bounded domain inside OpenSpec (`openspec/specs/<capability>/`). The MVP capabilities are listed in §6.
- **MVP** — The scope defined in this PRD and `CLAUDE.md` §2. Anything outside is Post-MVP until explicitly promoted.
