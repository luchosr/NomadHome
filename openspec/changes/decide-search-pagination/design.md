# ADR: Search-results pagination strategy

## Status

Accepted, 2026-06-13.

## Context

`openspec/specs/search/spec.md` requires search responses to be paginated but defers the strategy, default page size, and maximum page size to "the first search-implementing ticket." Finding 11 of `docs/adversarial-review.md` called this out: without a concrete contract, every consumer will guess at the response shape and the next refactor will be painful.

MVP scale is small (`docs/PRD.md` §4 — single-digit hosts, double-digit completed stays). Most users land on page 1 with filters; deep paging is rare. Search results are computed against the listings + availability tables, which change at human speed (hosts edit hours, not events per second).

## Options considered

### A — Offset / limit (chosen)

Query: `?page=<int>&pageSize=<int>`. Response: `{ data, pagination: { total, page, pageSize, hasMore } }`.

- **Pros**: Trivial server implementation (one `SELECT ... LIMIT n OFFSET m`). Random access ("jump to page 5") works out of the box. Clients understand it without docs. `total` lets the UI show "1–20 of 137." Stable on a small, slow-changing dataset.
- **Cons**: Result drift if listings are added between page fetches (the same listing can appear twice or be skipped). `COUNT(*)` cost grows linearly with the result set — unbounded if filters are loose. Postgres `LIMIT/OFFSET` walks the offset rows; deep pages get slower.

### B — Cursor (next-token in response)

Query: `?pageSize=<int>&cursor=<opaque>`. Response: `{ data, pagination: { nextCursor | null, pageSize } }`. Cursor encodes the sort key of the last item plus a tiebreaker (e.g. listing id).

- **Pros**: Stable across concurrent inserts. No `COUNT(*)`. Constant-cost paging regardless of depth.
- **Cons**: No random access. Clients must follow links sequentially. The UI cannot show "1–20 of 137" without a separate count call. Sort changes invalidate cursors. More complex client code and tests.

### C — Hybrid (offset for client UX, cursor under the hood)

Expose offset to clients; internally use cursor-based queries to avoid `OFFSET` deep-scan costs. Client unaware.

- **Pros**: Best of both for read paths.
- **Cons**: Server complexity that only pays off at scales the MVP won't see. Premature optimization.

## Decision

**Option A — offset / limit pagination**, defaulting to `pageSize=20` with bounds `pageSize ∈ [1, 100]` and `page ≥ 1`.

Response envelope: `{ data: T[], pagination: { total: number, page: number, pageSize: number, hasMore: boolean } }`. `total` is always returned (acceptable at MVP scale); `hasMore` is redundant but exposed for client convenience.

Out-of-range parameters fail Zod validation at the platform-spec REST boundary and return `400` with a structured error.

## Consequences

- The same offset/limit shape can be reused by any future paginated endpoint without an ADR if the trade-offs match — host dashboard list bookings (US-7.1), admin list users / listings (US-8.1, US-8.2), payouts dashboard (US-5.2). Each of those tickets is free to adopt this contract by reference or design its own.
- `COUNT(*)` cost is bounded by index usage on filter predicates. The search index plan in `docs/data-model.md` §6 (filters on `Listing.status`, city, type, capacity, amenities, price) keeps the count cheap at MVP volumes (<10k published listings).
- A future migration to cursor-based pagination is non-breaking on the response envelope only if cursor returns `total=null` and `page=null`; we'd need to extend the Zod schema to `number | null` for those fields. Acceptable cost when the migration is justified.
- Deep paging perf is **not** a concern at MVP volumes; if it becomes one, the path is option C (hybrid) — clients keep their interface, server swaps internals.

## Follow-ups

- Search index plan must keep filter predicates cheap so `COUNT(*)` stays fast. Tracked in `docs/data-model.md` §6 (already in scope of `add-listings` / `add-search`).
- If a paginated endpoint other than search needs distinct envelope semantics (e.g. infinite scroll without `total`), it MUST justify the deviation in its own change's `design.md` rather than silently producing a different shape.
