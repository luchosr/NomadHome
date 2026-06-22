# Backend Implementation Plan — add-payments (NH-014)

## Status Summary

Most of the implementation is already done. The worktree at
`/Users/luciano/Documents/IA4devs/nomadhome-worktrees/NH-014` has
uncommitted (unstaged/untracked) work that needs to be committed in the
correct order. What follows is a precise accounting of every file, its
current state, what needs to happen, and critical notes that will prevent
mistakes.

---

## 1. Current State: What Already Exists

All of the following files are either fully implemented (untracked) or
have the correct unstaged modifications. No logic needs to be written for
them — they just need to be committed.

### Untracked (new files, fully implemented)

| File                                                    | Notes                                                                                                                                                                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/repositories/payment.repository.ts`       | Full implementation: `setCheckoutSession`, `confirmFromWebhook`, `getPayoutSummary`, `recordPayout`.                                                                                                           |
| `apps/api/src/services/payment.service.ts`              | Full orchestration layer: `createCheckoutSession`, `handleCheckoutCompleted`, `getPayoutSummary`, `recordPayout`. Error classes: `BookingNotPendingError`, `PaymentBookingNotFoundError`, `DoublePayoutError`. |
| `apps/api/src/controllers/payment.controller.ts`        | Handles `createCheckoutSession`, `getPayoutSummary`, `recordPayout`. Uses `RecordPayoutSchema` from `@nomadhome/shared`.                                                                                       |
| `apps/api/src/controllers/stripe-webhook.controller.ts` | Handles raw webhook body, constructs Stripe event, delegates to `PaymentService.handleCheckoutCompleted`.                                                                                                      |
| `apps/api/src/routes/stripe.ts`                         | Mounts `express.raw({ type: "application/json" })` before handler. Exports `stripeRouter`.                                                                                                                     |
| `apps/api/src/routes/admin.ts`                          | Mounts `requireAuth` + `requireRole("admin")` on all routes. `GET /payouts` and `POST /payouts`.                                                                                                               |
| `apps/api/src/payment.test.ts`                          | Full integration test suite (see §3 below for critical Stripe mock notes).                                                                                                                                     |
| `openspec/changes/add-payments/`                        | Entire directory with `proposal.md`, `tasks.md`, `design.md`, `specs/`.                                                                                                                                        |

### Modified (unstaged diffs on tracked files)

| File                                     | What changed                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/app.ts`                    | Imports `stripeRouter` and `adminRouter`. Mounts `/stripe` BEFORE `express.json()`, then `/admin` after.                                                                              |
| `apps/api/src/routes/bookings.ts`        | Imports `PaymentController` + `PaymentService` + `PaymentRepository`. Instantiates `paymentController`. Adds `router.post("/:id/checkout", paymentController.createCheckoutSession)`. |
| `apps/api/src/services/email.service.ts` | Adds `BookingConfirmationPayload` interface and `sendBookingConfirmation` method to both the `EmailService` interface and `LoggingEmailService` class.                                |
| `.env.example` (root)                    | Adds `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`.                                                                                         |

### Already committed in previous commits

| File                                     | Commit                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `packages/db/prisma/schema.prisma`       | `feat(db): add StripeProcessedEvent, Payout, PayoutBooking models (NH-014)` |
| `packages/shared/src/schemas/payment.ts` | `feat(shared): add RecordPayoutSchema and payment error strings (NH-014)`   |
| `packages/shared/src/strings/en.ts`      | Same commit — `payments.error.*` strings already present                    |
| `packages/shared/src/index.ts`           | Same commit — `RecordPayoutSchema` and `RecordPayoutInput` already exported |

### Already completed in a previous ticket (apps/api/.env.example)

`apps/api/.env.example` already contains `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`. It is NOT in the unstaged diff, meaning it
was already updated. Do not re-touch it.

### Already exists (middleware)

`apps/api/src/middleware/require-role.ts` already exists and works correctly.
It uses `...roles: string[]` (variadic), not `UserRole` from `@nomadhome/db` — this is
correct because Prisma stores roles as `String[]`, not an enum.

---

## 2. What Needs to Happen (Commit Sequence)

Stage and commit in this exact order. Each commit is logically self-contained
and follows Conventional Commits.

### Commit 1: `feat(payments): add payment repository and service (NH-014)`

Stage:

- `apps/api/src/repositories/payment.repository.ts`
- `apps/api/src/services/payment.service.ts`
- `apps/api/src/services/email.service.ts` (the unstaged diff — adds `BookingConfirmationPayload`)

These three files form the data + business logic layer. `payment.service.ts`
imports `BookingConfirmationPayload` from `email.service.ts`, so they must
land together.

### Commit 2: `feat(payments): add stripe webhook and checkout routes (NH-014)`

Stage:

