# NomadHome — OpenSpec Project Context

> Read this before every ticket. It is the canonical context for OpenSpec artifact generation: tech stack, MVP scope, conflict-resolution hierarchy, and the conventions every change must respect. For the longer-form orchestrator playbook see [../CLAUDE.md](../CLAUDE.md); for product motivation see [../docs/PRD.md](../docs/PRD.md).

## 1. Product, in one paragraph

NomadHome is a SaaS marketplace connecting digital nomads and remote teams with co-living spaces and workspaces, and the property hosts/operators who provide them. The MVP ships the smallest end-to-end booking loop that proves the product: a guest can discover a listing, book it, pay through Stripe Checkout, complete the stay, and leave a review; a host can list inventory and see upcoming bookings; an admin can keep the marketplace clean. The MVP is a **learning vehicle**, not a growth vehicle.

## 2. Capability map (MVP)

Each capability has a canonical `openspec/specs/<capability>/spec.md`.

| # | Capability | Purpose |
| --- | --- | --- |
| 1 | `identity` | Email/password registration, login, JWT + refresh tokens, role escalation, auth audit |
| 2 | `listings` | Host-owned listings (`property` / `workspace`), draft/published lifecycle, availability |
| 3 | `search` | Guest-facing search by city + dates, filters, paginated results |
| 4 | `booking` | Instant-booking reservations, cancellation, single-listing invariant |
| 5 | `payments` | Stripe Checkout for guest payment, fee snapshotting, manual payout recording |
| 6 | `reviews` | One guest review per completed booking; listing aggregate display |
| 7 | `host-tooling` | Minimal host dashboard: owned listings + upcoming bookings |
| 8 | `admin` | Role-guarded disable/re-enable for users and listings |
| 9 | `platform` | English-only, mobile-responsive web; `t()` helper; Zod-validated REST contract |
| 10 | `compliance` | bcrypt hashing, HTTPS in production, append-only auth audit log |

## 3. Scope boundaries

Every domain is split into three buckets. The distinction matters:

- ✅ **In MVP** — build this now. Tickets are welcome.
- ⏸ **Post-MVP (deferred)** — do not build until explicitly promoted via the procedure in §3.3. Could legitimately become in-scope later. Mentioning the term in a proposal triggers Scope Defense (`CLAUDE.md` §9 Checkpoint F).
- ❌ **Never** — out of this product line entirely. Building it would contradict a foundational MVP decision (e.g. we picked email for transactional notices, so SMS is Never; we picked Stripe Checkout, so card collection on our platform is Never). Mentioning the term in `tasks.md` is **blocked** by `scripts/check-mvp-scope.mjs` (§3.4).

Anything not listed here is implicitly Never. If in doubt, propose first.

### 3.1 Per-domain scope table

| Domain | ✅ In MVP | ⏸ Post-MVP (deferred) | ❌ Never |
| --- | --- | --- | --- |
| **Identity & Auth** | email/password registration, login, JWT + server-side refresh tokens, guest → host role escalation, basic auth audit log | OAuth (Google, Apple), social login, SSO, magic-link login, email-based passwordless | SIM swap auth, biometric-only auth, account sharing as a feature |
| **Email** | registration verification, booking confirmation, cancellation notice, refund-pending notice, payout notice (to host), admin role-change notice | digest emails, stay reminders, post-stay nudges, marketing newsletters, upsell campaigns | SMS, push notifications, in-app inbox, WhatsApp / Telegram bots |
| **Listings** | property and workspace listings, photos, amenities, nightly rate, draft/published lifecycle, host-managed availability | min/max stay rules per listing, calendar sync (iCal, Google Calendar), channel-manager integrations (Airbnb, Booking.com), photo storage with per-listing provider override | dynamic pricing, yield management, occupancy optimization, AI-generated listing copy |
| **Search** | search by city + date range, filter by price / type / amenities / capacity, paginated results | geo search (radius from a point), map view, saved searches, alerts on new matches | recommendation engine, behavioral personalization |
| **Booking** | instant booking, guest-side cancellation before check-in, fee snapshotting, single-listing-per-booking | host approval / application flow before booking, group / team-offsite booking as first-class object, multi-listing cart, multi-leg trips, dispute resolution workflow | non-refundable surcharges, hidden fees, dark patterns in cancellation flow |
| **Payments** | Stripe Checkout for guest payment, platform-configured fee/commission with per-booking snapshot, admin-visible amounts owed per host, manual payout recording | automated payouts, refund automation, partial refunds, invoices, multi-tier billing, multi-currency, host KYC via Stripe Connect | card collection on our own platform (no Stripe Elements / custom forms), crypto, alternative payment methods that bypass Stripe |
| **Reviews** | one guest review per completed booking (1–5 stars + text), listing-level aggregate rating | host-to-guest reviews, structured rubric (cleanliness / location / value), photo reviews, review responses by host | paid review removal, anonymous review-purchasing schemes |
| **Host tooling** | minimal dashboard listing owned listings + upcoming bookings | host analytics dashboard, revenue forecasting, occupancy charts, host messaging UI, bulk listing management | host-side dark patterns (e.g. discriminatory booking rules) |
| **Admin** | role-guarded disable/re-enable for users and listings | full admin moderation tooling, content moderation queues, fraud detection dashboards, dispute resolution workflows | hardcoded backdoor users, password recovery without identity proof |
| **Community / Social** | _(nothing)_ | in-app messaging, community profiles, member directory, events, interest groups, house rules, roommate matching | LinkedIn-style endorsements, social graph features, public follow/friend graph |
| **Platform / UX** | English-only web UI, mobile-responsive (down to 360 px), `t()` helper routing for all user-facing strings, Zod-validated REST contract | PWA / offline support, native iOS, native Android, full i18n via i18next, multi-currency display | desktop-only experience, separate marketing site forking the codebase |
| **Analytics & Integrations** | basic server logs, auth event audit | public partner API, Segment / Mixpanel / PostHog instrumentation, third-party CRM integration | data brokerage, selling user data to third parties |
| **Compliance** | bcrypt hashing (cost ≥ 10), HTTPS in production, append-only auth audit log | GDPR self-service data export, GDPR self-service deletion, government ID verification, background checks | storing plaintext passwords or PANs, transmitting credentials over plain HTTP, security-by-obscurity |

