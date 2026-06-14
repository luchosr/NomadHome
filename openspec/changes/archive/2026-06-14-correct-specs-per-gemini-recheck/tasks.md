## 1. Author the deltas

- [x] 1.1 MODIFY `payments/spec.md` "Admin sees amounts owed per host": replace "booking total minus snapshotted host commission" with "subtotal minus snapshotted host commission (= `Booking.payoutCents` per `docs/data-model.md` §3.11)" in requirement text + tighten scenario to reference the canonical field
- [x] 1.2 ADD new requirement "Search results have a deterministic default sort order" to `search/spec.md` with three scenarios (default sort applied, stable pagination, tiebreaker)
- [x] 1.3 MODIFY `admin/spec.md` "Admin can disable a user": align requirement text and re-enable scenario with `docs/data-model.md` §3.6 — listings revert to DRAFT on re-enable; also tighten the host-disable scenario to name the DISABLED transition
- [x] 1.4 Run `openspec validate correct-specs-per-gemini-recheck --strict`

## 2. Archive

- [x] 2.1 Run `openspec archive correct-specs-per-gemini-recheck --yes` to materialize the deltas into the three canonical specs
- [x] 2.2 Run `openspec validate --specs --strict` to confirm all canonical specs still parse

## 3. Close the findings

- [x] 3.1 Mark Findings 17, 18, 20 of `docs/gemini-adversarial-review-recheck.md` as ✅ RESOLVED with attribution to this change

## 4. Follow-ups (out of scope for this change)

- [ ] 4.1 Host dashboard surface for "previously disabled, now reverted to DRAFT" listings — implement during `add-host-tooling`
- [ ] 4.2 Re-evaluate `createdAt DESC` vs. `publishedAt DESC` if listing volume grows enough that freshness ordering becomes user-hostile
