# Tasks: modal-a11y

Change-id: `modal-a11y`. Ticket: NH-146 (#146, a checklist; this change covers the modal items). Branch: `feature/NH-146-modal-a11y` (worktree `../nomadhome-worktrees/NH-146`). Order follows TDD (red, green, refactor, verify). `openspec/config.yaml` defines no extra mandatory steps; the mandatory steps from `docs/openspec-tasks-mandatory-steps.md` apply. Scope is `apps/web` only (no `apps/api`, schema, route, API, API-client, `packages/ui` or `packages/shared` source change), so the database and curl steps are recorded as not applicable with a justification and a check that the justification still holds. Reports live in `openspec/changes/modal-a11y/reports/` (same deliberate deviation as earlier UI changes). **Copy: no `t()` key or string value changes** (task 1.9 guards it). The PR description says "Refs #146" and MUST NOT say "closes #146".

Isolation rules for every run:

- **Build the packages first.** `apps/web` resolves `@nomadhome/ui` and `@nomadhome/shared` through `dist/`. Run `pnpm --filter @nomadhome/shared build` and `pnpm --filter @nomadhome/ui build` before any web typecheck, unit test or e2e run.
- Never start or reuse a server on port 5173 or on another worktree's port. Use an e2e port at or above 5430 (pick a free one) with `--strictPort`; new specs must not hard-code 5173 (use relative URLs or the configured `baseURL`).
- Database: only `nomadhome_test`, and only if a step needs one (none expected; API calls are mocked). Never touch another database.

## 0. Setup (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm work is on branch `feature/NH-146-modal-a11y` (worktree `../nomadhome-worktrees/NH-146`) created from `origin/main`
- [x] 0.2 `pnpm install --frozen-lockfile` inside the worktree (never reuse another worktree's `node_modules`), build `@nomadhome/shared` and `@nomadhome/ui` dist (`pnpm --filter @nomadhome/shared build && pnpm --filter @nomadhome/ui build`), then verify a clean baseline: `pnpm lint && pnpm typecheck && pnpm test` green before any change
- [ ] 0.3 Capture the baseline: current `Modal.tsx`, `CancelBookingModal.tsx`, `ReviewModal.tsx` (the 1200ms `setTimeout(onSuccess)`), the `Modal` call sites (`rg -n "<Modal|Modal.js" apps/web/src`), `handleModalSuccess` in `MyBookingsPage.tsx` (confirm it is idempotent), `apps/web/src/test/setup.ts`, existing tests and e2e that pin the dialog (`rg -n "role=\"dialog\"|getByRole\(\"dialog\"|\.fixed|aria-modal" apps/web/src apps/web/e2e`) and the e2e helper that uses `dialog.locator(":scope > *").first()`
- [ ] 0.4 Confirm which spec files hard-code `localhost:5173` and record them as known and unchanged

## 1. Red tests (unit, Vitest + Testing Library)

- [x] 1.1 Red, `Modal.test.tsx` (new): `showModal` is called on mount and the dialog is open; the `cancel` event is default-prevented and calls `onClose` once; a click on the dialog element itself calls `onClose`, a click on an element inside the surface does not; `aria-modal="true"` and `aria-labelledby` are present; the surface is the first element child
- [x] 1.2 Red, `Modal.test.tsx`: `document.body.style.overflow` is `hidden` while mounted and the previous inline value is restored on unmount (set a non-empty value first, and an empty one); focus returns to the opener on unmount when it is connected; no throw and no focus call when the opener was removed from the document before unmount
- [x] 1.3 Red, `CancelBookingModal` tests: the reason textarea is `document.activeElement` after render; Escape and backdrop click do not call the parent `onClose` while the cancel mutation is pending, and do call it after a failed submit
- [x] 1.4 Red, `ReviewModal` tests: the first star is `document.activeElement` after render; Escape and backdrop click are no-ops while pending and work after a failed submit; in the success state Escape and backdrop call `onClose`
- [x] 1.5 Red, `ReviewModal` timer (fake timers): in the success state, unmounting before 1200 ms means `onSuccess` is never called when the clock advances; leaving it open calls `onSuccess` exactly once after 1200 ms
- [x] 1.6 Red, `MyBookingsPage` test: opening each modal and closing it by Escape and by backdrop leaves the page usable and unchanged; `handleModalSuccess` called twice clears the modal state and invalidates the query without error (idempotent)
- [x] 1.7 Red, class assertions: update the existing dialog class assertions so the dialog keeps `p-0`, `border-0`, `bg-transparent`, `max-w-[calc(100%-2rem)]` and `backdrop:bg-ink/40`, and the surface keeps `w-full max-w-md rounded-card border-2 border-border bg-surface-raised p-6` with no shadow and no `backdrop-blur`
- [x] 1.8 Red, jsdom stub: add the `HTMLDialogElement.prototype.showModal` and `close` stub to `apps/web/src/test/setup.ts` (`showModal` sets `open`; `close` clears `open` and dispatches `close`) so that the red tests fail for the right reason, not because jsdom lacks the methods
- [x] 1.9 Red, dictionary-unchanged test: snapshot as literals the `t()` keys read by `Modal`, `CancelBookingModal` and `ReviewModal` at baseline and assert they equal `t()` output and that no key was added or removed
- [x] 1.10 Run the new and extended unit tests after the package builds and record that they fail for the right reason (missing `onClose`, missing handlers, no scroll lock; not a typo or a missing jsdom method)

## 2. Red tests (e2e, Playwright, mocked API)

- [x] 2.1 Red: new spec `apps/web/e2e/modal-a11y.spec.ts` (or an extension of `booking-payment-identity.spec.ts`) with mocked API and relative URLs: on open, focus is inside the dialog (textarea for cancel, first star for review); Tab and Shift+Tab cycle only inside the dialog; the page behind is `inert` and not reachable; Escape closes; backdrop click closes; a click inside the surface and a drag from inside the surface out to the backdrop do not close
- [x] 2.2 Red: focus returns to the opener after close; body scroll is locked while open (scroll position does not change on wheel or keyboard) and restored after; after a successful cancel that refetches the list, the page does not throw and focus is left to the browser when the opener is gone
- [x] 2.3 Red: the existing identity assertions still pass at 1440x900 and 360x800 (2px edge, 4px radius, no shadow, `::backdrop` flat with `backdrop-filter: none`, surface as first child, no horizontal overflow at 360, `scrollWidth <= innerWidth`); update any `.fixed` or overlay selectors in the same change without weakening an assertion
- [x] 2.4 Red: scrollbar check: take a 1440 px screenshot with and without the dialog on a scrolling page and record whether content shifts (input for the scrollbar decision in 3.5)
- [x] 2.5 Run the new e2e on an isolated port at or above 5430 and record that it fails before implementation

## 3. Implementation (green)

- [x] 3.1 `apps/web/src/components/Modal.tsx`: native `<dialog ref aria-modal="true" aria-labelledby>` with `showModal()` on mount; required `onClose`; `cancel` handler with `preventDefault()` then `onClose()`; `onClick` closes only when `e.target === e.currentTarget`; classes `p-0 border-0 bg-transparent max-w-[calc(100%-2rem)] backdrop:bg-ink/40` with `backdrop-filter: none`; the surface stays the first child (`w-full max-w-md rounded-card border-2 border-border bg-surface-raised p-6`, `mx-4` removed); no dependency
- [x] 3.2 `Modal.tsx` effects: store `previous = document.body.style.overflow`, set `hidden`, restore `previous` on cleanup; store `document.activeElement` before `showModal()` and on cleanup call `focus()` only when it is an `HTMLElement` that `isConnected`
- [x] 3.3 `CancelBookingModal.tsx`: pass `onClose={isSubmitting ? noop : onClose}` to `Modal`; `data-autofocus` on `textarea#cancel-reason`; no copy change
- [x] 3.4 `ReviewModal.tsx`: pass `onClose={isSubmitting ? noop : onClose}`; `data-autofocus` on the first star; keep Escape and backdrop working in the success state; store the success timer id in a ref and clear it in an unmount cleanup so an early close never fires `onSuccess`; no copy change
- [x] 3.5 Scrollbar decision: if 2.4 shows a content jump at 1440 px, add `scrollbar-gutter: stable` (or equivalent padding compensation) in the same change and re-run the screenshots; otherwise record the shift as accepted in the step 7 report
- [x] 3.6 `apps/web/src/test/setup.ts`: keep the stub from 1.8 and confirm no other test depends on the old `div` structure
- [x] 3.7 Run tasks 1.1 to 1.9 green and re-run the 2.x e2e green on the isolated port

## 4. Review and update existing unit tests (MANDATORY)

- [x] 4.1 Review every test and e2e spec that renders or navigates to the modals (`rg -n "Modal|dialog|aria-modal|\.fixed" apps/web/src apps/web/e2e --glob "*.test.*" --glob "*.spec.ts"`) and update stale structure assumptions without weakening any assertion; do not edit a spec that hard-codes `localhost:5173` and record it as known and unchanged
- [x] 4.2 Confirm `MyBookingsPage.tsx`, `ServerErrorAlert`, `globals.css`, `packages/ui` and `en.ts` are untouched and their tests stay green
- [x] 4.3 Verify, packages built first: `pnpm --filter @nomadhome/shared build && pnpm --filter @nomadhome/ui build && pnpm --filter @nomadhome/web test && pnpm lint && pnpm typecheck` green

## 5. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [x] 5.1 Run targeted tests for the changed files, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` (shared and ui built before web); run the diff-cover check on the changed lines and record totals and coverage
- [x] 5.2 Database state: **not applicable.** Scope is `apps/web`. Justification check: `git diff origin/main --stat` shows no path under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`, and no database is started by any step; if one ever is, it MUST be `nomadhome_test` only. If any such path appears, stop and reopen this task
- [x] 5.3 Write report `openspec/changes/modal-a11y/reports/YYYY-MM-DD-step-5-unit-test-verification.md` with commands, results, coverage and the not-applicable justification

## 6. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [x] 6.1 **Not applicable.** No endpoint, request shape, response shape or status code changes. Justification check: `git diff origin/main --stat -- apps/web/src/api apps/api packages/shared packages/db` is empty. Record the check and the result in the step 7 report instead of a curl report

## 7. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [x] 7.1 Isolated run setup: build `@nomadhome/shared` and `@nomadhome/ui` first; pick a free port at or above 5430, start the web dev server only with `pnpm --filter @nomadhome/web exec vite --port <port> --strictPort`, and run Playwright with a throw-away config kept outside the repo (scratchpad) that spreads the repo config, sets `baseURL` to that port, uses an absolute `testDir` and `reuseExistingServer: false`; never use 5173; API calls are mocked so no API runs and any database is `nomadhome_test` only
- [x] 7.2 Run the new modal spec and `booking-payment-identity.spec.ts` on the isolated port and confirm green, except any failure caused by a pre-existing hard-coded `localhost:5173` URL (record it as pre-existing and unchanged)
- [x] 7.3 Run the whole `pnpm test:e2e` suite on the isolated port (throw-away config) and confirm green; record any failure that is a hard-coded port 5173 URL in an unrelated spec as unchanged by this change
- [x] 7.4 Visual check at 1440x900 and 360x800 for both dialogs (cancel, review including the success state): compare against the baseline for any layout shift, confirm no overflow, no shadow and the flat scrim; save PNGs to `openspec/changes/modal-a11y/reports/screenshots/`; record the scrollbar decision from 3.5
- [x] 7.5 Confirm keyboard use through Playwright key presses (focus inside on open, Tab loop, Escape, focus return) and that no console error is logged in any state
- [x] 7.6 Write report `openspec/changes/modal-a11y/reports/YYYY-MM-DD-step-7-e2e-and-visual-verification.md` with the port used, commands, results, screenshot list, the no-backend-change check from 6.1 and any finding

## 8. Documentation (MANDATORY)

- [x] 8.1 Update `apps/web/DESIGN.md` "Modal frame" (~l.285): drop "there is still no focus trap, ESC, backdrop close or scroll lock" and describe the native `<dialog>` opened with `showModal()`, the flat `ink/40` scrim, focus move, Tab containment, Escape and backdrop close through `onClose`, body scroll lock, focus return and the pending guard; no token or palette change
- [x] 8.2 Update the surface briefs under `apps/web/.impeccable/surfaces/` (for example `src-pages-bookingformpage-tsx.md`, the "Modal accessibility" known-gap line ~l.49 and the `Modal` description ~l.39) and the sidecar `design.json` only where they mention the missing focus trap, ESC, backdrop close or scroll lock; run `rg -n -i "focus trap|no focus|ESC, backdrop|scroll lock" apps/web README.md docs openspec/project.md` and fix non-archive hits; do not edit `openspec/changes/archive/` or `openspec/specs/` (the specs update through the archive sync)
- [ ] 8.3 Record in the PR description: "Refs #146" (not "closes"), the open points from design.md (scrollbar decision, focus return when the opener unmounts, the review timer now cleared) and the rest of the #146 checklist as still open

## 9. Memory notes

- [ ] 9.1 Save engram notes (`mem_save`) for the decisions: native `<dialog>` with `showModal()` instead of a manual trap or a dependency, Escape through the `cancel` event with `preventDefault`, backdrop close by `target === currentTarget`, noop `onClose` while pending, manual scroll lock restoring the previous value, focus return only when the opener is connected, review timer cleared on unmount, jsdom stub in `setup.ts`, build `@nomadhome/shared` and `@nomadhome/ui` before web checks; then `mem_session_summary` before reporting done

## 10. Final verification

- [x] 10.1 `node scripts/check-mvp-scope.mjs` and `openspec validate modal-a11y --strict` pass
- [x] 10.2 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green (shared and ui built first; e2e on the isolated port; caveat as in 7.2 and 7.3)
- [ ] 10.3 `rg -n -i "focus trap|no focus|scroll lock" apps/web openspec/specs` returns no stale "still missing" claim (archived changes excepted)
- [x] 10.4 Confirm no unrelated file changed: `git diff origin/main --stat` lists only the files in design.md "Files in scope" and no path under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`
- [ ] 10.5 PR title states the user story (for example: "Trap focus, close on Escape and backdrop click and lock page scroll in the booking dialogs"), the description links the change-id and says "Refs #146", attaches the 1440 and 360 screenshots and lists the open points from 8.3; commits are Conventional with the (NH-146) suffix, one per reviewable change, no AI attribution

## 11. Checkpoint D (Gate 3)

- [ ] 11.1 Present Checkpoint D: "Implementation complete on branch `feature/NH-146-modal-a11y`. Quality gates: lint, typecheck, tests (coverage X%), build. PR draft is ready. Open PR for review? (yes / iterate / cancel)" and do not open the PR until the user answers yes