### 3.2 Machine-readable denylist

The fenced JSON block below is the **single source of truth** for `scripts/check-mvp-scope.mjs`. The script greps every `openspec/changes/*/tasks.md` (excluding `archive/`) for case-insensitive substring matches against the lists below.

- `never` matches → script exits non-zero (the change is **blocked**)
- `postMvp` matches → script prints a warning and exits zero (the change must hit Scope Defense before merging)

Keep the table in §3.1 and this JSON aligned. Each entry in the JSON SHOULD correspond to a phrase that appears verbatim in §3.1.

<!-- mvp-scope-denylist -->
```json
{
  "never": [
    "SMS",
    "push notification",
    "push notifications",
    "WhatsApp",
    "Telegram bot",
    "in-app inbox",
    "Stripe Elements",
    "crypto payment",
    "paid review removal",
    "review-purchasing",
    "discriminatory booking",
    "social graph",
    "public follow",
    "LinkedIn-style endorsement",
    "data brokerage",
    "selling user data",
    "plaintext password",
    "biometric-only",
    "SIM swap"
  ],
  "postMvp": [
    "OAuth",
    "social login",
    "SSO",
    "magic-link login",
    "passwordless",
    "digest email",
    "stay reminder",
    "marketing newsletter",
    "upsell campaign",
    "min stay rule",
    "max stay rule",
    "calendar sync",
    "iCal",
    "Google Calendar sync",
    "Airbnb integration",
    "Booking.com integration",
    "channel manager",
    "dynamic pricing",
    "yield management",
    "host approval",
    "application flow",
    "group booking",
    "team-offsite booking",
    "multi-listing cart",
    "multi-leg trip",
    "dispute resolution",
    "automated payout",
    "automated payouts",
    "refund automation",
    "partial refund",
    "invoice generation",
    "multi-tier billing",
    "multi-currency",
    "Stripe Connect",
    "host KYC",
    "host-to-guest review",
    "review response",
    "photo review",
    "host analytics dashboard",
    "revenue forecasting",
    "occupancy chart",
    "host messaging",
    "bulk listing management",
    "moderation queue",
    "fraud detection",
    "in-app messaging",
    "community profile",
    "member directory",
    "interest group",
    "house rules",
    "roommate matching",
    "PWA",
    "offline support",
    "service worker",
    "native iOS",
    "native Android",
    "i18next",
    "partner API",
    "public API",
    "Segment integration",
    "Mixpanel",
    "PostHog",
    "CRM integration",
    "GDPR export",
    "GDPR self-service",
    "government ID",
    "background check"
  ]
}
```

### 3.3 Promotion procedure

Explicit user instruction: "**promote `<feature>` out of post-MVP**." That instruction:

1. Triggers an ADR in a new change folder: `openspec/changes/promote-<feature>/design.md` documenting the decision and the trade-off accepted.
2. Updates §3.1 of this file moving `<feature>` from ⏸ Post-MVP to ✅ In MVP.
3. Updates §3.2's JSON to remove the entry from `postMvp`.
4. Lands as a normal OpenSpec change with proposal + delta spec for the relevant capability.

Sub-agents MUST NOT expand scope on their own. The user is the only one who can authorize promotion.

