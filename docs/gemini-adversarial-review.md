# Adversarial Review: NomadHome Documentation

**Date**: 13 June 2026  
**Reviewer**: Gemini CLI (interactive agent)  
**Scope**: `docs/` folder + `openspec/` capability specs + `README.md`  
**Verdict**: 🟡 PASS WITH GAPS — One Major Finding (Blocker) and three Minor Findings.

---

## Executive Summary

The documentation has significantly improved since the May 2026 baseline. The resolution of the 12 findings documented in `docs/adversarial-review.md` has brought the OpenSpec artifacts, PRD, and Data Model into high alignment. Specifically, the refresh-token rotation policy, pagination contract, and i18n key format decisions have been successfully integrated into the standards and capability specs.

However, a deep dive into the `admin` and `listings` specs against the `PRD.md` and `data-model.md` reveals one critical missing scenario and a few lingering stale references that could lead to implementation drift.

---

## Major Finding (Blocker)

### Finding 13: Missing scenario for Guest Disabled cascade (US-8.3)
- **Status**: 🔴 OPEN
- **Severity**: **Major (Blocker)**
- **File**: `openspec/specs/admin/spec.md`
- **Context**: `PRD.md` US-8.3 and `data-model.md` §7.4 describe the cascade for disabling a user. It explicitly requires that if a *guest* is disabled, their existing confirmed bookings MUST be flagged for admin review.
- **Problem**: The `admin` spec's requirement "Admin can disable a user" mentions both guests and hosts in the text, but the only providing scenario is "Admin disables a host with active listings and bookings". There is NO scenario covering a guest-only user (bad actor guest) being disabled and the resulting flags on their bookings.
- **Impact**: An implementer using only the `admin` spec for TDD will miss the requirement to flag bookings where the disabled user is the guest, leaving a security/ops gap for "bad actor" guests.
- **Recommendation**: Add a dedicated scenario to `openspec/specs/admin/spec.md` titled "Admin disables a guest with active bookings".

---

## Minor Findings

### Finding 14: Stale "phone" references in README.md
- **Status**: 🟡 OPEN
- **Severity**: **Minor**
- **File**: `README.md` (lines 341 and 745)
- **Context**: Finding 10 in the previous review led to the removal of `phone` from `HostProfile` and `tasks.md` to avoid scope creep (deferred to Post-MVP).
- **Problem**: `README.md` still lists `phone: string` in the mermaid diagram (L341) and the field table (L745).
- **Impact**: Contradicts `docs/data-model.md` §3.2 and `docs/tasks.md` §1.3.1, causing confusion for new developers reading the README first.
- **Recommendation**: Remove the `phone` references from `README.md` to match the data model.

### Finding 15: Vague overlap conflict in Listings Spec
- **Status**: 🟡 OPEN
- **Severity**: **Minor**
- **File**: `openspec/specs/listings/spec.md`
- **Context**: `data-model.md` §3.10 and §7.1 specify that when a host attempts to block a range that overlaps a booking, the system returns an `overlap-conflict` error including the `bookingId`.
- **Problem**: The scenario "Host attempts to block a range overlapping a confirmed booking" in the listings spec says "the conflicting booking reference is returned". It does not explicitly state it is a `bookingId`, nor does it distinguish between conflicting with a `BOOKING_HOLD` (which has a `bookingId`) vs another `HOST_BLOCK` (which doesn't).
- **Impact**: Slight ambiguity in the API response contract for overlap conflicts.
- **Recommendation**: Tighten the scenario to specify `bookingId` for booking-related conflicts.

### Finding 16: TBD Purpose sections in Capability Specs
- **Status**: 🔵 OPEN
- **Severity**: **Minor (Doc Hygiene)**
- **Files**: `openspec/specs/*.md` (most files)
- **Problem**: Every capability spec currently has "## Purpose: TBD - created by archiving change bootstrap-capability-specs. Update Purpose after archive."
- **Impact**: While the requirements are detailed, the high-level purpose and domain boundary for each capability remain technically "TBD".
- **Recommendation**: Replace the placeholder text with a one-sentence summary of the capability's domain (e.g., "Manages the lifecycle of user accounts, roles, and session security" for `identity`).

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

## Final Verdict

**Status**: 🟢 **PASS WITH GAPS**

The documentation is high-quality and implementation-ready for the most part. The "TBD Purpose" and "Phone in README" findings are minor hygiene issues. The "Overlap Conflict" ambiguity is a low-risk contract detail.

**Blocking Action**: Finding 13 (Missing Guest Disabled scenario) must be addressed in `openspec/specs/admin/spec.md` before starting work on the `add-admin-tools` OpenSpec change.

---
**End of Adversarial Review**
