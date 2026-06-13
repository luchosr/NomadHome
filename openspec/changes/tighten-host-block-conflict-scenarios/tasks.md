## 1. Author the delta

- [x] 1.1 MODIFY the `Host manages listing availability` requirement in `specs/listings/spec.md`: copy the entire existing requirement block verbatim (per OpenSpec rules), tighten the prose to drop the booking-status conflation, preserve the unbooked-range happy-path scenario, replace the vague overlap scenario with a `BOOKING_HOLD`-specific tightened version, and add a `HOST_BLOCK` overlap scenario
- [x] 1.2 Run `openspec validate tighten-host-block-conflict-scenarios --strict`

## 2. Archive

- [x] 2.1 Run `openspec archive tighten-host-block-conflict-scenarios --yes` to materialize the delta into `openspec/specs/listings/spec.md`
- [x] 2.2 Run `openspec validate --specs --strict` to confirm all canonical specs still parse

## 3. Close the finding

- [x] 3.1 Mark Finding 15 of `docs/gemini-adversarial-review.md` as ✅ RESOLVED and flip the Status line on the finding entry