### 3.4 Enforcement script

Run before opening any PR that touches `openspec/changes/`:

```bash
node scripts/check-mvp-scope.mjs
```

The script:

- Loads `<repo>/openspec/project.md`, finds the JSON block marked `<!-- mvp-scope-denylist -->`, and parses it.
- Walks `openspec/changes/*/tasks.md` (recursively, but **skipping `openspec/changes/archive/`** — archived history is preserved as-is).
- For each task line, checks every `never` entry as a case-insensitive substring. Any match prints the offending file:line + matched term and the script exits with code 1.
- After the `never` check, prints case-insensitive `postMvp` matches as warnings (does not affect exit code).
- Exits 0 if no `never` matches.

Wire this script into CI and a Husky pre-commit hook in a later change once `package.json` exists.

## 4. Tech stack (locked)

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | Node.js ≥ 20.19.0 | Required by OpenSpec CLI |
| Language | TypeScript, strict mode, `noUncheckedIndexedAccess: true` | No `any` in shipped code without an ADR |
| Package manager | pnpm with workspaces | Turbo (or Nx via ADR) for task orchestration |
| Frontend framework | React (functional components + hooks only) | No class components |
| Frontend tooling | Vite, React Router, TanStack Query (server state), Zustand (client state) | Strict separation of server vs. client state |
| Forms / validation | React Hook Form + Zod | Same Zod schemas shared between FE and BE |
| Styling | Tailwind CSS + shadcn/ui | No CSS-in-JS unless added via ADR |
| Backend framework | Node.js + Express (Fastify only via ADR) | REST API |
| ORM | Prisma | Migrations live in `packages/db` |
| Database | PostgreSQL | Single source of schema truth: `packages/db/prisma/schema.prisma` |
| Auth | JWT access tokens + server-side refresh tokens, bcrypt (cost ≥ 10) | Refresh tokens revocable from server side |
| Payments | Stripe Checkout (no Stripe Elements, no card collection on platform) | Webhook handler on `checkout.session.completed` |
| Email | Resend (or SendGrid via ADR) for transactional only | No marketing infra in MVP |
| i18n | English only; `t(key)` helper backed by an English lookup table | Avoids `i18next` until post-MVP |
| Tests | Vitest (unit + integration, ≥ 80% coverage on changed code); Playwright (E2E for critical flows) | Run on every PR |
| Quality | ESLint + Prettier (zero warnings on `pnpm lint`); Husky + lint-staged; commitlint | Conventional Commits enforced |

## 5. Monorepo layout (MVP)

```
nomadhome/
├── apps/
│   ├── web/          # React app — guest, host, and admin views behind role-guarded routes
│   └── api/          # Node.js REST API
├── packages/
│   ├── db/           # Prisma schema, migrations, seed
│   ├── shared/       # Shared types, Zod schemas, constants, the t() helper
│   ├── ui/           # Shared shadcn-based React components
│   └── config/       # Shared ESLint, TS, Tailwind config
├── openspec/         # OpenSpec contract (this folder)
├── docs/             # Long-form documentation (PRD, standards, data model, etc.)
└── .github/          # CI/CD workflows
```

A dedicated `apps/admin/` app is **deferred to post-MVP**. Admin functionality lives behind role-guarded routes in `apps/web/`.

## 6. Conflict resolution hierarchy

When two documents disagree, the higher-numbered source wins. The corollary: do not fix the conflict downstream — fix the lower-numbered document until it stops disagreeing.

1. **Approved OpenSpec delta** in `openspec/changes/<change-id>/specs/<capability>/spec.md` (during a change), or the **canonical capability spec** in `openspec/specs/<capability>/spec.md` (between changes) — authoritative for system behavior
2. **This file (`openspec/project.md`)** — authoritative for tech stack, scope boundaries, conventions, and this hierarchy
3. **`docs/data-model.md`** — authoritative for database schema details where no spec-level scenario decides them (e.g., column types, precision, basis-points vs. percentage representation)
4. **`packages/db/prisma/schema.prisma`** — authoritative for runtime schema once code exists; must be reconciled with `docs/data-model.md` at every migration
5. **`docs/PRD.md`** — authoritative for *why* (business motivation, personas, success metrics); never authoritative for *what the system does* at the requirement level
6. **`CLAUDE.md`** — authoritative for orchestrator workflow, sub-agent protocol, communication contract
7. **Other `docs/*.md`** (standards, architecture diagrams) — context only; cite but never decide on the basis of these alone

Concrete examples of how to apply this:

