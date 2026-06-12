## Why

`openspec/specs/search/spec.md` requirement "Search results are paginated" carries an `[OPEN]` marker on three sub-decisions: pagination strategy (offset vs. cursor), default page size, and maximum page size. Finding 11 of `docs/adversarial-review.md` called this out — different implementers will pick different strategies with no shared contract, breaking client expectations and complicating future paginated endpoints.

Close all three sub-decisions now so the next ticket on search can start with a concrete contract. The reviewer recommended offset pagination at 20/page (min 1, max 100) with a `{ data, pagination: { total, page, pageSize, hasMore } }` envelope — this change adopts that recommendation and adds the validation behavior for out-of-range params.

## What Changes

- Specify offset pagination with `?page` and `?pageSize` query parameters; defaults page=1, pageSize=20; bounds page≥1, pageSize∈[1, 100].
- Specify the response envelope: `{ data: T[], pagination: { total, page, pageSize, hasMore } }`.
- Specify validation behavior: out-of-range parameters return `400` with a Zod validation error per the platform-spec REST contract.
- Tighten the `[OPEN]` marker in the search spec — fully closed for this requirement.
- No code changes (no app exists yet); this is a doc-and-spec close of an open decision.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `search`: tighten the existing `Search results are paginated` requirement with the concrete strategy + envelope + validation rules, remove the `[OPEN]` marker, and add three new scenarios (default page request, page out of bounds, pageSize out of bounds).

## Impact

- **Files added**: `openspec/changes/decide-search-pagination/` (proposal, design, tasks, delta spec). After archive, the delta is merged into `openspec/specs/search/spec.md`.
- **Code affected**: None (no monorepo yet).
- **APIs / dependencies**: None.
- **Downstream**: Closes the `search` row in `openspec/project.md` §8 entirely. Updates `docs/PRD.md` US-3.1 to declare the same contract. Updates `docs/OPEN-DECISIONS.md` synopsis (removes the row).
- **Out of scope**: Cursor pagination as an opt-in optimization. Pagination contract for other capabilities (host dashboard list bookings, admin list users) — those can reference this contract by name or get their own at implementation time; this change does NOT mandate the same envelope across all capabilities.
