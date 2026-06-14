# ADR: Three spec corrections from the Gemini re-check

## Status

Accepted, 2026-06-15.

## Context

The Gemini re-check review (`docs/gemini-adversarial-review-recheck.md`) flagged three corrections needed in canonical capability specs. None require a new design decision — each aligns the spec with already-decided behavior in `docs/data-model.md` or fills a coverage gap that pagination correctness implicitly required. They are bundled into one change because they are all "corrections surfaced by a single review pass" and individually too small to justify three separate change ceremonies.

## Decision 1 — Payout math (Finding 17)

**The bug.** The "Admin sees amounts owed per host" requirement and its scenario both say the amount owed is `booking total − snapshotted host commission`. Booking total is `subtotalCents + guestServiceFeeCents` (data-model §3.11). The host portion is `subtotalCents − hostCommissionCents`. Using booking total over-pays the host by exactly the guest service fee.

**The fix.** Replace "booking total" with "subtotal" in the requirement text. Replace the scenario's restated formula with a reference to `Booking.payoutCents` (the canonical field that `docs/data-model.md` §3.11 already defines as `subtotalCents − hostCommissionCents`). Referencing the canonical field rather than restating the formula prevents future drift.

**Trade-off accepted.** None — this is a pure bug fix.

## Decision 2 — Default sort order (Finding 18)

**The gap.** The pagination requirement defines `?page` and `?pageSize` but is silent on the ordering of results. Without a deterministic default, two consecutive page fetches can return overlapping or skipped items, and two implementers can ship two different orderings without violating the spec as written.

**Options considered.**

- **A — `createdAt DESC`, tiebreaker `id ASC` (chosen)**: newest published listings surface first; id tiebreaker keeps pagination deterministic when timestamps collide.
- **B — `publishedAt DESC`**: more user-relevant (when the host actually went live) but requires a separate column on `Listing`. The data model currently has `createdAt` and `updatedAt` only.
- **C — Relevance scoring**: irrelevant for MVP — no text search, only structured filters.
- **D — Defer to `[OPEN]` marker**: leaves the gap open. Adds another row to `openspec/project.md` §8 right after we worked to close all of them in Findings 9, 11, 12.

**Trade-off accepted.** `createdAt DESC` favors freshness over relevance. For an MVP with single-digit hosts and double-digit listings (PRD §4), every published listing is fresh; the ordering matters more for determinism than for ranking quality. When listing volume grows, sort can be revisited via a follow-up change without breaking the pagination envelope.

## Decision 3 — Re-enable behavior (Finding 20)

**The contradiction.** The admin spec says re-enable restores "still-active listings" (`un-hiding still-active listings`). The scenario says "any listings the user still owns that are in status `published` are again returned by guest-facing search." But `docs/data-model.md` §3.6 invariant says "re-enabling reverts to `DRAFT`, not `PUBLISHED`."

**Resolution path per `openspec/project.md` §6 conflict hierarchy.** The spec is item 1 and wins by default. But here the spec was written without checking the data model, and the data-model's behavior is the safer one — forcing a manual re-review prevents a previously-disabled host's content from auto-republishing under a re-enable that's meant to be a low-stakes administrative action. Align the spec with the data-model.

**The fix.**

- Requirement text: replace "un-hiding still-active listings" with explicit "listings whose status was transitioned to `DISABLED` by the user-disable cascade revert to `DRAFT`; the host MUST manually re-publish them."
- Re-enable scenario: assert listings transition to `DRAFT` (not `PUBLISHED`) and search does NOT return them until the host re-publishes.
- Host-disable scenario: assert that listings transition to `DISABLED` status (the data-model §7.4 invariant 4 already specifies this transition, but the spec scenario only said "no longer appear in guest-facing search" — naming the transition closes a related gap).

**Trade-off accepted.** Hosts who are re-enabled experience friction — they must re-publish each listing manually. For an admin action used to manage bad actors, the safety gain is worth it. If the re-enable is operationally common (e.g. after a brief mistake), the host can re-publish from their dashboard immediately; no user data is lost.

## Consequences

- TDD against the three modified specs now produces tests for the corrected behavior. The math error would have shipped to production otherwise — a financial bug catch.
- The search-spec sort decision can be revisited via a follow-up change if `publishedAt` becomes valuable; no envelope change required.
- The re-enable behavior creates a small UX moment ("your listings are in DRAFT — re-publish them") that the host-tooling dashboard will need to surface. Tracked in §3 follow-ups.
- `openspec/project.md` §8 (the open-decisions table) is not touched — no new deferrals added.

## Follow-ups

- Host dashboard surface for "previously disabled, now reverted to DRAFT" listings — when `add-host-tooling` is implemented, ensure the listings list visibly marks DRAFTs that came from a disable cascade differently from net-new DRAFTs. Tracked outside this change.
- If listing volume ever pushes default `createdAt DESC` past relevance utility, evaluate `publishedAt`-based ordering. Non-breaking on the envelope.
