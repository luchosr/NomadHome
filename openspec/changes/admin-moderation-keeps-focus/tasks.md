# Tasks: admin-moderation-keeps-focus

## 1. Red tests (QA)

- [ ] 1.1 `packages/ui/src/components/button.test.tsx`: assert `primary`, `secondary` and `destructive` carry `aria-disabled:border-dashed`, `aria-disabled:border-border-muted`, `aria-disabled:bg-surface-inset` and `aria-disabled:text-fg-subtle`; `tertiary` carries `aria-disabled:border-transparent`, `aria-disabled:bg-transparent` and `aria-disabled:line-through`; every variant carries `aria-disabled:cursor-default` and `aria-disabled:active:translate-y-0` and no `aria-disabled:pointer-events-none`. Keep the existing `disabled` assertions unchanged
- [ ] 1.2 `apps/web/src/pages/AdminUsersPage.test.tsx`, block "pending and error feedback (NH-146)": replace `toBeDisabled` with `toHaveAttribute("aria-disabled", "true")` plus no `disabled` attribute, and every `toBeEnabled` with `not.toHaveAttribute("aria-disabled", "true")` (`toBeEnabled` would pass vacuously). Keep the one-request assertion and add Enter and Space while pending
- [ ] 1.3 `apps/web/src/pages/AdminListingsPage.test.tsx`: the same replacements in its pending and error feedback block
- [ ] 1.4 Both page test files: with the button focused, assert it is `document.activeElement` while pending, after failure and after success; after success with a flipped list mock, assert the opposite-action button is the same DOM node. Cover the table and the card list
- [ ] 1.5 Run the three files and confirm the new assertions fail for the expected reason

## 2. Implementation (Frontend)

- [ ] 2.1 `packages/ui/src/components/button.tsx`: add the `aria-disabled:` utilities to `PANEL` (dashed, muted edge, stone, subtle ink), to the `tertiary` variant (transparent edge and fill, line-through) and to the base (`aria-disabled:cursor-default aria-disabled:active:translate-y-0`); update the header comment. Keep `disabled:pointer-events-none`; add no `aria-disabled:pointer-events-none`
- [ ] 2.2 `apps/web/src/pages/AdminUsersPage.tsx`: in both `renderAction` branches replace `disabled={pendingId === user.id}` with `aria-disabled={pendingId === user.id}`. Keep both branches as an unkeyed `Button` at the same position; add no focus code
- [ ] 2.3 `apps/web/src/pages/AdminListingsPage.tsx`: the same for `listing.id`
- [ ] 2.4 Confirm no other source passes `aria-disabled` to `Button` or `buttonVariants` (`rg -n "aria-disabled" apps packages`)
- [ ] 2.5 Confirm these guards stay green without edits: `packages/ui/src/index.test.ts`, `packages/ui/src/contrast.test.ts`, `apps/web/src/buttonLinkAudit.test.ts`, the `apps/web/src/test/buttonLink.ts` consumers, and the native `disabled` tests of other components

## 3. E2E (QA)

- [ ] 3.1 `apps/web/e2e/us-8.1-admin-users.spec.ts`: for Disable and Re-enable, Enter and Space, at 1280x720 (table) and 360x800 (cards), hold the PATCH response and assert the button is focused, has `aria-disabled="true"` and no `disabled` attribute, and a repeated Enter and Space send no second request; release with 200 and assert the opposite-action button is focused and is the same element handle
- [ ] 3.2 Same file: failure (HTTP 500) case in both layouts, asserting the alert, the same button focused and no `aria-disabled="true"`
- [ ] 3.3 Same file: with the response held, compare computed border style and color, background, text color and cursor of the pending button at rest, on hover and on mouse down (no transform shift); a raw mouse click keeps focus and sends no request. Check Disable (destructive) and Re-enable (secondary)
- [ ] 3.4 `apps/web/e2e/us-8.2-admin-listings.spec.ts`: repeat 3.1 and 3.2 for listings
- [ ] 3.5 Confirm the existing `toBeEnabled` assertions in both specs, `apps/web/e2e/admin-identity.spec.ts`, `apps/web/e2e/button-link-variants.spec.ts` and `apps/web/e2e/modal-a11y.spec.ts` stay green without edits

## 4. Docs and verification

- [ ] 4.1 `apps/web/DESIGN.md`: in the "Disabled" button bullet, document that `aria-disabled="true"` looks the same and stays focusable; in the admin "Moderation actions" bullet, replace the stale "no disabled-while-pending state ... no error handling" sentence with the pending, error and focus behaviour
- [ ] 4.2 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build` and `openspec validate admin-moderation-keeps-focus --strict`
