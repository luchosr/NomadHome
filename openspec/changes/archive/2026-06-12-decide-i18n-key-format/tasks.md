## 1. Decide the conventions

- [x] 1.1 Write ADR in `design.md` weighing snake_case vs. camelCase keys; `|| key` vs. `<key-not-found>` vs. throw for missing keys; backend uses `t()` vs. imports dict directly vs. codegen constants
- [x] 1.2 Pick snake_case keys + `<key-not-found: KEY>` fallback + backend direct dict import

## 2. Modify the platform spec

- [x] 2.1 Author delta `specs/platform/spec.md` MODIFYING the `Web application is English-only and mobile-responsive` requirement: append the key-format rule, the reserved-domains rule, the missing-key fallback rule, and the backend-reuse rule; remove the `[OPEN]` marker
- [x] 2.2 Keep the two existing scenarios (no-hardcoded-strings, 360 px viewport) untouched
- [x] 2.3 Add four new scenarios: key conforms to the snake_case-dot regex; reserved domain present; missing key returns the marker + logs a warning; backend imports `en` directly without the React-bound helper
- [x] 2.4 Run `openspec validate decide-i18n-key-format --strict`

## 3. Align existing docs

- [x] 3.1 Update `docs/frontend-standards.md` examples that use camelCase keys (`t('listings.form.nightlyRate')`, `t('common.saving')`, `t('common.save')`, `t('common.submit')`) to snake_case; tighten the `t()` implementation sketch to log a warning and return the marker on miss

## 4. Create the discoverable home for the helper

- [x] 4.1 Create `packages/shared/src/strings/README.md` per Finding 12's reviewer recommendation; mirror the contract from the platform spec; cross-reference the ADR

## 5. Close the open decision

- [x] 5.1 Run `openspec archive decide-i18n-key-format --yes` to materialize the delta
- [x] 5.2 Remove the `platform` row from `openspec/project.md` §8 (§8 will be empty after this — the last MVP baseline open decision is closed)
- [x] 5.3 Remove the `platform` row from `docs/OPEN-DECISIONS.md` synopsis
- [x] 5.4 Mark Finding 12 of `docs/adversarial-review.md` as ✅ RESOLVED + flip summary-table row

## 6. Follow-ups (out of scope for this change)

- [ ] 6.1 PR-time lint enforcing the snake_case-dot regex on every `t('...')` literal and every `en.<...>` access — lands with `init-monorepo` or the first user-facing-strings feature ticket
- [ ] 6.2 Optional: build-time codegen of typed constants for keys
- [ ] 6.3 Post-MVP: a "missing keys" observability dashboard sourced from the warning log
