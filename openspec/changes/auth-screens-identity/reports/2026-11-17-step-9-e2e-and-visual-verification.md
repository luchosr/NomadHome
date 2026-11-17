# Step 9: e2e and visual verification (NH-125, auth-screens-identity)

HEAD `72309f5`. Isolated run: Vite on **port 5203** (`--strictPort`), throw-away Playwright config in
`/private/tmp/claude-501/pw125b/` with absolute `testDir`, `reuseExistingServer: false`. Port 5173 and other
worktrees' servers were never used; no API or database runs (every call is mocked). The Vite server was
stopped by PID and port 5203 verified free afterwards.

## 8.1 no-backend-change check (curl not applicable)

`git diff origin/main --stat -- apps/web/src/api apps/api` is empty. The screens call the same
`POST /auth/login`, `POST /auth/register` and `GET /auth/verify` through the unchanged `authApi`.

## 9.2 named specs

`auth-identity`, `auth`, `us-1.1-registration`, `us-1.3-become-host`, `layout`, `focus-hover`:
**46 passed, 0 failed** (5.6 s).

## 9.3 whole suite

76 tests: **75 passed, 1 failed**. The failure is
`us-4.1-booking.spec.ts:83 creates booking and shows success page after payment`. Cause (verified in the spec):
the mocked checkout response hard-codes `url: http://localhost:5173/booking/success?...`, so the test only
passes when the dev server is on port 5173, which this isolated run must not use. It does not touch the auth
screens or any file in this change. Re-run twice alone: same result. This is a pre-existing port coupling of that
spec, not a regression; 9.3 and 12.2 are left unticked for the orchestrator to decide (options: accept as
environment artefact, or fix the spec to use a relative/`baseURL` URL in a separate change).

## 9.4 visual check (screenshots in `screenshots/`, 27 files, 852 KB)

States at 1440x900 and 360x800 (`-1440` / `-360`), Register also at 360x640 (`-360x640`): login empty, login
field errors, login long server error, register empty, register field errors, register duplicate email (409),
verify pending, success, error, plus `become-host-errors` at both widths and
`register-focus-footer-link-1440.png`. Grayscale pass: `verify-{pending,success,error}-360-grayscale.png`.

Findings (full-page screenshots read by eye, plus measured `scrollWidth`): no horizontal overflow in any of the
23 captures (scrollWidth equals innerWidth); band and panel share the 32rem column edge; tile glyphs (three
squares, check, cross) read cleanly on the 32 grid; in grayscale the three verify states stay distinguishable
(dashed panel and dashed tile with three squares on light stone; solid dark filled tile with check on mid grey
panel; paper panel with outlined tile and cross); `BecomeHostPage` reads correctly with the restyled wrappers.

## 9.5 keyboard and console

- Register Tab order (1440): email, password, confirm password, submit "Create account" (once the form is
  valid), "Log in" link, then leaves the page. Matches design.
- Focus ring: submit 3px solid rgb(30, 30, 30) offset 2px; footer link 3px solid rgb(30, 30, 30).
- Enter in the login form submits exactly once (1 POST observed).
- Console errors on the three pages: none from the app (no `pageerror`, no React warnings). The only
  `console.error` entries are the browser's own "Failed to load resource" lines for the deliberately mocked
  401, 409 and 500 responses; pending, success and the empty and field-error states log nothing.

## Result

9.2 green, 9.4 and 9.5 done, 9.3 has one environment-related failure outside this change (above).
