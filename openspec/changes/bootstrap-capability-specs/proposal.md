## Why

The OpenSpec workspace contains no capability specs yet, so every future ticket would fail Phase 2 (`openspec validate`) because there is nothing to delta against. The PRD (`docs/PRD.md`) already defines the MVP capabilities and their user stories in Given/When/Then form, but none of that has been translated into machine-validated specs under `openspec/specs/`. This change resolves Finding 2 of `docs/adversarial-review.md` and unblocks every subsequent ticket, starting with `init-monorepo`.

## What Changes

- Translate PRD §8 user stories into one `spec.md` per MVP capability.
- Establish the baseline behavior contract that future delta changes will modify.
- Lock the kebab-case capability names that `openspec/specs/<capability>/` will use going forward.
- Doc-only change: no application code, no tests, no migrations.

## Capabilities

### New Capabilities

- `identity`: Email/password registration and login, JWT + refresh tokens, role escalation from guest to host, basic auth audit log.
- `listings`: Host-owned listings (properties and workspaces) with photos, amenities, nightly rate, draft/published lifecycle, and availability management.
- `search`: Guest-facing search by city and date range, with filters for price, type, amenities, and capacity, returning paginated results.
- `booking`: Instant-booking reservations, guest-side cancellation before check-in, fee snapshotting, and availability blocking.
- `payments`: Stripe Checkout for guest payment, fee/commission snapshotting, admin-visible amounts owed per host, and manual payout recording.
- `reviews`: One guest review per completed booking (1–5 stars + free text) visible on listing detail.
- `host-tooling`: Minimal host dashboard listing the host's own listings and their upcoming bookings.
- `admin`: Role-guarded admin operations to disable users and disable listings, with appropriate cascading effects.
- `platform`: English-only, mobile-responsive web; all user-facing strings routed through a `t()` helper; REST API contract with Zod-validated request/response shapes.
- `compliance`: bcrypt password hashing, HTTPS in production, and an append-only audit log of authentication events.

### Modified Capabilities

None — `openspec/specs/` is currently empty for capability folders.

## Impact

- **Files added**: `openspec/changes/bootstrap-capability-specs/` (proposal, tasks, 10 delta specs). On archive, `openspec/specs/<capability>/spec.md` for all 10 capabilities will be materialized.
- **Code affected**: None.
- **APIs / dependencies**: None changed.
- **Downstream**: Unblocks every future MVP ticket. Subsequent OpenSpec changes (`init-monorepo`, `add-identity`, etc.) will modify these specs through ADDED / MODIFIED / REMOVED deltas instead of inventing capabilities ad-hoc.
- **Open decisions** flagged but not resolved by this change: exact fee percentages (PRD §12), cancellation/refund tiers (PRD §12), photo storage backend (PRD §12), refresh-token rotation policy (Finding 9), pagination contract (Finding 11), `t()` key format (Finding 12). Each is called out as `[OPEN]` in the relevant spec so the first capability ticket must resolve it.