- PRD says "Platform service fee is a percentage" and data model says "basis points." → Data model wins for storage (item 3); PRD is updated to say "expressed as basis points internally."
- A backend service is computing fees using a hardcoded number that diverges from `packages/db/prisma/schema.prisma`. → Schema wins (item 4); the service is patched and a regression test is added.
- An OpenSpec scenario says "results paginate at 20 per page" and PRD §8.3 says "20 per page (configurable)." → Spec wins (item 1); PRD is updated to point at the spec for the authoritative value.

## 7. Conventions you must respect in every change

- **Commits**: Conventional Commits with a `(<TICKET-ID>)` suffix when a ticket exists. `<type>` is one of `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`. Husky + commitlint will reject anything else.
- **Branches**: `feature/<TICKET-ID>-<kebab-slug>` for tickets; `chore/<kebab-slug>` for openspec maintenance.
- **Worktrees**: One ticket → one branch → one worktree. Never mix tickets in one worktree.
- **PR titles**: Reflect the change's purpose and reference the OpenSpec change-id when applicable.
- **Tests**: TDD red phase precedes any implementation. The QA sub-agent writes failing tests from spec scenarios before backend/frontend write code.
- **i18n**: All user-facing strings go through the `t()` helper from day one, even though only English ships in MVP. No hardcoded JSX text.
- **Validation**: Zod schemas in `packages/shared/` are the single source of truth for API request/response shapes, imported by both backend (runtime validation) and frontend (type inference).
- **No `console.log` or `TODO` without a ticket reference** in shipped code. CI blocks them.

## 8. Open decisions tracked in capability specs

These are intentionally unresolved at the baseline and must be resolved by the first ticket that implements the relevant capability. Each is marked inline with `[OPEN]` inside the relevant `openspec/specs/<capability>/spec.md`. **This table is the canonical tracker** referenced from [`docs/OPEN-DECISIONS.md`](../docs/OPEN-DECISIONS.md).

| Capability | Open decision | Owner | Blocks change-id | Deadline | Tiebreaker | Source |
| --- | --- | --- | --- | --- | --- | --- |
| `identity` | Access-token TTL | Luciano | `add-identity` | Before Gate 2 of `add-identity` | Default: 15 min. Override only with a documented threat-model concern in the change's `design.md`. Refresh-token TTL and rotation policy were closed by `decide-refresh-token-policy` (archived 2026-06-12). | Finding 9 of `docs/adversarial-review.md` (closed in part) |
| `platform` | `t(key)` naming convention, missing-key behavior, backend reuse | Luciano | `add-platform-strings` (or the first feature ticket that adds user-facing strings) | Before any feature ticket commits hardcoded English copy | Default: dot-nested `<domain>.<context>.<specific>` keys (e.g. `auth.form.email_label`); missing key returns `<key-not-found:KEY>` and logs a warning; backend imports the same dictionary directly without a `t()` wrapper. | Finding 12 |
| `payments` | Guest service fee % and host commission % | Luciano | `add-payments` | Before Gate 1 of `add-payments` (business decision, must precede spec) | Anchor: rates that produce an effective take-rate comparable to Airbnb's combined fees (~15% guest + ~3% host). Final call is Luciano's; values land in `PlatformFeeConfig` so they can change without code edits. | PRD §7 + §12 |
| `booking` | Cancellation policy windows and refund tiers | Luciano | `add-booking` | Before Gate 1 of `add-booking` | Anchor: Airbnb-style 3-tier (flexible / moderate / strict) with simple day-based windows. Final tiers are Luciano's call; documented in the change's `design.md`. | PRD §12 |
| `listings` | Photo storage backend (Cloudflare R2 vs. S3 vs. Supabase Storage) | Luciano | `add-listings` | Before Gate 2 of `add-listings` | Default recommendation: Cloudflare R2 (zero egress fees suit an image-heavy app). Override only with a documented operational reason in the change's `design.md`. | PRD §12; `docs/data-model.md` §9 |

### 8.1 Closing an open decision

The first ticket to touch each capability MUST resolve its own `[OPEN]` before merging by:

1. Recording the decision and the trade-offs accepted in the change's `design.md` as a short ADR.
2. Replacing the `[OPEN]` marker in `openspec/changes/<change-id>/specs/<capability>/spec.md` with the concrete value (e.g. "15 minutes" instead of "[OPEN] access-token TTL").
3. Removing the corresponding row from this table in the same PR.
4. Updating `docs/OPEN-DECISIONS.md`'s synopsis if its bullet list still references the closed decision.

### 8.2 Adding a new open decision

When a new decision surfaces mid-design that cannot be resolved within the current change's scope, the proposing change MUST:

1. Add a row to this table with the columns Owner / Blocks change-id / Deadline / Tiebreaker / Source.
2. Embed an `[OPEN]` marker at the relevant point in the delta `spec.md` so the deferral is visible to anyone reading the spec.
3. Note the new entry in `docs/OPEN-DECISIONS.md` if it would help docs/-side discoverability.
