## 1. Decide the strategy

- [x] 1.1 Write ADR in `design.md` weighing offset/limit vs. cursor vs. hybrid
- [x] 1.2 Pick offset/limit; document defaults (`pageSize=20`, page≥1, pageSize∈[1,100]); document envelope `{ data, pagination: { total, page, pageSize, hasMore } }`

## 2. Modify the search spec

- [x] 2.1 Author delta `specs/search/spec.md` MODIFYING the `Search results are paginated` requirement: spell out strategy, query params, defaults, bounds, envelope; remove the `[OPEN]` marker
- [x] 2.2 Keep the existing "First page of a multi-page result set" scenario; tighten it to assert the envelope fields
- [x] 2.3 Add three new scenarios: default-page request returns envelope with `page=1, pageSize=20`; `page=0` returns `400`; `pageSize=200` returns `400`
- [x] 2.4 Run `openspec validate decide-search-pagination --strict`

## 3. Propagate the decision to docs

- [x] 3.1 Update `docs/PRD.md` US-3.1 to declare the same query params, defaults, bounds, and envelope, cross-referencing the spec

## 4. Close the open decision

- [x] 4.1 Run `openspec archive decide-search-pagination --yes` to materialize the delta
- [x] 4.2 Remove the `search` row from `openspec/project.md` §8
- [x] 4.3 Remove the `search` row from `docs/OPEN-DECISIONS.md` synopsis
- [x] 4.4 Mark Finding 11 of `docs/adversarial-review.md` as ✅ RESOLVED + flip summary-table row

## 5. Follow-ups (out of scope for this change)

- [ ] 5.1 Other paginated capabilities (host dashboard bookings, admin user/listing lists, payouts dashboard) MAY adopt this contract by reference; each ticket decides at implementation time
- [ ] 5.2 If MVP scale ever pushes `COUNT(*)` cost beyond budget, evaluate option C (hybrid offset/cursor) — no client breakage required
