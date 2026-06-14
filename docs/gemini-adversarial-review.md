# Adversarial Review: NomadHome Documentation

**Date**: 13 June 2026  
**Reviewer**: Gemini CLI (interactive agent)  
**Scope**: `docs/` folder + `openspec/` capability specs + `README.md`  
**Original verdict (2026-06-13)**: 🟡 PASS WITH GAPS — One Major Finding (Blocker) and three Minor Findings.  
**Current status (2026-06-14)**: ✅ **ALL 4 FINDINGS RESOLVED** — PR #14 (Finding 13), PR #15 (Finding 14), PR #16 (Finding 15), PR #17 (Findings 16). All blockers cleared.

---

## Executive Summary

The documentation has significantly improved since the May 2026 baseline. The resolution of the 12 findings documented in `docs/adversarial-review.md` has brought the OpenSpec artifacts, PRD, and Data Model into high alignment. Specifically, the refresh-token rotation policy, pagination contract, and i18n key format decisions have been successfully integrated into the standards and capability specs.

However, a deep dive into the `admin` and `listings` specs against the `PRD.md` and `data-model.md` reveals one critical missing scenario and a few lingering stale references that could lead to implementation drift.

---

## Major Finding (Blocker)

### Finding 13: Missing scenario for Guest Disabled cascade (US-8.3)
- **Status**: ✅ RESOLVED — 2026-06-13
- **Severity**: **Major (Blocker)**
- **File**: `openspec/specs/admin/spec.md`
- **Context**: `PRD.md` US-8.3 and `data-model.md` §7.4 describe the cascade for disabling a user. It explicitly requires that if a *guest* is disabled, their existing confirmed bookings MUST be flagged for admin review.
- **Problem**: The `admin` spec's requirement "Admin can disable a user" mentions both guests and hosts in the text, but the only providing scenario is "Admin disables a host with active listings and bookings". There is NO scenario covering a guest-only user (bad actor guest) being disabled and the resulting flags on their bookings.
- **Impact**: An implementer using only the `admin` spec for TDD will miss the requirement to flag bookings where the disabled user is the guest, leaving a security/ops gap for "bad actor" guests.
- **Recommendation**: Add a dedicated scenario to `openspec/specs/admin/spec.md` titled "Admin disables a guest with active bookings".

**Resolution**: Closed via OpenSpec change `add-guest-disable-scenario` (archived `openspec/changes/archive/2026-06-13-add-guest-disable-scenario/`). The change adds **two** scenarios rather than one — Gemini named the guest-only case, but `data-model.md` §7.4 invariant 4 already states "A single transaction may produce both `HOST_DISABLED` and `GUEST_DISABLED` rows when the disabled user is both a host and a guest with active bookings," so the dual-role case is now covered too. The `Admin can disable a user` requirement now has four scenarios (host cascade, guest cascade, dual-role cascade, re-enable) instead of two. No requirement-text change was needed — the text already said "as guest or host." `openspec validate --specs --strict` ✅ post-archive.

---

## Minor Findings

### Finding 14: Stale "phone" references in README.md
- **Status**: ✅ RESOLVED — 2026-06-13
- **Severity**: **Minor**
- **File**: `README.md` (lines 341 and 745)
- **Context**: Finding 10 in the previous review led to the removal of `phone` from `HostProfile` and `tasks.md` to avoid scope creep (deferred to Post-MVP).
- **Problem**: `README.md` still lists `phone: string` in the mermaid diagram (L341) and the field table (L745).
- **Impact**: Contradicts `docs/data-model.md` §3.2 and `docs/tasks.md` §1.3.1, causing confusion for new developers reading the README first.
- **Recommendation**: Remove the `phone` references from `README.md` to match the data model.

**Resolution**: Both stale references were removed in PR #15. README's HOST_PROFILE Mermaid entity and field table now match `docs/data-model.md` §3.2 and `docs/tasks.md` §1.3.1. `grep -n "phone" README.md` returns no results — no orphan references remain. Phone is still deferred to Post-MVP per the deferral note in `docs/data-model.md` §3.2.

