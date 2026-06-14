# Adversarial Review: NomadHome Documentation (RE-CHECKED)

**Date**: 13 June 2026  
**Reviewer**: Gemini CLI (interactive agent)  
**Scope**: `docs/` folder + `openspec/` capability specs + `README.md`  
**Verdict**: 🔴 FAIL — Two Major Findings (Blockers) and three Minor Findings.

---

## Executive Summary

This re-check acknowledges that the documentation was updated mid-session to address several previous findings. Specifically, the **Purpose** sections in capability specs have been populated, the **Guest Disabled** scenarios have been added to the admin spec, and the **Overlap Conflict** details in the listings spec have been tightened to match the API contract in the data model.

Despite these significant improvements, the documentation still fails the adversarial pass due to a **critical mathematical error in payout calculations** and a **direct contradiction between the spec and data model** regarding listing re-enablement.

---

## Major Findings (Blockers)

### Finding 17: Mathematical error in Payout calculation (Financial Risk)
- **Status**: 🔴 OPEN
- **Severity**: **Major (Blocker)**
- **File**: `openspec/specs/payments/spec.md`
- **Context**: `data-model.md` §3.11 and `backend-standards.md` correctly define the host payout as `Subtotal - Host Commission`. `totalChargedCents` (Booking Total) is defined as `Subtotal + Guest Fee`.
- **Problem**: The `payments` spec scenario "Admin views payouts dashboard" states that the amount owed is the sum of (**booking total** − snapshotted host commission).
- **Impact**: Financial Bug. If implemented per the spec, the host is paid the **Guest Service Fee** in addition to their subtotal. The platform would lose its entire guest-side margin on every booking.
- **Recommendation**: Correct `payments/spec.md` to use "subtotal minus snapshotted host commission" or "total minus guest fee and host commission".

### Finding 20: Contradiction in Listing Re-enablement logic (Operational Risk)
- **Status**: 🔴 OPEN
- **Severity**: **Major (Blocker)**
- **Files**: `openspec/specs/admin/spec.md` vs `docs/data-model.md`
- **Problem**: 
    - `admin/spec.md` Requirement: "...restoring login access and **un-hiding still-active listings**." Scenario: "...listings ... in status **published** are again returned..."
    - `data-model.md` §3.6 Invariants: "...re-enabling reverts to **DRAFT**, not PUBLISHED."
- **Impact**: Operational inconsistency. The spec implies listings automatically become visible again ("un-hiding"), while the data model correctly enforces a revert to `DRAFT` so the host (or admin) must manually review and re-publish.
- **Recommendation**: Align the `admin/spec.md` text and scenarios with the data model's safer "revert to DRAFT" behavior.

---

## Minor Findings

### Finding 14: Stale "phone" references in README.md
- **Status**: 🟡 OPEN
- **Severity**: **Minor**
- **File**: `README.md` (lines 341 and 745)
- **Problem**: `phone` was removed from the scope in PR #11 to avoid creep, but it remains in the README's Mermaid diagram and field table.
- **Recommendation**: Remove `phone` from `README.md` for consistency.

### Finding 18: Missing Sort Order in Search Spec
- **Status**: 🟡 OPEN
- **Severity**: **Minor**
- **File**: `openspec/specs/search/spec.md`
- **Problem**: The search spec defines pagination but is silent on the default sort order.
- **Recommendation**: Define a default sort (e.g., `createdAt DESC`) to ensure consistent testable results.

### Finding 19: Missing "Stay Rules" in Decision Tracker
- **Status**: 🟡 OPEN
- **Severity**: **Minor**
- **Files**: `openspec/project.md` §8 and `docs/OPEN-DECISIONS.md`
- **Problem**: "Min/max stay rules" are flagged as an `[OPEN]` decision blocking `add-listings` in the PRD and Data Model, but they are missing from the canonical tracker in `project.md`.
- **Recommendation**: Add the "Min/max stay rules" row to the `project.md` decision table.

---

## Resolved Findings (Verified in this Pass)

- **Finding 13 (Guest Disabled scenarios)**: ✅ RESOLVED. `admin/spec.md` now contains scenarios for disabling guests and dual-role users.
- **Finding 15 (Overlap Conflict contract)**: ✅ RESOLVED. `listings/spec.md` now explicitly references the `data-model.md` §3.10 response shape and `bookingId` field.
- **Finding 16 (TBD Purpose sections)**: ✅ RESOLVED. All capability specs now have descriptive Purpose sections.

---

## Final Verdict

**Status**: 🔴 **FAIL**

The documentation is much closer to implementation readiness, but the **mathematical error in payouts** is a non-negotiable blocker. Correcting the payout logic and the re-enablement contradiction will bring the suite to a "PASS" state.

---
**End of Adversarial Review**