- `apps/api/src/controllers/stripe-webhook.controller.ts`
- `apps/api/src/controllers/payment.controller.ts`
- `apps/api/src/routes/stripe.ts`
- `apps/api/src/routes/bookings.ts` (the unstaged diff — adds checkout route)
- `apps/api/src/app.ts` (the unstaged diff — wires stripe + admin routers)

Important: `app.ts` wires BOTH the stripe and admin routers, so it cannot
be split between commit 2 and commit 3. Both route files (`stripe.ts` and
`admin.ts`) must exist before `app.ts` is committed. Stage all of these in
this commit.

### Commit 3: `feat(payments): add admin payout routes (NH-014)`

Stage:

- `apps/api/src/routes/admin.ts`

This can be committed alongside commit 2 or separately. Because `app.ts`
already imports it (committed in commit 2), `admin.ts` must be present on
disk when commit 2 is staged, but since `app.ts` is being committed at the
same time, the actual git commit order can be:

**Revised order — commit 2 and 3 must be combined or 3 must come before 2:**

The cleanest approach: commit all route/controller/app changes in a single
commit to avoid a broken intermediate state in git history:

**Revised Commit 2 (combined):** `feat(payments): add stripe webhook, checkout, and admin payout routes (NH-014)`

Stage in this single commit:

- `apps/api/src/controllers/stripe-webhook.controller.ts`
- `apps/api/src/controllers/payment.controller.ts`
- `apps/api/src/routes/stripe.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/routes/bookings.ts`
- `apps/api/src/app.ts`

### Commit 3 (after combined commit 2): `test(payments): add integration tests for payment and admin routes (NH-014)`

Stage:

- `apps/api/src/payment.test.ts`

### Commit 4: `chore(payments): add stripe env vars and close open decisions (NH-014)`

Stage:

- `.env.example` (the unstaged diff — adds Stripe vars at root)
- `openspec/changes/add-payments/` (the entire directory — proposal, tasks, design, specs)
- Remove the `payments` fee-rates row from `openspec/project.md` §8 table
- Remove the `booking` cancellation-policy row from `openspec/project.md` §8 table
- Remove both rows from `docs/OPEN-DECISIONS.md` synopsis table

**Important about tasks.md**: Before this final commit, mark all tasks 3.x,
4.x, 5.x, 6.x as `[x]` in `openspec/changes/add-payments/tasks.md`.

---

## 3. Critical Notes for Implementor

### 3.1 Stripe Mock Strategy in Tests

The test file uses `vi.mock("stripe", ...)` at module level, which mocks the
entire Stripe constructor. The mock factory returns a function (the constructor)
that returns a mock instance with `checkout.sessions.create/retrieve` and
`webhooks.constructEvent` as `vi.fn()`.

The webhook tests use a pattern of `new (Stripe as any)("sk_test")` followed by
`vi.mocked(stripeInstance.webhooks.constructEvent).mockReturnValue(...)`. This
pattern works because the `vi.mock` hoists the mock to module-level — every
`new Stripe(...)` call (including inside `routes/stripe.ts` and `routes/admin.ts`)
returns the same shared mock instance. The `vi.mocked(...)` call on a locally
constructed instance just provides TypeScript type inference for the mock calls.

**Key risk**: The `constructEvent` mock in the webhook tests calls
`vi.mocked(stripeInstance.webhooks.constructEvent).mockReturnValue(...)` on an
instance created in the test body, but the _actual_ instance used by the route
was created at module-scope in `routes/stripe.ts`. Because `vi.mock` makes ALL
instances share the same mock functions (the factory runs once), this works
correctly at runtime. However, if the test runner is confused about module
isolation, the `beforeEach(() => resetDatabase())` call will NOT reset the
mock state. If tests bleed into each other, add `vi.clearAllMocks()` to
`beforeEach`.

### 3.2 `express.raw()` Order in app.ts

The `/stripe` router MUST be registered before `app.use(express.json())`.
The current unstaged diff in `app.ts` does this correctly. Do not reorder.
If `express.json()` runs first, `req.body` will be a parsed object and the
Stripe signature verification will throw because it needs the raw `Buffer`.

### 3.3 `payoutBooking: null` in Prisma groupBy

In `payment.repository.ts`, the `getPayoutSummary` uses:

```ts
where: {
  status: "CONFIRMED",
  checkOut: { lt: today },
  payoutBooking: null,
}
```

This is a Prisma filter checking that the optional 1:1 `payoutBooking`
relation does not exist. This works because `PayoutBooking.bookingId` is
`@unique` and the `Booking` model has a `payoutBooking PayoutBooking?`
relation field. Verify the Prisma schema has this relation defined on the
`Booking` model side (it does — confirmed in schema grep above).

### 3.4 Duplicate Webhook Handling

