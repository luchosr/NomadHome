## 1. Author baseline capability specs

- [ ] 1.1 Draft `specs/identity/spec.md` from PRD §8.1 (US-1.1, US-1.2, US-1.3) plus token-handling requirements
- [ ] 1.2 Draft `specs/listings/spec.md` from PRD §8.2 (US-2.1, US-2.2, US-2.3) plus ownership enforcement
- [ ] 1.3 Draft `specs/search/spec.md` from PRD §8.3 (US-3.1, US-3.2) plus pagination contract placeholder
- [ ] 1.4 Draft `specs/booking/spec.md` from PRD §8.4 (US-4.1, US-4.2) plus single-listing invariant
- [ ] 1.5 Draft `specs/payments/spec.md` from PRD §8.5 (US-5.1, US-5.2) plus fee snapshotting and payout recording
- [ ] 1.6 Draft `specs/reviews/spec.md` from PRD §8.6 (US-6.1) plus aggregate display requirement
- [ ] 1.7 Draft `specs/host-tooling/spec.md` from PRD §8.7 (US-7.1) plus owned-listings dashboard requirement
- [ ] 1.8 Draft `specs/admin/spec.md` from PRD §8.8 (US-8.1, US-8.2) plus admin-role gate requirement
- [ ] 1.9 Draft `specs/platform/spec.md` covering English-only `t()` helper routing, mobile responsiveness, and Zod-validated REST contract
- [ ] 1.10 Draft `specs/compliance/spec.md` covering bcrypt hashing, HTTPS in production, and append-only auth audit log

## 2. Validate

- [ ] 2.1 Run `openspec validate bootstrap-capability-specs --strict` and confirm the change validates
- [ ] 2.2 Run `openspec show bootstrap-capability-specs` and visually confirm all 10 capabilities are listed under ADDED

## 3. Review and approve

- [ ] 3.1 Present proposal + 10 delta specs to the user for Gate 1 (proposal) + Gate 2 (spec) combined approval
- [ ] 3.2 Incorporate user feedback into the relevant `spec.md` file(s) and re-run validation

## 4. Archive

- [ ] 4.1 Commit the change folder on `feature-entrega1-LR`
- [ ] 4.2 Open PR, get human approval, merge to `main`
- [ ] 4.3 Run `openspec archive bootstrap-capability-specs --yes` on `main` to materialize `openspec/specs/<capability>/spec.md` for all 10 capabilities
- [ ] 4.4 Update `docs/adversarial-review.md` Finding 2 status to RESOLVED with a link to the archived change

## 5. Follow-ups (out of scope for this change)

- [ ] 5.1 Open a follow-up to resolve refresh-token TTL and rotation policy `[OPEN]` in `identity` (Finding 9)
- [ ] 5.2 Open a follow-up to resolve pagination strategy `[OPEN]` in `search` (Finding 11)
- [ ] 5.3 Open a follow-up to resolve `t(key)` naming convention `[OPEN]` in `platform` (Finding 12)
- [ ] 5.4 Open a follow-up to resolve guest service fee and host commission percentages `[OPEN]` in `payments` (PRD §12)
- [ ] 5.5 Open a follow-up to resolve cancellation policy and refund tiers `[OPEN]` in `booking` (PRD §12)
