# String Localization Helper — MVP

> **Canonical spec**: [`openspec/specs/platform/spec.md`](../../../../openspec/specs/platform/spec.md), requirement "Web application is English-only and mobile-responsive".
>
> **ADR**: [`openspec/changes/archive/<date>-decide-i18n-key-format/design.md`](../../../../openspec/changes/archive/) — weighs the options chosen here.
>
> This README lives at the helper's future home so that the engineer who first implements the helper can read it without spelunking through `openspec/`. The contract below is a digest of the spec, not a parallel specification — the spec wins on any disagreement (`openspec/project.md` §6).

## What the helper does

The MVP UI ships in English only, but every user-facing string is routed through a `t(key)` helper so a future i18n migration does not require locating untranslated literals across the codebase. The helper looks up a key in an English-only dictionary (`en.ts`) and returns the resolved string.

`i18next` and other heavyweight i18n libraries are explicitly **out of MVP** per [`openspec/project.md`](../../../../openspec/project.md) §3.1.

## Key format

- Format: `<domain>.<context>.<specific>` — at least two dot-joined segments.
- Each segment: `snake_case`, lower-case, ASCII letters/digits/underscores only. Must start with a letter.
- Regex: `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$`.
- ❌ No hyphens. ❌ No camelCase. ❌ No single-segment keys.

Examples:

```
auth.form.email_label
booking.success.confirmation_title
email.booking_confirmation.subject
common.close
common.banner.success_message
```

## Reserved top-level domains

Three top-level domains are **always present** in `en.ts`, even if some are sparse to start:

- `common` — labels, buttons, banners, and other strings shared across capabilities.
- `error` — user-facing error messages (e.g. 500 page, "something went wrong" fallbacks).
- `validation` — Zod-style validation messages mapped from schema errors.

Beyond those three, every top-level domain MUST correspond to a folder under [`openspec/specs/<capability>/`](../../../../openspec/specs/). So `booking.*`, `listings.*`, `search.*`, `admin.*`, `host-tooling.*`, `identity.*`, `compliance.*`, `payments.*`, `platform.*`, `reviews.*` are all valid; `banner.*` is not (move to `common.banner.*`).

Adding a new capability adds a new top-level domain in the same PR.

## Runtime behavior

### Missing key

```ts
t('booking.does_not_exist');
// → "<key-not-found: booking.does_not_exist>"
// + console.warn('[i18n] key not found: booking.does_not_exist')
```

The helper logs a warning (`console.warn` on the frontend, the structured logger on the backend) and returns the literal string `<key-not-found: KEY>` where `KEY` is the exact key requested. The angle brackets are part of the returned string so the gap is obvious in rendered UI / email body. The helper **never throws**.

### Type safety

The exported `t` is typed as `(key: LocaleKeys) => string` where `LocaleKeys` is a template-literal type derived from the structure of `en.ts`. Misspelled keys fail at compile time, not runtime. The runtime missing-key check exists for cases the compiler cannot catch (e.g. keys assembled from variables — discouraged but allowed).

### Type-safe key assembly

If a key must be assembled from a variable, prefer `as const` lookups:

```ts
const NOTICE_KEY = {
  listing_disabled: 'booking.notice.listing_disabled',
  host_disabled:    'booking.notice.host_disabled',
} as const;
t(NOTICE_KEY[reason]); // compile-checked
```

Untyped string concatenation (`` t(`booking.notice.${reason}`) ``) is allowed but loses the compile-time safety net.

## Backend reuse

The **frontend** uses the React-bound `t(key)` helper exported from this folder.

The **backend** imports `en` directly and accesses values via property access:

```ts
// apps/api/src/email/booking-confirmation.ts
import { en } from '@nomadhome/shared/strings/en';

const subject = en.email.booking_confirmation.subject;
const body = renderTemplate(en.email.booking_confirmation.body, {
  guest_name: booking.guest.displayName,
  city: listing.city,
});
```

The backend does NOT import the React-bound `t()` helper. Rationale: the React implementation logs to `console.warn`, which is the wrong sink for server code, and the React closure isn't compatible with the backend's request-scoped logger.

Template variable substitution uses `{{var}}` syntax. Strings in `en.ts` that need substitution embed the placeholder verbatim (e.g. `'Hi {{guest_name}}, your booking is confirmed.'`); the email renderer runs a single pass replacing `{{name}}` with the value of `name` in the substitution map.

## Lint enforcement (deferred follow-up)

A PR-time lint that refuses `t('...')` literals whose keys do not match the regex is tracked as a follow-up of the `decide-i18n-key-format` ADR. Until that lands, key violations are caught at code review only.

A second deferred lint will refuse `en.<...>` accesses in `apps/api/` whose paths don't exist in the dictionary (the inverse of the frontend regex check).

## When to break this contract

You don't. If the contract is wrong, fix the contract first via an OpenSpec change MODIFYING the platform spec. Changing only this README (or only the runtime helper) without a spec change creates drift — `openspec/project.md` §6 is unambiguous about which document wins.