`confirmFromWebhook` uses a try/catch around `tx.stripeProcessedEvent.create`
to detect the unique constraint violation on `stripeEventId`. The catch block
catches ALL errors and returns `null` on any error. This is intentional — it
treats any DB write failure for the event record as "already processed" and
bails out without touching the booking. This is safe because the
`StripeProcessedEvent.stripeEventId` field has `@unique` in the schema.

If Prisma returns a non-unique-constraint error (e.g., network issue), the
transaction rolls back entirely and the booking is not double-confirmed.
The controller returns `200` regardless of whether `confirmFromWebhook`
returns a confirmed booking or `null` — idempotent by design.

### 3.5 DoublePayoutError Detection

`payment.service.ts` detects double payout via:

```ts
function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Unique constraint failed");
}
```

This string-matches on Prisma's error message. Prisma's unique constraint
violation error (`P2002`) always includes "Unique constraint failed" in the
message. This is a pragmatic approach that avoids importing `@prisma/client`
in the service layer. If Prisma's error message format changes across versions,
update this predicate.

### 3.6 `require-role.ts` — Variadic vs. `UserRole` Type

The mandate says `requireRole(role: UserRole)`. The actual file uses
`...roles: string[]` (variadic, plural). The `admin.ts` route calls it as
`requireRole("admin")` which is compatible. Do NOT change the function
signature to single-argument or import `UserRole` — the existing variadic
`string[]` approach is more flexible and already works.

### 3.7 Closing Open Decisions in `openspec/project.md`

The table in §8 has two rows that need to be removed:

1. The `payments` row: "Guest service fee % and host commission %"
2. The `booking` row: "Cancellation policy windows and refund tiers"

The `booking` row blocks `add-booking` (NH-013), which is already archived.
Both decisions were resolved by prior tickets (fee rates are in the
`PlatformFeeConfig` seed; cancellation policy was implemented in NH-013).
Remove both rows from the Markdown table in `openspec/project.md` §8 and
from the `docs/OPEN-DECISIONS.md` synopsis table.

### 3.8 `openspec/changes/add-payments/tasks.md` — Mark Complete Before Commit

Before staging the final `chore(payments)` commit, open `tasks.md` and
change all remaining `[ ]` checkboxes for tasks 3.x, 4.x, 5.x, 6.x to `[x]`.
Tasks 1.x and 2.x should already be marked from prior commits.

### 3.9 Test for Webhook — Content-Type Header

The webhook test sends:

```ts
.set("Content-Type", "application/json")
.send(Buffer.from(...))
```

With `express.raw({ type: "application/json" })`, the raw middleware triggers
when Content-Type is `application/json`. Supertest's `.send(Buffer)` sets
the body correctly. This combination works.

### 3.10 No `middleware/require-role.ts` Changes Needed

The file already exists with the correct implementation. Do not create or
modify it.

---

## 4. Files NOT to Touch

The following files are complete and should not be modified:

- `packages/db/prisma/schema.prisma` — already has all models
- `packages/shared/src/schemas/payment.ts` — already has `RecordPayoutSchema`
- `packages/shared/src/strings/en.ts` — already has `payments.error.*` keys
- `packages/shared/src/index.ts` — already exports payment schema
- `apps/api/.env.example` — already has Stripe vars
- `apps/api/src/middleware/require-auth.ts` — no changes needed
- `apps/api/src/middleware/require-role.ts` — no changes needed

---

## 5. Quality Gates

Run from `/Users/luciano/Documents/IA4devs/nomadhome-worktrees/NH-014`:

```bash
pnpm lint
pnpm typecheck
pnpm test --filter @nomadhome/api
```

The test suite uses `describe.skipIf(!hasDatabase)` guards, so tests skip
gracefully when `DATABASE_URL` is not set. In CI, `DATABASE_URL` is set and
all tests run. Local runs without a DB will show skipped (not failed) suites.

---

## 6. Report-Back Format (for Orchestrator)

After completing all commits:

1. Files changed (paths):
   - `apps/api/src/repositories/payment.repository.ts`
   - `apps/api/src/services/payment.service.ts`
   - `apps/api/src/services/email.service.ts`
   - `apps/api/src/controllers/payment.controller.ts`
   - `apps/api/src/controllers/stripe-webhook.controller.ts`
   - `apps/api/src/routes/stripe.ts`
   - `apps/api/src/routes/admin.ts`
   - `apps/api/src/routes/bookings.ts`
   - `apps/api/src/app.ts`
   - `apps/api/src/payment.test.ts`
   - `.env.example`
   - `openspec/changes/add-payments/tasks.md`
   - `openspec/project.md`
   - `docs/OPEN-DECISIONS.md`

2. Quality gate results (paste output of lint/typecheck/test)

3. Design decisions already documented in `openspec/changes/add-payments/design.md`

4. Blockers: none anticipated — all logic is already written
