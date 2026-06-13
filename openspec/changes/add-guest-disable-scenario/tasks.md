## 1. Author the delta

- [x] 1.1 MODIFY the `Admin can disable a user` requirement in `specs/admin/spec.md`: copy the entire existing requirement block verbatim (per OpenSpec rules), preserve the two existing scenarios, and append two new scenarios for guest-only and dual-role cascades
- [x] 1.2 Run `openspec validate add-guest-disable-scenario --strict`

## 2. Archive

- [x] 2.1 Run `openspec archive add-guest-disable-scenario --yes` to materialize the delta into `openspec/specs/admin/spec.md`
- [x] 2.2 Run `openspec validate --specs --strict` to confirm all canonical specs still parse

## 3. Close the finding

- [x] 3.1 Mark Finding 13 of `docs/gemini-adversarial-review.md` as ✅ RESOLVED and flip the Status line on the finding entry
