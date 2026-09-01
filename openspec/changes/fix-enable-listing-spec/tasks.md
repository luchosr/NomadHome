# Tasks: fix-enable-listing-spec

## 1. Tests

- [ ] 1.1 In `apps/api/src/admin-moderation.test.ts`, un-skip the `PATCH /admin/listings/:id/enable` test (remove `.skip`), rename it to "sets listing status to DRAFT (200)", update the assertion to `expect(res.body.status).toBe("DRAFT")`, and remove the `// Skipped: ...` comment referencing issue #89. `expect(res.body.disabledAt).toBeNull()` stays as-is.
- [ ] 1.2 Run `apps/api/src/admin-moderation.test.ts` and confirm it's green against the existing (unmodified) implementation.

## 2. Docs & Ops

- [ ] 2.1 None. No env vars, no migration, no production code changes.
