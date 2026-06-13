# ADR: `t(key)` naming convention, missing-key behavior, backend reuse

## Status

Accepted, 2026-06-13.

## Context

`openspec/specs/platform/spec.md` requires every user-facing string to be routed through a `t(key)` helper backed by an English-only lookup table, but defers three sub-decisions:

1. **Key naming convention** — `snake_case` vs. `camelCase` vs. `kebab-case`. The current examples in `docs/frontend-standards.md` are inconsistent (`t('listings.form.nightlyRate')` and `t('booking.success_message')` in the same codebase).
2. **Missing-key behavior** — currently the sketched helper returns `key` itself when the lookup fails (`|| key`). This is the cheapest fallback, but it means a missing key silently degrades to "looks like a typo." Finding 12 specifically asked for explicit handling.
3. **Backend reuse** — transactional emails (booking confirmation, payout notice, etc.) need the same English text. Either expose `t()` for both, or expose the underlying dictionary `en` and let the backend import it directly.

## Options considered

### Key naming

- **A — snake_case** (chosen): `auth.form.email_label`. Reads naturally; matches reviewer's recommendation; matches the convention most i18n libraries (i18next, FormatJS, gettext) use; survives a future migration to a real i18n library without renaming keys.
- **B — camelCase**: `auth.form.emailLabel`. Matches the rest of the TypeScript codebase. Trade-off: keys become harder to scan when stacked together (`emailLabel`, `passwordLabel`, `submitButtonLabel`); doesn't survive a future migration to a translation-vendor format that uses snake_case.

### Missing-key behavior

- **A — Return the key itself (`|| key`)**: current sketch. Cheapest fallback. Trade-off: looks like a typo at first glance; harder for QA / code review to spot.
- **B — Return `<key-not-found: KEY>` + log warning** (chosen): explicit. Hard to miss in the rendered UI or email body. Logs let QA build a "missing keys" dashboard post-MVP.
- **C — Throw on missing key**: very loud. Trade-off: breaks the UI on a typo, which is fine in dev but bad in prod; would require an extra try/catch layer or pre-render lint.

### Backend reuse

- **A — Backend calls `t()` directly**: same API on both sides.
   Trade-off: the React-bound implementation of `t()` is the wrong shape on the backend (no React context, no log destination). Forces an awkward second implementation that "looks like" `t()` but isn't really.
- **B — Backend imports `en` dict, no wrapper** (chosen): explicit asymmetry. Backend uses `en.email.booking_confirmation.subject` directly with a simple `{{var}}` interpolation pass for variable substitution. Frontend uses `t('email.booking_confirmation.subject')`. Both sides converge on the same lookup table.
- **C — Build-time codegen of typed constants**: e.g. generate `keys.email.booking_confirmation.subject` constants. Trade-off: nice DX but adds build-tool complexity at MVP scale; can be added later as a no-spec-change improvement.

## Decision

- **Key format**: `snake_case` segments joined by dots, lower-case throughout. Pattern: `<domain>.<context>.<specific>`. Examples: `auth.form.email_label`, `booking.success.confirmation_title`, `email.booking_confirmation.subject`.
- **Reserved top-level domains** (always present): `common`, `error`, `validation`. Plus one domain per capability matching `openspec/specs/<capability>/` folder name (so a key like `booking.foo.bar` always corresponds to the booking capability spec).
- **Missing-key behavior**: log a warning (`console.warn` on the frontend, structured logger on the backend) and return the literal string `<key-not-found: <KEY>>` where `<KEY>` is the exact key requested. The angle brackets are part of the returned string so the gap is visible in rendered UI / email body.
- **Backend reuse**: the backend imports the `en` dictionary directly (typed) from `packages/shared/src/strings/en.ts`. The backend does NOT use the React-bound `t()` helper. Email templates use `en.email.<context>.<specific>` plus a simple `{{var}}` interpolation pass for variable substitution. The frontend continues to use `t('email.<context>.<specific>')` — both sides hit the same dictionary.

## Consequences

- A static-analysis check (or PR-time lint) MUST refuse `t('...')` calls whose keys do not match the snake_case-dot-joined regex `^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$`. This catches typos at PR time, not runtime. (Tracked as follow-up; the spec only requires the format, not the lint.)
- The reserved domains `common`, `error`, `validation` MUST exist in `en.ts` from day one even if some are sparse, so that error and validation messages have stable lookup paths the moment any feature ticket starts.
- Capability domains MUST match `openspec/specs/<capability>/` folder names. Adding a new capability adds a new top-level domain in `en.ts` in the same PR.
- The backend's direct-import approach means the frontend and backend bundles both contain the full `en.ts` dictionary. Acceptable: an English-only MVP dictionary is small. When `i18next` lands post-MVP, the frontend will dynamic-import per-locale chunks; the backend will continue to import statically.
- A missing key that escapes to production renders as `<key-not-found: KEY>` in the UI / email body. This is more visible than `KEY` alone but less destructive than throwing. The accompanying log line gives operators a queryable signal.
- This is the **last** open decision tracked in `openspec/project.md` §8. After archive, the table is empty — every MVP baseline gap that the adversarial review flagged is closed.

## Follow-ups

- PR-time lint that enforces the snake_case-dot-joined key regex against every `t('...')` literal in `apps/web/` and every `en.<...>` access in `apps/api/`. Lands with `init-monorepo` (or with the first feature ticket adding user-facing strings, whichever comes first).
- Build-time codegen of typed constants (option C above) — optional optimization; spec compatible.
- A periodic "missing keys" dashboard sourced from the warning log — Post-MVP, lands with observability.
