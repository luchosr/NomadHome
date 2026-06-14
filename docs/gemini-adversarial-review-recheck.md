# Adversarial Review: NomadHome Documentation (RE-CHECKED)

**Date**: 13 June 2026  
**Reviewer**: Gemini CLI (interactive agent)  
**Scope**: `docs/` folder + `openspec/` capability specs + `README.md`  
**Original verdict (2026-06-13)**: 🔴 FAIL — Two Major Findings (Blockers) and three Minor Findings.  
**Current status (2026-06-15)**: ✅ **ALL 5 FINDINGS CLOSED** — PR closes 17, 18, 19, 20 via the `correct-specs-per-gemini-recheck` change + a stay-rules doc cleanup; Finding 14 was a false positive (already resolved by PR #15 — verified).

---

## Executive Summary

This re-check acknowledges that the documentation was updated mid-session to address several previous findings. Specifically, the **Purpose** sections in capability specs have been populated, the **Guest Disabled** scenarios have been added to the admin spec, and the **Overlap Conflict** details in the listings spec have been tightened to match the API contract in the data model.

Despite these significant improvements, the documentation still fails the adversarial pass due to a **critical mathematical error in payout calculations** and a **direct contradiction between the spec and data model** regarding listing re-enablement.

---

## Major Findings (Blockers)

### Finding 17: Mathematical error in Payout calculation (Financial Risk)
- **Status**: ✅ RESOLVED — 2026-06-15
- **Severity**: **Major (Blocker)**
- **File**: `openspec/specs/payments/spec.md`
- **Context**: `data-model.md` §3.11 and `backend-standards.md` correctly define the host payout as `Subtotal - Host Commission`. `totalChargedCents` (Booking Total) is defined as `Subtotal + Guest Fee`.
- **Problem**: The `payments` spec scenario "Admin views payouts dashboard" states that the amount owed is the sum of (**booking total** − snapshotted host commission).
- **Impact**: Financial Bug. If implemented per the spec, the host is paid the **Guest Service Fee** in addition to their subtotal. The platform would lose its entire guest-side margin on every booking.
- **Recommendation**: Correct `payments/spec.md` to use "subtotal minus snapshotted host commission" or "total minus guest fee and host commission".

**Resolution**: Closed via OpenSpec change `correct-specs-per-gemini-recheck` (archived `openspec/changes/archive/2026-06-14-correct-specs-per-gemini-recheck/`). The "Admin sees amounts owed per host" requirement text and scenario now reference the canonical `Booking.payoutCents` field (per `docs/data-model.md` §3.11: `subtotalCents − hostCommissionCents`). The scenario also explicitly asserts that the guest service fee is NEVER included in the amount owed — the platform keeps the entire guest-side fee as revenue.

### Finding 20: Contradiction in Listing Re-enablement logic (Operational Risk)
- **Status**: ✅ RESOLVED — 2026-06-15
- **Severity**: **Major (Blocker)**
- **Files**: `openspec/specs/admin/spec.md` vs `docs/data-model.md`
- **Problem**: 
    - `admin/spec.md` Requirement: "...restoring login access and **un-hiding still-active listings**." Scenario: "...listings ... in status **published** are again returned..."
    - `data-model.md` §3.6 Invariants: "...re-enabling reverts to **DRAFT**, not PUBLISHED."
- **Impact**: Operational inconsistency. The spec implies listings automatically become visible again ("un-hiding"), while the data model correctly enforces a revert to `DRAFT` so the host (or admin) must manually review and re-publish.
- **Recommendation**: Align the `admin/spec.md` text and scenarios with the data model's safer "revert to DRAFT" behavior.

**Resolution**: Closed via the same `correct-specs-per-gemini-recheck` change. The "Admin can disable a user" requirement now matches `docs/data-model.md` §3.6 invariant: on re-enable, listings whose status was transitioned to `DISABLED` by the user-disable cascade revert to `DRAFT`, NOT to `PUBLISHED`. The host must manually re-publish each listing. Also tightened the host-disable scenario to explicitly assert listings transition to `Listing.status = DISABLED` (the data-model §7.4 invariant 4 already specified this transition but the spec scenario only said "no longer appear in guest-facing search"). The re-enable scenario also clarifies that listings already in `DRAFT` at the time of disable remain in `DRAFT`, and `BookingFlag` rows are NOT auto-resolved by re-enable.

---

## Minor Findings

### Finding 14: Stale "phone" references in README.md
- **Status**: ✅ ALREADY RESOLVED — verified 2026-06-15 (re-check false positive)
- **Severity**: **Minor**
- **File**: `README.md` (lines 341 and 745)
- **Problem**: `phone` was removed from the scope in PR #11 to avoid creep, but it remains in the README's Mermaid diagram and field table.
- **Recommendation**: Remove `phone` from `README.md` for consistency.

**Resolution**: Already closed by PR #15 (`chore/finding-14-readme-phone-cleanup`, merged 2026-06-13). The re-check incorrectly flagged this as open. Re-verified during the gemini-recheck-fixes PR: `grep -n "phone" README.md` returns zero results. No additional change required.

### Finding 18: Missing Sort Order in Search Spec
- **Status**: ✅ RESOLVED — 2026-06-15
- **Severity**: **Minor**
- **File**: `openspec/specs/search/spec.md`
- **Problem**: The search spec defines pagination but is silent on the default sort order.
- **Recommendation**: Define a default sort (e.g., `createdAt DESC`) to ensure consistent testable results.

**Resolution**: Closed via the same `correct-specs-per-gemini-recheck` change. Added a new "Search results have a deterministic default sort order" requirement specifying `createdAt DESC` with `id ASC` tiebreaker. Four new scenarios cover: default sort applied when no parameter is provided, consecutive pages don't overlap or skip when result set is stable, tiebreaker applied for equal `createdAt`, and client-provided `?sort` parameter ignored in MVP (out-of-scope). The ADR in the archived change's `design.md` weighs `createdAt DESC` vs `publishedAt DESC` vs relevance vs OPEN-marker deferral and explains why `createdAt DESC` is the chosen default.

### Finding 19: Missing "Stay Rules" in Decision Tracker
- **Status**: ✅ RESOLVED — 2026-06-15
- **Severity**: **Minor**
- **Files**: `openspec/project.md` §8 and `docs/OPEN-DECISIONS.md`
- **Problem**: "Min/max stay rules" are flagged as an `[OPEN]` decision blocking `add-listings` in the PRD and Data Model, but they are missing from the canonical tracker in `project.md`.
- **Recommendation**: Add the "Min/max stay rules" row to the `project.md` decision table.

**Resolution**: Closed by tightening the doc inconsistency rather than adding a new tracker row. `openspec/project.md` §3.1 Listings row already classifies "min/max stay rules per listing" as ⏸ Post-MVP. Per the conflict-resolution hierarchy in §6, that classification wins. The PRD (§12) and data-model (§9) were just inconsistent with it. This PR tightens both downstream documents to match: PRD §12 line replaced with a confirmed Post-MVP statement pointing at project.md §3.1 + §3.3 promotion procedure; data-model §9 row dropped (stay rules are not blocking; they're Post-MVP). No new row added to §8 — this is not an open decision needing tracking. Stay rules return via the §3.3 promotion procedure if/when explicitly promoted.

---

## Resolved Findings (Verified in this Pass)

- **Finding 13 (Guest Disabled scenarios)**: ✅ RESOLVED. `admin/spec.md` now contains scenarios for disabling guests and dual-role users.
- **Finding 15 (Overlap Conflict contract)**: ✅ RESOLVED. `listings/spec.md` now explicitly references the `data-model.md` §3.10 response shape and `bookingId` field.
- **Finding 16 (TBD Purpose sections)**: ✅ RESOLVED. All capability specs now have descriptive Purpose sections.

---

## Final Verdict (2026-06-13, historical)

**Status**: 🔴 **FAIL**

The documentation is much closer to implementation readiness, but the **mathematical error in payouts** is a non-negotiable blocker. Correcting the payout logic and the re-enablement contradiction will bring the suite to a "PASS" state.

## Final Status (2026-06-15)

**Status**: ✅ **ALL FINDINGS CLOSED**

| # | Severity | Resolved by |
| --- | --- | --- |
| 14 | Minor | Already resolved by PR #15 — re-check false positive; re-verified with grep |
| 17 | Major (Blocker) | `correct-specs-per-gemini-recheck` — payments spec math fixed |
| 18 | Minor | `correct-specs-per-gemini-recheck` — default sort `createdAt DESC, id ASC` |
| 19 | Minor | Doc cleanup — PRD §12 + data-model §9 aligned with project.md §3.1 (Post-MVP) |
| 20 | Major (Blocker) | `correct-specs-per-gemini-recheck` — admin spec aligned with data-model §3.6 + §7.4 |

`openspec validate --specs --strict` ✅ (10/10) after archive.

Four `[OPEN]` decisions remain tracked in `openspec/project.md` §8 — same as before this PR. None are blockers; each closes naturally when the implementing capability ticket runs. Stay rules deliberately NOT added to §8 — they're confirmed Post-MVP, not deferred.

---
**End of Adversarial Review**
