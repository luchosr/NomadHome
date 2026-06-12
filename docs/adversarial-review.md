# Adversarial Review: NomadHome Documentation

**Date**: 27 May 2026  
**Reviewer**: GitHub Copilot (Adversarial Review Skill)  
**Scope**: README.md + docs/ folder  
**Status**: FAIL — Blockers identified

---

## Executive Summary

The documentation is **thorough and well-written for a learning vehicle**, but it is **not actionable as a specification**. Agents cannot begin implementation because the OpenSpec folder (the entire source-of-truth system) does not exist, capability specs are missing, and critical workflows lack user stories.

**Verdict**: **FAIL** — Blocker findings must be resolved before implementation can proceed.

---

## Documentation Sources

- README.md (project overview, architecture, components, file structure)
- docs/architecture-diagram.md (C4 model)
- docs/backend-standards.md (DDD, layered architecture, standards)
- docs/base-standards.md (core principles, language standards, openspec artifacts)
- docs/frontend-standards.md (React patterns, state management, testing)
- docs/PRD.md (product requirements, personas, user stories, scope)
- docs/data-model.md (MVP data model, entities, relationships, enums)
- docs/product-description.md (basic functionalities, customer journey)
- docs/openspec-tasks-mandatory-steps.md (testing and verification requirements)

---

## Findings

### FINDING 1: Core Gap — openspec/ Folder Does Not Exist

**Severity**: 🔴 **BLOCKER**  
**Area**: System readiness  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

The OpenSpec workspace is bootstrapped end-to-end:

