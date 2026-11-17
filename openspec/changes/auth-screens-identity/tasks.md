# Tasks: auth-screens-identity

Change-id: `auth-screens-identity`. Ticket: NH-125 (#125). Branch:
`feature/NH-125-auth-screens-identity` (worktree
`../nomadhome-worktrees/NH-125`). Order follows TDD (red, green, refactor,
verify). `openspec/config.yaml` defines no extra mandatory steps; the mandatory
steps from `docs/openspec-tasks-mandatory-steps.md` apply. This change is
frontend only (no backend, schema, route or API change), so the database and
curl steps are recorded as not applicable with a justification and a check that
the justification still holds. Reports live in
`openspec/changes/auth-screens-identity/reports/` (same deliberate deviation as
earlier UI changes: a `specs/<change>/` folder without a `spec.md` would break
`openspec validate`). The PR description says "Refs #125; closes #125".

Isolation rules for every run: never start or reuse a server on port 5173 or on
another worktree's port; pick a free port first; no database is started.

## 0. Setup (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm work is on branch `feature/NH-125-auth-screens-identity` (worktree `../nomadhome-worktrees/NH-125`) created from `origin/main`
- [x] 0.2 `pnpm install` inside the worktree, then verify a clean baseline: `pnpm lint && pnpm typecheck && pnpm test` green before any change
- [x] 0.3 Capture the baseline: `rg -n "FormField|ServerErrorAlert" apps/web/src` (expected users: LoginPage, RegisterPage, BecomeHostPage) and the current `role="alert"` and text queries in `apps/web/src/pages/{Login,Register,VerifyEmail,BecomeHost}Page.test.tsx` and `apps/web/e2e/{auth,us-1.1-registration,us-1.3-become-host}.spec.ts`

## 1. Red tests (unit, Vitest + Testing Library)

- [x] 1.1 Red: add `apps/web/src/components/AuthShell.test.tsx`: the title renders as the single `h1` with the given id, the subtitle renders when passed, the band has the ember background class and ink text, the panel has the paper background and a 2px ink border, the footer slot renders in the stone row, the shell renders no `main` element
- [x] 1.2 Red: add `apps/web/src/components/FormField.test.tsx`: label is linked to the control, no error element when `error` is empty, the error element has id `errorIdFor(id)`, carries the 4px left danger border and bold small danger text classes, is not `role="alert"`
- [x] 1.3 Red: add `apps/web/src/components/ServerErrorAlert.test.tsx`: returns nothing for `null` or empty, renders exactly one `role="alert"` with the message, has the solid danger border, tint fill and a decorative marker tile (`aria-hidden`), keeps the optional `className`
- [x] 1.4 Red: extend `LoginPage.test.tsx`: the page title is an `h1` and names the form (`getByRole("form", { name })`); after an empty submit the email input has `aria-invalid="true"` and `aria-describedby` pointing to the visible error text, and that error is not an alert; after the fix the description link is gone; the route link to `/register` is present and underlined; field `autocomplete` values are `email` and `current-password`; a rejected login still yields exactly one `role="alert"` with the same text
- [x] 1.5 Red: extend `RegisterPage.test.tsx`: same structure checks; autocomplete values (`email`, `new-password` twice); mismatch message is linked to the confirm password input; submit stays disabled until valid; route link to `/login` is present and underlined; the request payload is unchanged (`register(email, password)`)
- [x] 1.6 Red: extend `VerifyEmailPage.test.tsx`: each state has exactly one `h1` (pending included, using the existing pending string); `data-state` is `pending`, `success`, `error`; pending is a busy status and its tile carries the dashed class; success exposes the filled tile and the link to `/login`; error is `role="alert"`, carries the outlined danger tile and the link to `/register`; the request is made once per token and not at all without a token (existing assertions kept)
- [x] 1.7 Red: add a negative-content test (can live in the page tests): none of the three pages renders text matching a password-visibility toggle, password-recovery link or alternative sign-in provider, and the `auth` and `identity.verify_email` dictionary groups have the same keys and values as at baseline (snapshot the baseline values in the test as literals)
- [x] 1.8 Run the new tests and record that they fail for the right reason (missing structure and attributes, not a typo)

## 2. Red tests (e2e, Playwright, mocked API)

- [x] 2.1 Red: add `apps/web/e2e/auth-identity.spec.ts` patterned on `layout.spec.ts` (mock `http://localhost:3000/auth/*`; helpers for no-overflow, inside-viewport, screenshot attach) at 1440x900 and 360x800: login band background `rgb(230, 95, 53)` and text ink, panel background paper with 2px border, `h1` font family contains Overpass
- [x] 2.2 Red: field-error computed style at both viewports: after an empty login submit the error has `border-left-width: 4px`, solid, danger colour `rgb(155, 28, 46)`, font size 14px, weight 700; the nearest opaque ancestor background of every input, label and error is not ember or sage
- [x] 2.3 Red: form-level error: mock a 401 with a long message; the alert has `border-style: solid`, danger border colour, tint background `rgb(248, 225, 224)`, sits inside the panel above the submit, and there is no horizontal overflow at 360 px
- [x] 2.4 Red: VerifyEmail three states: pending (delay the mocked `/auth/verify` response) has a dashed border on panel and tile and stone background; success has ember background, solid ink border, ink tile fill; error (500 and also the no-token URL) has paper background, solid ink border, danger tile border; each state has exactly one `h1`; no overflow at 360 px in all three
- [x] 2.5 Red: keyboard: Tab order on Register is email, password, confirm password, submit (once enabled), log-in link; the focused submit and link show the 3px ink outline; the footer link is underlined and at least 44px tall; the primary action link on the verify success state has ink background and paper text
- [x] 2.6 Red: first viewport at 360x800: login title, both fields and the submit are visible without scrolling
- [x] 2.7 Run the new e2e spec against an isolated server (see 9.1) and record that it fails before implementation

## 3. Shared components (green)

- [x] 3.1 Add `apps/web/src/components/AuthShell.tsx` per design.md D1 and D2: props `title`, `titleId`, optional `subtitle`, `children`, optional `footer`; ember band, 32rem column, paper panel with 2px ink edge and 4px radius, stone footer row with a 2px ink top rule; no `main`, no new `t()` call inside (strings come from the pages)
- [x] 3.2 Restyle `apps/web/src/components/FormField.tsx` per D3 and D4: bold ink label, error with id via exported `errorIdFor(id)`, 4px solid danger left rule, 14px bold danger text, not an alert; props unchanged
- [x] 3.3 Restyle `apps/web/src/components/ServerErrorAlert.tsx` per D5: solid danger edge, tint fill, filled marker tile with a paper mark (inline SVG, `aria-hidden`), `break-words`; props and return-null behaviour unchanged
- [x] 3.4 Run tasks 1.1 to 1.3 green

## 4. Login and Register (green)

- [ ] 4.1 `LoginPage.tsx`: wrap in `AuthShell` with the existing title and subtitle keys, name the form with `aria-labelledby`, add `aria-required`, `autoCapitalize="none"`, `spellCheck={false}` on email and conditional `aria-describedby`, move the route link into the footer row (underlined, bold, 44px target); keep every handler, effect, redirect and `t()` key as is
- [ ] 4.2 `RegisterPage.tsx`: same treatment for its three fields; keep `useRegister`, the `disabled={isSubmitting || !isValid}` rule and the payload untouched
- [ ] 4.3 Run tasks 1.4, 1.5 and the shared parts of 1.7 green

## 5. VerifyEmail (green)

- [ ] 5.1 `VerifyEmailPage.tsx`: replace the three bare blocks with three sign panels per design.md D7 (stone dashed pending, ember success, paper error), a local tile component with authored 32-grid glyphs (three squares, check, cross; square caps, mitred joins, no icon library), one `h1` per state, `data-state`, polite persistent live region, `role="alert"` on the error panel, primary action links styled as the ink primary button (mirrors `Button`); keep the `useEffect`, the `called` ref, the token handling and every `t()` key
- [ ] 5.2 Run task 1.6 green; run 2.x e2e green against the isolated server

## 6. Review and update existing unit tests (MANDATORY)

- [ ] 6.1 Review every test touching `FormField`, `ServerErrorAlert`, `LoginPage`, `RegisterPage`, `VerifyEmailPage`, `BecomeHostPage` and the e2e specs `auth.spec.ts`, `us-1.1-registration.spec.ts`, `us-1.3-become-host.spec.ts`; update stale class or text assumptions without weakening any assertion; confirm queries that match by text still resolve to one node now that title and subtitle share a band
- [ ] 6.2 Confirm `BecomeHostPage.test.tsx` passes unchanged in behaviour (its `findByRole("alert")` assertions keep matching one element); record the visual diff of `BecomeHostPage` in the report (design.md D8)
- [ ] 6.3 Verify: `pnpm --filter @nomadhome/web test && pnpm lint && pnpm typecheck` green

## 7. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Run targeted tests for the changed files, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; record totals
- [ ] 7.2 Database state: **not applicable.** The change is frontend only. Justification check: `git diff origin/main --stat` shows no path under `apps/api/`, `packages/db/` or `packages/shared/src/schemas/`, and no database is started by any step. If any such path appears, stop and reopen this task
- [ ] 7.3 Write report `openspec/changes/auth-screens-identity/reports/YYYY-MM-DD-step-7-unit-test-verification.md` with commands, results and the not-applicable justification for the database step

## 8. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [ ] 8.1 **Not applicable.** No endpoint, request shape, response shape, status code or API client changes; the screens call the same `POST /auth/login`, `POST /auth/register` and `GET /auth/verify` through the unchanged `authApi`. Justification check: `git diff origin/main --stat -- apps/web/src/api apps/api` is empty. Record the check and the result in the step 9 report instead of a curl report

## 9. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [ ] 9.1 Isolated run setup: pick a free port (`node -e "require('net').createServer().listen(0,function(){console.log(this.address().port);this.close()})"`), start the web dev server only with `pnpm --filter @nomadhome/web exec vite --port <port> --strictPort`, and run Playwright with a throw-away config kept outside the repo (scratchpad) that spreads the repo config, sets `baseURL` to that port, uses an absolute `testDir` and `reuseExistingServer: false`; never use 5173; API calls are mocked so no API or database runs
- [ ] 9.2 Run `apps/web/e2e/auth-identity.spec.ts`, `auth.spec.ts`, `us-1.1-registration.spec.ts`, `us-1.3-become-host.spec.ts`, `layout.spec.ts` and `focus-hover.spec.ts` on the isolated port and confirm green
- [ ] 9.3 Run the whole `pnpm test:e2e` suite on the isolated port (throw-away config) and confirm green
- [ ] 9.4 Visual check with Playwright at 1440x900 and 360x800 (and 360x640 for Register): login empty, login with field errors, login with a long server error, register empty, register with field errors and a duplicate-email error, verify pending, verify success, verify error; save PNGs to `openspec/changes/auth-screens-identity/reports/screenshots/`; confirm band and panel alignment, no overflow, tile glyphs read on the 32 grid, the three verify states are distinguishable in grayscale (also capture one grayscale pass), and `BecomeHostPage` still reads correctly with the restyled wrappers
- [ ] 9.5 Confirm keyboard use by hand through Playwright key presses (Tab order, Enter submits, focus ring visible on ember, paper and stone surfaces) and that no console error is logged on any of the three pages
- [ ] 9.6 Write report `openspec/changes/auth-screens-identity/reports/YYYY-MM-DD-step-9-e2e-and-visual-verification.md` with the port used, commands, results, screenshot list, the no-backend-change check from 8.1 and any finding

## 10. Documentation (MANDATORY)

- [ ] 10.1 Write the surface brief `apps/web/.impeccable/surfaces/src-pages-loginpage-tsx.md` (frontmatter `version: 1`, `slug: "src-pages-loginpage-tsx"`, `primary_target: "src/pages/LoginPage.tsx"`, `related_targets: ["src/pages/RegisterPage.tsx", "src/pages/VerifyEmailPage.tsx"]`) in the format of `src-pages-homepage-tsx.md`: scope and mode (Operate, inheriting the landing world), audience, job, action, proof (none invented), constraints, direction contract (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH), palette note, unresolved decisions (decisions D1 to D9 summarised)
- [ ] 10.2 Update `apps/web/DESIGN.md`: add an "Auth screens" subsection under Components (title band, form panel, footer row, field error, form-level error, verify state signs with the dashed, filled and outlined tile rule), add the matching Do and Don't lines, and note the wrapper restyle that `BecomeHostPage` inherits; no token or palette change; run `rg -n "Login|Register|VerifyEmail|auth" apps/web/DESIGN.md apps/web/PRODUCT.md` and fix any stale description
- [ ] 10.3 `rg -n -i "auth screen|login page|register page" README.md docs apps/web/*.md apps/web/.impeccable openspec/project.md` and update remaining non-archive mentions that contradict the shipped look; do not edit `openspec/changes/archive/` or `openspec/specs/`
- [ ] 10.4 Record in the PR description: the `BecomeHostPage` inheritance and the follow-ups from design.md (persistent password-rule hint with enabling the Register submit; describing `BecomeHostPage` errors for assistive tech)

## 11. Memory notes

- [ ] 11.1 Save engram notes (`mem_save`) for the decisions: title band over one paper panel (not split), field errors left-barred and not alerts, form-level error panel with filled tile, verify states dashed/solid-filled/outlined with ember success, wrappers restyled in place; then `mem_session_summary` before reporting done

## 12. Final verification

- [ ] 12.1 `node scripts/check-mvp-scope.mjs` and `openspec validate auth-screens-identity --strict` pass
- [ ] 12.2 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green (e2e on the isolated port)
- [ ] 12.3 `rg -n "text-fg-subtle|text-fg-muted|rounded-xl|rounded-full|bg-danger-bg|text-danger" apps/web/src/pages/{LoginPage,RegisterPage,VerifyEmailPage}.tsx` returns only intended hits (none expected in the pages; danger tokens live in the two wrappers and the verify error tile)
- [ ] 12.4 Confirm no unrelated file changed: `git diff origin/main --stat` lists only the files in design.md "Files in scope"
- [ ] 12.5 PR title states the user story (for example: "Let a visitor sign up, log in and verify their email on screens that look like the rest of NomadHome"), the description links the change-id and says "Refs #125; closes #125", and attaches the 1440 and 360 screenshots; commits are Conventional with the (NH-125) suffix, one per reviewable change, no AI attribution
