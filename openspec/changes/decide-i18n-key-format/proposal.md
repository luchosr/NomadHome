## Why

`openspec/specs/platform/spec.md` requirement "Web application is English-only and mobile-responsive" carries an `[OPEN]` marker on three sub-decisions: the `t(key)` naming convention, missing-key behavior, and whether the backend may import the same dictionary for transactional email templates. Finding 12 of `docs/adversarial-review.md` called this out — without a convention, different developers will write `t('listings.form.nightlyRate')` and `t('booking.success_message')` in the same codebase (this already happens in `docs/frontend-standards.md` examples), and missing keys will fail silently in different ways.

Close all three sub-decisions now so the next ticket on platform (or any feature ticket that adds user-facing strings) starts with a concrete contract. This is the **last open decision** tracked in `openspec/project.md` §8 — closing it empties the open-decisions table for the MVP baseline.

## What Changes

- Specify the key format: snake_case segments joined by dots — `<domain>.<context>.<specific>` (e.g., `auth.form.email_label`).
- Reserve four top-level domains: `common`, `error`, `validation`, plus per-capability domains matching `openspec/specs/<capability>/` folder names.
- Specify missing-key behavior: log a warning to `console.warn` (frontend) or the structured logger (backend); return the literal string `<key-not-found: <KEY>>` so the gap is visible in the rendered UI / email body.
- Specify backend reuse: the backend imports the same dictionary `en` directly (typed) and does NOT use the React-bound `t()` helper. Transactional email templates use the dictionary plus a simple `{{var}}` interpolation pass.
- Tighten the `[OPEN]` marker in the platform spec — fully closed for this requirement.
- No code changes (no monorepo yet); this is a doc-and-spec close.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform`: tighten the existing `Web application is English-only and mobile-responsive` requirement with the concrete key format / missing-key behavior / backend-reuse rules, remove the `[OPEN]` marker, and add four new scenarios (key format validity, reserved-domain enforcement, missing-key fallback, backend import path).

## Impact

- **Files added**: `openspec/changes/decide-i18n-key-format/` (proposal, design, tasks, delta spec). After archive, the delta is merged into `openspec/specs/platform/spec.md`.
- **Files added at the helper's future location**: `packages/shared/src/strings/README.md` — discoverable docs for the engineer who'll implement the helper. Per Finding 12's reviewer recommendation. The path is created before the rest of `packages/shared/` exists; the file moves with the monorepo when `init-monorepo` lands.
- **Code affected**: None (no monorepo yet). When `init-monorepo` adds `packages/shared/`, the helper at `packages/shared/src/strings/index.ts` MUST conform to this spec.
- **Docs affected**: `docs/frontend-standards.md` — existing `t()` examples are inconsistent (mix of snake_case and camelCase) and the existing helper sketch returns `|| key` on miss. Both will be aligned with the decided contract in a separate commit of this PR.
- **APIs / dependencies**: None.
- **Downstream**: Closes the `platform` row in `openspec/project.md` §8 entirely. **This is the last open decision** — §8 will be empty after this change archives. `docs/OPEN-DECISIONS.md` synopsis loses its only remaining row.
- **Out of scope**: Bringing in `i18next` (Post-MVP per `openspec/project.md` §3.1). Generating type-safe key constants from the dictionary (a build-time concern, can be added later without breaking the spec).
