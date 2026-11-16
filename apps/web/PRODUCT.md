# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Digital nomad / remote worker (primary guest):** travels 4–12 months a year, books stays of 1 week to 3 months, wants a place to live and work in a new city without a lease, reliable internet, and community.
- **Remote team lead (secondary guest):** plans 1–2 offsites a year for 4–20 people; in the MVP this is treated as parallel guest bookings on one listing.
- **Property host / co-living operator (primary supplier):** runs one to a few co-living properties or workspaces; wants to list with minimal friction, see upcoming bookings, and get paid (manual payout in MVP).
- **Platform admin (internal):** the founder during MVP; lists and disables users and listings.

## Product Purpose

NomadHome is a marketplace for co-living and workspace bookings. The MVP ships the smallest end-to-end loop: a guest discovers a listing, books, pays through Stripe Checkout, stays, and leaves a review; a host lists inventory and sees upcoming bookings; an admin keeps the marketplace clean. It is a learning vehicle: success is qualitative evidence (10 onboarded hosts, 20 completed stays, post-stay interviews), not growth metrics.

## Positioning

A booking platform built for long stays (1 week to 3 months) that combines co-living and workspace in one flow, which nightly-stay platforms such as Airbnb do not optimize for. (Confirmed by the user.)

## Operating Context

- Guests search by city and dates, compare listings by photos and amenities, book instantly, and pay via Stripe Checkout.
- Hosts manage listings (property or workspace), photos, amenities, nightly rate, and availability from a minimal dashboard.
- Admin functionality lives behind role-guarded routes in the same web app.
- Mobile-responsive down to 360 px; guests often browse on phones while traveling.

## Capabilities and Constraints

- Roles: `guest`, `host`, `admin`; email/password auth with JWT + refresh tokens.
- English-only UI; every user-facing string goes through the `t()` helper (no hardcoded JSX text).
- Stack is locked: React, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod. Shared components live in `packages/ui`.
- Post-MVP and Never scope is defined in `openspec/project.md` §3; visual work must not imply deferred features (messaging, community profiles, maps, analytics, multi-currency).
- Currency is USD only.

## Brand Commitments

- The product name **NomadHome** is binding. Logo, voice, and all visual identity are open to full replacement (confirmed by the user for NH-118).

## Evidence on Hand

- Real flows exist in the app (search, listing detail, booking, payments, reviews, host and admin views).
- No real testimonials, customer logos, press, or usage statistics exist; future work must not fabricate any.
- Listing photos come from seed or host uploads; no professional brand photography is on hand.

## Product Principles

1. Long-stay first: every screen should make a multi-week stay feel considered, not like a nightly rental.
2. Honest over persuasive: show real photos, real prices, and clear cancellation terms; no dark patterns.
3. One clean booking loop: search to paid reservation with minimal steps and no dead ends.
4. Work and living together: workspace quality (internet, desk, setup) is as visible as the bed.
5. Small surface, extensible core: ship the MVP scope well and leave room for post-MVP additions without rework.

## Accessibility & Inclusion

- Mobile-responsive web down to 360 px.
- No product-specific accessibility standard was established; assume WCAG 2.1 AA as the working baseline until the user says otherwise.