- `openspec/` exists with `specs/`, `changes/` (incl. `archive/`), `skills/`, and `config.yaml` (CLI-generated).
- `openspec/AGENTS.md` exists at the openspec root with the OpenSpec-specific agent digest: source-of-truth ordering, four phases, delta grammar, workflow commands, and bright-line rules.
- `openspec/project.md` exists at the openspec root with substantive content: capability map, MVP scope boundaries, locked tech stack, monorepo layout, conflict-resolution hierarchy (also closes Finding 3), and the `[OPEN]` decisions tracker.
- The two misplaced 0-byte stubs at `openspec/specs/agents.md` and `openspec/specs/project.md` were removed.
- `openspec/specs/` is populated with 10 canonical capability specs (materialized by Finding 2's archive on 2026-06-11).
- `openspec validate --specs --strict` ✅ — 10 passed, 0 failed.

`openspec/skills/` remains empty by design; populating it is a separate decision tied to `docs/base-standards.md §5` and is tracked outside this finding.

#### The Problem

CLAUDE.md references `openspec/AGENTS.md`, `openspec/project.md`, `openspec/specs/`, and `openspec/changes/` repeatedly as the source of truth. None of these files exist in the workspace. The entire workflow (Phase 1 proposal → Phase 2 spec → Phase 3 implementation → Phase 4 archive) is impossible without them.

#### Evidence

- [CLAUDE.md](CLAUDE.md) §4 reads: "You MUST read `openspec/AGENTS.md` and `openspec/project.md` at the start of every session and before every ticket."
- Workspace listing shows no `openspec/` directory.
- [docs/base-standards.md](docs/base-standards.md) §5 refers to `openspec/skills` but links to non-existent skill definitions.

#### Impact

**Critical** — The entire project governance model cannot function. The AI agents have no machine-validated requirements to work against. Code decisions lack a spec backing.

#### Recommended Fix

**Code** — Bootstrap the OpenSpec folder structure before admitting any tickets.

```bash
mkdir -p openspec/specs openspec/changes openspec/skills
touch openspec/AGENTS.md openspec/project.md
```

**Estimated effort**: 4 hours (init, project.md setup, initial specs structure). This is your **first ticket**.

---

### FINDING 2: Task Definition Disconnected from OpenSpec

**Severity**: 🟠 **MAJOR**  
**Area**: Spec-first workflow  
**Status**: ✅ RESOLVED — 2026-06-11

#### Resolution

Bootstrapped via OpenSpec change `bootstrap-capability-specs` (PR #1, merged 2026-06-11). Ten capability specs were authored from PRD §8 user stories (30 requirements, 53 scenarios), validated with `openspec validate --strict`, and materialized into `openspec/specs/<capability>/spec.md` for: `identity`, `listings`, `search`, `booking`, `payments`, `reviews`, `host-tooling`, `admin`, `platform`, `compliance`. Archived change at `openspec/changes/archive/2026-06-11-bootstrap-capability-specs/`. Six `[OPEN]` markers remain embedded in the relevant specs and are tracked as follow-ups in that change's `tasks.md` §5.

#### The Problem

[docs/tasks.md](docs/tasks.md) exists and lists 10 capabilities, but there are no **corresponding capability-specific spec.md files** in `openspec/specs/`. The PRD §6 defines the 10 capabilities (Identity, Listings, Search, Booking, Payments, Reviews, Host Tooling, Admin, Platform, Compliance), but no OpenSpec artifact ties a spec to a task checklist.

#### Evidence

- [docs/PRD.md](docs/PRD.md) §6 lists "| # | Capability | One-line description |" — this is **user story**, not machine-validated spec.
- [CLAUDE.md](CLAUDE.md) §4 states: "Phase 2 — Spec-First... `openspec/changes/<change-id>/specs/<capability>/spec.md` — delta spec with `## ADDED Requirements`..."
- The documentation tells agents to write code to specifications that don't exist yet.

#### Impact

**High** — Agents attempting the first ticket will hit Phase 1 (Proposal ✅) but fail Phase 2 (Spec validation) because no target spec exists for approval.

#### Recommended Fix

**Spec** — Create initial `openspec/specs/` folder with one minimal spec per capability (e.g., `openspec/specs/identity/spec.md` converted from PRD §8.1 scenarios). Link tasks.md 2.1.1 through 2.1.N to scenario Given/When/Then.

**Estimated effort**: 6 hours.

---

### FINDING 3: Uncertain Master of Requirements — Drift Risk

**Severity**: 🟠 **MAJOR**  
**Area**: Single source of truth  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

`openspec/project.md` §6 "Conflict resolution hierarchy" defines a 7-level ordering: approved OpenSpec delta / canonical capability spec → this file → `docs/data-model.md` → `packages/db/prisma/schema.prisma` → `docs/PRD.md` → `CLAUDE.md` → other `docs/*.md`. The section includes three concrete worked examples (including the fee percentage-vs.-basis-points drift this finding called out) so future agents have a precedent for how to apply the rule. The PR-review gate recommended by this finding (Zod schemas vs. `data-model.md` enum/type check) is **not** yet wired into CI and is tracked as a separate follow-up.

#### The Problem

Three documents claim to be source of truth:

- [docs/PRD.md](docs/PRD.md) — "Source of truth: This PRD describes intent... OpenSpec wins"
- [docs/backend-standards.md](docs/backend-standards.md) — references data-model.md as canonical
- [docs/data-model.md](docs/data-model.md) — "The runtime source of truth is [`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma)..."

When PRD says "Platform service fee is a percentage" (§7) and data model says "basis points" (§3), which wins? The PRD doesn't specify **who decides**.

#### Evidence

- PRD §7: "Guest service fee: A percentage added..."
- Data model §3: `guestServiceFeeBps: int` (basis points)
- No PR review mechanism defined that resolves this ahead of time.

#### Impact

**High** — An agent writing a Zod schema to validate fees might model it as `percent: number` while Prisma expects `bps: int`. No gate catches this before the PR.

#### Recommended Fix

**Spec** — Establish a conflict resolution order in `openspec/project.md`:

```
1. OpenSpec delta spec is canonical for requirements
2. data-model.md is canonical for schema
3. PRD is canonical for business context
```

Add a code-review gate that checks Zod schemas against data-model.md enums and types before approving.

**Estimated effort**: 2 hours.

---

### FINDING 4: Feature Scope Creep Risk — Post-MVP Not Enforced

**Severity**: 🟠 **MAJOR**  
**Area**: Scope defense  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

Both halves of the recommended fix are in place:

**Part 1 — Structured per-domain scope table.** `openspec/project.md` §3.1 now defines 13 domains (Identity & Auth, Email, Listings, Search, Booking, Payments, Reviews, Host tooling, Admin, Community / Social, Platform / UX, Analytics & Integrations, Compliance) with three buckets each: ✅ In MVP, ⏸ Post-MVP (deferred — promotable via §3.3), ❌ Never. The three-bucket distinction is what this finding asked for: Post-MVP items can be promoted, Never items cannot.

**Part 2 — Lint enforcement.** `openspec/project.md` §3.2 holds a machine-readable JSON denylist immediately under the `<!-- mvp-scope-denylist -->` marker, with ~19 `never` terms and ~60 `postMvp` terms. `scripts/check-mvp-scope.mjs` parses that block, walks every `openspec/changes/*/tasks.md` (skipping `archive/`), blocks (exit 1) on case-insensitive substring matches against the `never` list, and warns (exit 0) on matches against the `postMvp` list. Sanity-tested on a synthetic `tasks.md` containing both `SMS` (Never) and `OAuth` (Post-MVP) — script correctly blocked and warned. CI / Husky wiring is deferred until `package.json` exists; the script is runnable today via `node scripts/check-mvp-scope.mjs`.

`openspec/AGENTS.md` §5 was updated to reference the script as a pre-PR check.

#### The Problem

[docs/PRD.md](docs/PRD.md) §3.2 lists 20+ "Non-Goals (MVP)" (PWA, i18n, OAuth, in-app messaging, push notifications, calendar sync, automated payouts, etc.). [CLAUDE.md](CLAUDE.md) §1 "Prime Directives" (#8) says "Defend the MVP scope" and §9 Checkpoint F triggers "Scope Defense" if a request touches "Out of MVP" items.

The boundary is defined **qualitatively**. An agent reading both files could reasonably decide that "improved email notifications" or "calendar integration" is "small enough" for MVP and bypass Checkpoint F entirely.

#### Evidence

- PRD §3.2: "Push notifications (transactional email only)" — clear boundary.
- But someone could interpret "transactional email only" to include "email reminders about upcoming check-in" → feature creep.
- No data structure enforces the boundary algorithmically.

#### Impact

**High** — Tickets slip in that should be gated by human decision. Scope creep is virtually guaranteed without machine enforcement.

#### Recommended Fix

**Spec** — Create `openspec/project.md` with a structured list of "In MVP", "Post-MVP (deferred)", and "Explicitly out" for each domain. Add a lint rule that forbids task.md entries matching the "out" list.

Example:

```
Email:
  ✅ In MVP: registration verification, booking confirmation, cancellation notice, refund notice
  ❌ Post-MVP: reminders, upsell, newsletters, digest emails
  ❌ Never: SMS, push notifications (MVP email-only)
```

**Estimated effort**: 3 hours.

---

### FINDING 5: Data Model Enums Incomplete — BookingFlagReason

**Severity**: 🟡 **MINOR**  
**Area**: Spec completeness  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

Took the reviewer's option (a): added **US-8.3** to `docs/PRD.md` §8.8, motivating the previously-orphaned `GUEST_DISABLED` enum value. US-8.3 specifies that disabling a user with confirmed future bookings as a guest produces `BookingFlag(GUEST_DISABLED)` rows for those bookings; bookings remain `confirmed` so the admin can choose to cancel/refund out-of-band consistent with US-4.2 and US-5.2.

Tightened `docs/data-model.md` §3.18 to map each enum value to its motivating user story (`HOST_DISABLED` ← US-8.1, `GUEST_DISABLED` ← US-8.3, `LISTING_DISABLED` ← US-8.2). Rewrote `docs/data-model.md` §7 invariant 4 to split the cascade into a host-side path and a guest-side path; a single transaction may produce both flag reasons when the disabled user is both a host and a guest with active bookings.

`openspec/specs/admin/spec.md` already specifies "Existing confirmed bookings tied to the disabled user (as guest or host) MUST be flagged for admin review" — so no spec change was needed. Adding a dedicated `GUEST_DISABLED` scenario to the admin spec is a coverage-tightening follow-up (would land via an `add-guest-disable-scenario` OpenSpec change), tracked outside this finding.

#### The Problem

[docs/data-model.md](docs/data-model.md) §3.18 defines `BookingFlagReason` enum with three values: `HOST_DISABLED`, `GUEST_DISABLED`, `LISTING_DISABLED`. But [docs/PRD.md](docs/PRD.md) §8.2 only describes two scenarios:

- Host disabled → flag affected bookings
- Listing disabled → flag affected bookings

There is **no user story for "guest disabled"** → flag bookings. The enum is over-specified.

#### Evidence

- Data model §3.18: `reason enum BookingFlagReason { HOST_DISABLED, GUEST_DISABLED, LISTING_DISABLED }`
- PRD §8.2: US-8.1 (HOST_DISABLED) and US-8.2 (LISTING_DISABLED). No US-8.3.

#### Impact

**Low** — The extra enum value doesn't break anything, but it signals a data model designed without a clear spec. Future developers wonder: "When is GUEST_DISABLED triggered?"

#### Recommended Fix

**Spec** — Either (a) add US-8.3 "admin disables a user (cascade to guest bookings)" to PRD §8.2, or (b) remove `GUEST_DISABLED` from the enum.

**Estimated effort**: 1 hour.

---

### FINDING 6: Availability Blocking Rules Underspecified

**Severity**: 🟠 **MAJOR**  
**Area**: Concurrent state safety  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

Overlap-conflict semantics are now specified in two places that respect the conflict-resolution hierarchy (`openspec/project.md` §6 — data-model is canonical for schema-level behavior; PRD is canonical for business intent).

**`docs/data-model.md` §3.10 — "Overlap-conflict semantics"**: defines the structured `409 OVERLAP_CONFLICT` response shape (including a `conflict.bookingId` field that MUST be populated when the existing block is a `BOOKING_HOLD`, so a host who hits a conflict can identify and contact the affected guest), and a matrix covering every existing-block source vs. a new `HOST_BLOCK` insertion. The matrix covers the reviewer's specific case (host-block-vs-pending-payment) plus the three other host-block conflict paths (host-vs-own, host-vs-confirmed, host-vs-admin-block).

**`docs/PRD.md` §8.2 US-2.3**: tightened with two new Given/When/Then blocks covering the conflict paths — one for overlapping a `BOOKING_HOLD` (returns `bookingId`), one for overlapping a `HOST_BLOCK` or `ADMIN_BLOCK`. The happy-path criterion was clarified to specify "no existing blocks or bookings overlapping it."

`ADMIN_BLOCK` insertion remains out of MVP (admin moderation tooling beyond enable/disable is deferred per `openspec/project.md` §3.1 row "Admin"). The enum value exists for forward compatibility but no user story currently produces an `ADMIN_BLOCK` row; this is called out in both data-model §3.10 and PRD US-2.3.

`openspec/specs/listings/spec.md` already specifies "The system MUST NOT allow a host to block a date range that overlaps any existing booking hold or confirmed booking on the same listing," so no spec change was needed. Adding a dedicated `BOOKING_HOLD (PENDING_PAYMENT)` scenario to the listings spec is a coverage-tightening follow-up.

#### The Problem

[docs/data-model.md](docs/data-model.md) §3.10 describes `AvailabilityBlock` with three sources: `HOST_BLOCK`, `BOOKING_HOLD`, `ADMIN_BLOCK`. The EXCLUDE constraint prevents any two blocks from overlapping. But the PRD does not specify: **Can a host create a HOST_BLOCK that overlaps a BOOKING_HOLD (a pending payment)?**

#### Evidence

- Data model §7: Cascade rules defined, but not blocking rules.
- PRD §8.2 US-2.3: "I block a date range... that range is unavailable for booking."
- No spec for: host-initiated block vs. admin-initiated block. Can a host block during their own pending payment?

#### Impact

**Medium** — The EXCLUDE constraint will reject the operation at the DB layer. But should the API return `409 OVERLAP_CONFLICT`? Or should the app-layer logic allow host-initiated blocks to supersede pending holds? Different teams will implement differently.

#### Recommended Fix

**Spec** — Add to PRD §8 or data model §3.10:

```
When a host attempts to block a range containing a BOOKING_HOLD,
the operation fails with 409 CONFLICT and returns the blocking
booking ID so the host can contact the guest.
```

**Estimated effort**: 1 hour to write, 4 hours to implement post-spec.

---

### FINDING 7: Photo Storage Provider Decision Untracked

**Severity**: 🟡 **MINOR**  
**Area**: Implementation blocker  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

The photo-storage decision is now tracked alongside the five other open decisions in a single canonical location with the four reviewer-requested columns (Owner / Blocks / Deadline / Tiebreaker), plus a discoverable `docs/`-side landing page.

**`openspec/project.md` §8** — the canonical open-decisions table now has 7 columns (Capability / Open decision / Owner / Blocks change-id / Deadline / Tiebreaker / Source) covering all six deferred decisions. Every row names Luciano as owner and ties the deadline to a gate of the implementing change rather than a calendar date, so the system stays date-free until tickets are scheduled. Tiebreaker defaults are proposed for each decision so the implementing ticket has a concrete starting point — the photo-storage row defaults to Cloudflare R2 (zero egress fees suit an image-heavy app) with the override rule "document an operational reason in the change's `design.md`."

`openspec/project.md` §8 now also includes §8.1 "Closing an open decision" and §8.2 "Adding a new open decision" — explicit playbooks so the workflow is unambiguous.

**`docs/OPEN-DECISIONS.md`** — new docs/-side landing page that points at `openspec/project.md` §8 as canonical and carries a 3-column synopsis (Decision / Capability / Blocks change-id) for discoverability. **No duplication of decision rows** — the canonical 7-column table lives in `openspec/project.md` §8 only, so the two files cannot drift on owner, deadline, or tiebreaker.

The "close in one PR" rule documented in both files ensures the workspace never enters a state where the inline `[OPEN]` marker in the spec, the canonical table, and the docs/-side landing page disagree.

#### The Problem

[docs/data-model.md](docs/data-model.md) §9 lists: _"1. Photo storage backend (Cloudflare R2 vs S3 vs Supabase Storage) — blocks `add-listings`"_

But there is no **decision record** showing who will decide, by when, or what the tiebreaker is. If an agent starts the `add-listings` OpenSpec change, does it proceed with a TBD? Or does it block until the human decides?

#### Evidence

- Data model §9: "Does `ListingPhoto` need a `storageProvider` column? Default: single provider, no column."
- No `ADR-001-photo-storage-decision.md` artifact.

#### Impact

**Low-Medium** — Agents might over-engineer (add `storageProvider` column) or under-engineer (hardcode one provider) without clarity.

#### Recommended Fix

**Docs** — Create `docs/OPEN-DECISIONS.md` tracking: (1) who owns the decision, (2) deadline, (3) what blocks, (4) tiebreaker.

```markdown
| Decision               | Owner   | Deadline                        | Blocks                   | Tiebreaker           |
| ---------------------- | ------- | ------------------------------- | ------------------------ | -------------------- |
| Photo storage provider | Luciano | Before add-listings OpenSpec    | add-listings             | Luciano's preference |
| Fee percentages        | Luciano | Before add-booking-and-payments | add-booking-and-payments | TBD                  |
```

**Estimated effort**: 1 hour.

---

### FINDING 8: Host Payouts "Manual" But Procedure Unspecified

**Severity**: 🟠 **MAJOR**  
**Area**: Critical workflow  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

The manual-payout procedure is now specified end-to-end:

**`docs/PRD.md` §8.5** — added **US-5.3** "Admin records a manual payout" with three Given/When/Then blocks: (1) view the amount owed to a selected host grouped by currency, (2) submit the payout record with `method` (`bank_transfer` / `wise` / `paypal`), `externalReference`, and the booking set, atomic across the `Payout` insert and every `PayoutBooking` insert, (3) conflict path returning `409 CONFLICT` when any booking is already linked to a `PayoutBooking`. Method strings match `docs/data-model.md` §3.16 `Payout.method` verbatim.

**`docs/data-model.md`** — reattached four payout-related citations from US-5.2 (which is "see what is owed") to US-5.3 (which is "record the payout") where the citations actually belong: §3.17 PayoutBooking PK note, §6 "Settlement query" index, §6 "Payout history" index, §7.7 "One settlement per booking" invariant. The §7.7 invariant was tightened with the application-layer translation rule (Postgres `23505` unique-violation → `409 CONFLICT`).

**`openspec/specs/payments/spec.md`** — already specifies both the amounts-owed view (requirement "Admin sees amounts owed per host") and the record-payout flow (requirement "Admin records a manual payout") with scenarios covering the happy path and the double-payout-rejected path. No spec change was needed for Finding 8 to be resolved.

The result: the PRD now motivates US-5.3, the data model identifies which invariants belong to which story, and the OpenSpec source-of-truth already enforces both stories with scenarios.

#### The Problem

[docs/PRD.md](docs/PRD.md) §5 and §7 repeatedly state: _"Host payouts are **manual** in MVP"_ and _"The admin sees what is owed to each host and triggers a payout out-of-band (bank transfer, Wise, etc.)."_

But the spec provides **no procedure**. User stories (US-5.2) do not exist. The data model has `Payout` and `PayoutBooking` entities (§3.16–3.17) with `method` and `externalReference` columns, but the admin-facing UI/API is not specified:

- What **list** does the admin see?
- What **action** does the admin take?
- What **invariants** prevent double-payout?

#### Evidence

- PRD §8 (User Stories): US-1 through US-8, but **no US-5.2** is defined.
- Data model §3.16: `Payout.externalReference` — but no validation or usage spec.
- CLAUDE.md §2 lists "Payout" as a capability, but PRD §6 does not include US-5.2.

#### Impact

**High** — When an agent tries to implement "admin records payout," they have no acceptance criteria. They must infer from context, resulting in incomplete or over-engineered implementations.

#### Recommended Fix

**Spec** — Add US-5.2 to PRD §8.5:

```markdown
**US-5.2** — As an admin, I want to record a payout to a host
so that I can track what was transferred out-of-band.

- **Given** I am logged in as admin
- **When** I navigate to the payouts section and select "Record payout"
- **And** I select a host
- **Then** I see the total amount owed (sum of unpaid settled bookings)
  grouped by currency
- **When** I click "Record payout" and provide method
  (bank transfer / Wise / PayPal) and reference (transaction ID)
- **Then** the payout record is created, and the affected bookings
  are marked as settled (via PayoutBooking rows)
```

**Estimated effort**: 2 hours.

---

### FINDING 9: RefreshToken Rotation Policy Unspecified

**Severity**: 🟡 **MINOR**  
**Area**: Security assumption  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

Closed via the `decide-refresh-token-policy` OpenSpec change (archived `2026-06-12-decide-refresh-token-policy/`). The four-option ADR in `design.md` picked **sliding rotation + 30-day absolute per-token TTL + reuse detection + per-token logout** (industry standard per RFC 6819 §5.2.2.3 / OAuth 2.0 BCP §4.12; requires no schema change).

**Specification surface, post-change:**

- **`openspec/specs/identity/spec.md`** — requirement "Access tokens and refresh tokens" now spells out the absolute-TTL, sliding-rotation, reuse-detection, and per-token-logout rules. Four new scenarios cover rotation-on-use, absolute-expiry, reuse-triggers-full-revocation, and logout-revokes-only-presented. The `[OPEN]` marker is tightened from three deferrals to one (access-token TTL only).
- **`docs/PRD.md` §10** — the Auth bullet now declares the full policy and cross-references the spec and the archived ADR.
- **`docs/data-model.md` §3.3** — `JWT_REFRESH_TTL = 30d` is bound; `expiresAt` is now documented as never extended (rotation creates a new row); a four-item Invariants block names the rotation-atomicity, reuse-detection-cascade, logout-scope, and periodic-prune rules.
- **`openspec/project.md` §8 / `docs/OPEN-DECISIONS.md` synopsis** — the `identity` row is reduced to "Access-token TTL" only, with the close attributed to `decide-refresh-token-policy`.

The reviewer's specific recommended policy ("absolute 30-day TTL, rotated on use, new token issued and old one revoked") matches the chosen option C; the spec adds **reuse detection** beyond the reviewer's literal recommendation, since rotation without reuse detection makes a stolen token harder to spot.

Two follow-ups are tracked in `tasks.md` §5 of the archived change: a periodic prune job for revoked-token rows older than 90 days, and a `refresh-token-reuse-detected` monitoring signal.

#### The Problem

[docs/data-model.md](docs/data-model.md) §3.3 describes `RefreshToken` with `lastUsedAt` and `revokedAt` columns. But the spec does not specify **rotation policy**.

Should refresh tokens:

- Be rotated on every use (sliding window)?
- Expire after N days regardless of use (absolute TTL)?
- Expire after N days **without use** (idle timeout)?

#### Evidence

- Data model §3.3: `lastUsedAt` (updated on each rotation?), `expiresAt` (absolute), `revokedAt` (explicit).
- No rotation policy in PRD or standards.

#### Impact

**Low-Medium** — Different agents might implement different policies. One might rotate on every request (costly); another might skip rotation (weak).

#### Recommended Fix

**Spec** — Add to PRD §10 (Compliance):

```
Refresh tokens use absolute TTL (expire after 30 days).
They are rotated on use (sliding window): when a refresh token
is used to issue a new access token, a new refresh token is
issued and the old one is revoked.
```

**Estimated effort**: 1 hour.

---

### FINDING 10: Phone Number Storage — Not Justified by Spec

**Severity**: 🟡 **MINOR**  
**Area**: Data completeness  
**Status**: ✅ RESOLVED — 2026-06-12

#### Resolution

Took the reviewer's recommended option (b) — **scope reduction**. The `phone` column has been removed everywhere it appeared.

- **`docs/data-model.md` §3.2** — `phone` row dropped from `HostProfile`; a deferral note explains why (no MVP user story consumes it; payouts use `payoutEmail`; SMS is ❌ Never per `openspec/project.md` §3.1; the natural triggers — Stripe Connect KYC and identity verification — are Post-MVP per PRD §3.2).
- **`docs/tasks.md`** — three references removed: 1.3.1 (HostProfile model task), 1.3.2 (BecomeHostSchema task), §720 (Privacy cross-cutting concern's "+ masked phone" qualifier). Verified by grep that no other phone references remain across `docs/` and `openspec/specs/`.

No OpenSpec change was needed: `openspec/specs/identity/spec.md` does not enumerate the fields of the host-onboarding form — it only requires that the user "complete the host onboarding form" — so the canonical spec is silent on phone and the doc-level removal does not contradict it.

When phone is promoted out of Post-MVP, it will be re-added via an OpenSpec change that motivates the column with a concrete user story — the same closure-loop pattern used for `GUEST_DISABLED` (Finding 5) and `ADMIN_BLOCK` (Finding 6 deferral).

#### The Problem

[docs/data-model.md](docs/data-model.md) §3.2 `HostProfile` includes `phone: string` (NOT NULL, E.164 validated). But the PRD does not mention phone numbers at all. Why is phone required for hosts? Is it for Stripe Connect (deferred)? Identity verification (deferred)?

#### Evidence

- Data model §3.2: `phone: string (NOT NULL, E.164 validated at app layer)`
- PRD §8.1–8.2: No mention of phone collection.
- PRD §3.2 Non-Goals: "Background checks, government ID verification (basic email-verified identity only)"

#### Impact

**Low** — Implementation is low-risk, but it signals scope creep. Why collect phone if the spec doesn't use it?

#### Recommended Fix

**Spec** — Either (a) add phone to host onboarding in PRD US-1.3, or (b) **remove phone** from `HostProfile` and defer to Post-MVP.

**Recommendation**: (b) — scope reduction.

**Estimated effort**: 1 hour.

---

### FINDING 11: Search Pagination Strategy Underspecified

**Severity**: 🟡 **MINOR**  
**Area**: Usability/API contract  
**Status**: ✅ RESOLVED — 2026-06-13

#### Resolution

Closed via the `decide-search-pagination` OpenSpec change (archived `archive/2026-06-12-decide-search-pagination/` — folder uses CLI's UTC date heuristic; local-time archive was 2026-06-13). The three-option ADR in `design.md` picked **offset / limit pagination at 20/page (min 1, max 100)** with the `{ data, pagination: { total, page, pageSize, hasMore } }` envelope — exactly the reviewer's recommended contract.

**Specification surface, post-change:**

- **`openspec/specs/search/spec.md`** — requirement "Search results are paginated" now spells out the query parameters (`?page` + `?pageSize`), defaults, bounds, and the response envelope. Five total scenarios cover first-page-of-multi-page (existing, tightened to assert the envelope), default-params-applied, last-page-reports-hasMore-false, page-out-of-range-rejected, pageSize-out-of-range-rejected. The `[OPEN]` marker is fully removed.
- **`docs/PRD.md` §8.3 US-3.1** — gains a "Pagination contract" subsection declaring the same query params, defaults, envelope, and validation behavior, cross-referencing the spec and the archived ADR.
- **`openspec/project.md` §8 / `docs/OPEN-DECISIONS.md` synopsis** — the `search` row is removed entirely (last sub-decision closed).

The chosen contract is portable: any future paginated endpoint (host dashboard bookings, admin user/listing lists, payouts dashboard) MAY adopt the same envelope by reference. Each ticket decides at implementation time; deviations require their own ADR.

#### The Problem

[docs/PRD.md](docs/PRD.md) §8.3 US-3.1 states: _"I receive a **paginated list** of published listings..."_ But the pagination strategy (cursor vs. offset, page size, defaults) is not specified.

#### Evidence

- PRD §8.3: "paginated list" — no page size, cursor strategy, or default limit.
- README.md: "Results are **paginated, URL-state-synced**" — no details.

#### Impact

**Low-Medium** — Agents will implement different pagination styles. No consistency across the codebase.

#### Recommended Fix

**Spec** — Add to PRD §8.3:

```
- Results return up to 20 listings per page (configurable, min 1, max 100).
- Pagination via offset: ?page=1&limit=20
- Response includes {
    data: [...],
    pagination: { total, page, pageSize, hasMore }
  }
```

**Estimated effort**: 1 hour.

---

### FINDING 12: i18n Helper `t()` Lacks Key Documentation

**Severity**: 🟡 **MINOR**  
**Area**: Developer experience  
**Status**: ⚠️ WARNING

#### The Problem

[docs/frontend-standards.md](docs/frontend-standards.md) references `t(key)` helper for localization (e.g., `t('banner.success_message')`), but the exact key format, naming convention, and validation are not specified.

- Is it `banner.success_message` (nested) or `BANNER_SUCCESS_MESSAGE`?
- What happens if a key is missing at runtime?
- Can the `t()` helper be called on the backend (for email templates)?

#### Evidence

- Frontend standards §Localization: Example shows `t('banner.success_message')`, but no spec of the lookup table structure.
- README.md: "all user-facing strings routed through a `t(key)` helper" — but no validation.

#### Impact

**Low** — Developers will invent different conventions. One might use `common/labels/submit-button`, another `button.submit`, resulting in inconsistent key names.

#### Recommended Fix

**Docs** — Create `packages/shared/src/strings/README.md`:

```markdown
# String Localization Helper — MVP

## Key Format

- Format: `<domain>.<context>.<specific>`
  (e.g., `auth.form.email_label`, `booking.success.confirmation_title`)
- No hyphens; use underscores
- Reserved domains: `common`, `error`, `validation`

## Runtime Behavior

- Key not found: log warning, return `"<key-not-found: key-name>"`
- Backend: import dict directly (no `t()` wrapper)
```

**Estimated effort**: 2 hours.

---

## Summary Table

| Severity       | Area                   | Finding                              | Fix Type | Effort |
| -------------- | ---------------------- | ------------------------------------ | -------- | ------ |
| ✅ RESOLVED    | System readiness       | `openspec/` folder missing           | Code     | 4h     |
| ✅ RESOLVED    | Spec-first workflow    | `openspec/specs/` missing            | Spec     | 6h     |
| ✅ RESOLVED    | Single source of truth | Conflict resolution undefined        | Spec     | 2h     |
| ✅ RESOLVED    | Scope defense          | Post-MVP not enforced                | Spec     | 3h     |
| ✅ RESOLVED    | Spec completeness      | BookingFlagReason over-specified     | Spec     | 1h     |
| ✅ RESOLVED    | Concurrent safety      | Availability blocking underspecified | Spec     | 1-4h   |
| ✅ RESOLVED    | Implementation         | Photo storage untracked              | Docs     | 1h     |
| ✅ RESOLVED    | Critical workflow      | Payout procedure missing (US-5.2)    | Spec     | 2h     |
| ✅ RESOLVED    | Security               | Token rotation policy undefined      | Spec     | 1h     |
| ✅ RESOLVED    | Data completeness      | Phone number unjustified             | Spec     | 1h     |
| ✅ RESOLVED    | API contract           | Pagination strategy undefined        | Spec     | 1h     |
| 🟡 **MINOR**   | Developer UX           | i18n key format undefined            | Docs     | 2h     |

---

## Verdict

### 🔴 FAIL

**The documentation is aspirational but not executable.**

Agents cannot begin implementation because:

1. ✗ The OpenSpec folder (the entire source-of-truth system) does not exist
2. ✗ Capability specs are missing
3. ✗ Critical workflows lack user stories
4. ✗ Scope boundaries are qualitative, not enforced
5. ✗ Several architectural decisions are unresolved

---

## Critical Path to Unblock (Priority 1)

**These must be completed before any implementation ticket can proceed:**

### 1. Bootstrap OpenSpec Folder Structure

```bash
mkdir -p openspec/specs openspec/changes openspec/skills
touch openspec/AGENTS.md openspec/project.md
```

**Time**: 1 hour  
**Blocker**: Yes

### 2. Write openspec/project.md

Include:

- Tech stack from CLAUDE.md §3
- Conflict-resolution hierarchy (OpenSpec → data-model → PRD)
- In/Out MVP lists for each domain
- Fee percentages decision tracker

**Time**: 3 hours  
**Blocker**: Yes

### 3. Create openspec/specs/ Capability Specs

Convert PRD §8 user stories into machine-validated specs:

- `openspec/specs/identity/spec.md`
- `openspec/specs/listings/spec.md`
- `openspec/specs/search/spec.md`
- `openspec/specs/booking/spec.md`
- `openspec/specs/payments/spec.md`
- `openspec/specs/reviews/spec.md`
- `openspec/specs/admin/spec.md`

Each with Given/When/Then scenarios.

**Time**: 6 hours  
**Blocker**: Yes

**Total critical path**: ~10 hours (1–2 days)

---

## High-Priority Follow-Ups (Priority 2)

Complete within the first week to prevent scope creep and mid-implementation rework:

- [ ] Create `docs/OPEN-DECISIONS.md` (photo storage, fees, rotation policy)
- [ ] Write missing user story **US-5.2** (admin records payout)
- [ ] Specify refresh token rotation policy in PRD §10
- [ ] Specify search pagination format (offset vs cursor)
- [ ] Remove phone from HostProfile or justify with US-1.3 addition
- [ ] Clarify availability blocking rules during pending payments
- [ ] Document `t(key)` format in `packages/shared/src/strings/README.md`

---

## Archiving Recommendation

**❌ NOT ADVISABLE in current state.**

The documentation is aspirational but not executable. Recommend:

1. ✅ Resolve Blocker findings (#1–3 above)
2. ✅ Get human approval
3. ✅ Then begin first OpenSpec change: `init-monorepo`
4. ✅ Then archive this review

---

## Next Steps

**Immediate** (this session):

- [ ] Create `openspec/` folder structure
- [ ] Draft `openspec/project.md` with conflict hierarchy
- [ ] Start converting PRD §8 into `openspec/specs/identity/spec.md`

**This week**:

- [ ] Complete all 7 capability specs
- [ ] Create `OPEN-DECISIONS.md`
- [ ] Write US-5.2 (payout user story)

**Git tag** (after blocker resolution):

```bash
git tag docs-v0.1-adversarial-reviewed
git push origin docs-v0.1-adversarial-reviewed
```

---

**End of Adversarial Review**