### Finding 15: Vague overlap conflict in Listings Spec
- **Status**: ✅ RESOLVED — 2026-06-13
- **Severity**: **Minor**
- **File**: `openspec/specs/listings/spec.md`
- **Context**: `data-model.md` §3.10 and §7.1 specify that when a host attempts to block a range that overlaps a booking, the system returns an `overlap-conflict` error including the `bookingId`.
- **Problem**: The scenario "Host attempts to block a range overlapping a confirmed booking" in the listings spec says "the conflicting booking reference is returned". It does not explicitly state it is a `bookingId`, nor does it distinguish between conflicting with a `BOOKING_HOLD` (which has a `bookingId`) vs another `HOST_BLOCK` (which doesn't).
- **Impact**: Slight ambiguity in the API response contract for overlap conflicts.
- **Recommendation**: Tighten the scenario to specify `bookingId` for booking-related conflicts.

**Resolution**: Closed via OpenSpec change `tighten-host-block-conflict-scenarios` (archived `openspec/changes/archive/2026-06-13-tighten-host-block-conflict-scenarios/`). The "Host manages listing availability" requirement now has three scenarios instead of two:

1. *(preserved)* Host blocks an unbooked date range → success.
2. **NEW**: Host attempts to block a range overlapping a `BOOKING_HOLD` → response body specifies `conflict.source = "BOOKING_HOLD"`, `conflict.blockId`, AND `conflict.bookingId` so the host can identify and contact the affected guest. Covers both backing `PENDING_PAYMENT` and `CONFIRMED` cases (identical API response).
3. **NEW**: Host attempts to block a range overlapping their own existing `HOST_BLOCK` → response body specifies `conflict.source = "HOST_BLOCK"` and `conflict.blockId` only; `conflict.bookingId` is explicitly absent (HOST_BLOCK rows have no associated booking per data-model §3.10 column note).

The requirement prose was also tightened to be block-source-agnostic ("any existing `AvailabilityBlock` regardless of `source`") to deduplicate the booking-status vs. block check that `data-model.md` §3.11 invariant already resolves.

`ADMIN_BLOCK` overlap scenarios are not added — admin-block insertion is out of MVP. `openspec validate --specs --strict` ✅ post-archive.

### Finding 16: TBD Purpose sections in Capability Specs
- **Status**: ✅ RESOLVED — 2026-06-14
- **Severity**: **Minor (Doc Hygiene)**
- **Files**: `openspec/specs/*.md` (most files)
- **Problem**: Every capability spec currently has "## Purpose: TBD - created by archiving change bootstrap-capability-specs. Update Purpose after archive."
- **Impact**: While the requirements are detailed, the high-level purpose and domain boundary for each capability remain technically "TBD".
- **Recommendation**: Replace the placeholder text with a one-sentence summary of the capability's domain (e.g., "Manages the lifecycle of user accounts, roles, and session security" for `identity`).

**Resolution**: All ten Purpose sections replaced with paragraph-length capability summaries naming what each capability owns, which aggregates it controls, how it relates to adjacent capabilities, and which decisions are deferred (e.g. host-to-guest reviews in `reviews`, richer host tooling in `host-tooling`). `grep "TBD - created by archiving" openspec/specs/*/spec.md` returns no results.

The Purpose section is descriptive metadata, not delta-grammar Requirements/Scenarios, so CLAUDE.md §1's "modify openspec/specs/ directly" anti-directive does not apply. `openspec validate --specs --strict` still passes — 10/10. No OpenSpec change was needed for this.

---

## Verification of Previous Resolutions

I have verified the following 12 resolutions from the previous adversarial review:
1. **Finding 1 (Tech Stack)**: ✅ RESOLVED. `openspec/project.md` §3.1 lists Node/Express/Prisma/Postgres.
2. **Finding 2 (Tech Stack Consistency)**: ✅ RESOLVED. PRD, Data Model, and project.md are aligned on PostgreSQL.
3. **Finding 3 (Conflict Hierarchy)**: ✅ RESOLVED. `openspec/project.md` §6 defines the source-of-truth hierarchy.
4. **Finding 4 (Scope Leak - Analytics)**: ✅ RESOLVED. Analytics removed from PRD.
5. **Finding 5 (GUEST_DISABLED enum)**: ✅ RESOLVED. `data-model.md` §7.4 and `admin/spec.md` requirements include it.
6. **Finding 6 (Overlap Conflict context)**: ✅ RESOLVED. `data-model.md` §3.10 and §7.1 include `bookingId`.
7. **Finding 7 (Stripe Metadata)**: ✅ RESOLVED. `tasks.md` US-4.1 task 4.1.8 includes `metadata.bookingId`.
8. **Finding 8 (Pricing Precision)**: ✅ RESOLVED. `backend-standards.md` Value Objects section uses `Money` with integer cents and currency.
9. **Finding 9 (Refresh Token Rotation)**: ✅ RESOLVED. `identity/spec.md` requirement and 4 scenarios cover sliding rotation, absolute TTL, and reuse detection.
10. **Finding 10 (Phone removal)**: ✅ RESOLVED (except for stale README references — see Finding 14).
11. **Finding 11 (Pagination Contract)**: ✅ RESOLVED. `search/spec.md` requirement and scenarios cover `offset/limit` and the specific JSON envelope.
12. **Finding 12 (i18n Key Format)**: ✅ RESOLVED. `platform/spec.md` requirement covers `snake_case.dot` regex, reserved domains, and missing-key behavior.

---

## Final Verdict (2026-06-13, historical)

**Status**: 🟢 **PASS WITH GAPS**

The documentation is high-quality and implementation-ready for the most part. The "TBD Purpose" and "Phone in README" findings are minor hygiene issues. The "Overlap Conflict" ambiguity is a low-risk contract detail.

**Blocking Action**: ~~Finding 13 (Missing Guest Disabled scenario) must be addressed in `openspec/specs/admin/spec.md` before starting work on the `add-admin-tools` OpenSpec change.~~ ✅ Resolved 2026-06-13 — `add-admin-tools` is unblocked.

## Final Status (2026-06-14)

**Status**: ✅ **ALL FINDINGS CLOSED**

| # | Severity | Resolved by |
| --- | --- | --- |
| 13 | Major (Blocker) | PR #14 — `add-guest-disable-scenario` |
| 14 | Minor | PR #15 — README phone cleanup |
| 15 | Minor | PR #16 — `tighten-host-block-conflict-scenarios` |
| 16 | Minor (Doc Hygiene) | PR #17 — Purpose sections filled across all 10 specs |

Four `[OPEN]` decisions remain tracked in `openspec/project.md` §8 — none are blockers; each closes naturally when the implementing capability ticket runs.

---
**End of Adversarial Review**
