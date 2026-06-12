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
**Status**: ⚠️ WARNING

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
**Status**: ⚠️ WARNING

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
**Status**: ⚠️ WARNING

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
**Status**: ❌ FAIL

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
**Status**: ⚠️ WARNING

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
**Status**: ⚠️ WARNING

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
**Status**: ⚠️ WARNING

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
| 🟡 **MINOR**   | Spec completeness      | BookingFlagReason over-specified     | Spec     | 1h     |
| 🟠 **MAJOR**   | Concurrent safety      | Availability blocking underspecified | Spec     | 1-4h   |
| 🟡 **MINOR**   | Implementation         | Photo storage untracked              | Docs     | 1h     |
| 🟠 **MAJOR**   | Critical workflow      | Payout procedure missing (US-5.2)    | Spec     | 2h     |
| 🟡 **MINOR**   | Security               | Token rotation policy undefined      | Spec     | 1h     |
| 🟡 **MINOR**   | Data completeness      | Phone number unjustified             | Spec     | 1h     |
| 🟡 **MINOR**   | API contract           | Pagination strategy undefined        | Spec     | 1h     |
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
