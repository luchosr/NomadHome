# Tasks: add-design-foundation

## 1. Tokens

- [x] 1.1 Map all design tokens (color scales, semantic roles, fonts, type scale, spacing, radii, shadows, motion) into `theme.extend` in `packages/config/tailwind.preset.js`

## 2. Base styles & fonts

- [x] 2.1 In `packages/ui/src/styles/globals.css`: import brand fonts, declare token CSS custom properties, add base element styles (sand canvas, serif headings, focus ring), keep `@tailwind` directives
- [x] 2.2 Vendor brand logo SVGs into `packages/ui/src/assets/`

## 3. Primitives

- [x] 3.1 Restyle `Button` with `primary` / `secondary` / `tertiary` / `destructive` variants (default `primary`)
- [x] 3.2 Add `Badge`, `Input`, `Card` components in `packages/ui/src/components/`
- [x] 3.3 Export new primitives from `packages/ui/src/index.ts`

## 4. Tests

- [x] 4.1 Vitest: variant test for `Button`; render/smoke tests for `Badge`, `Input`, `Card`; keep existing button test green

## 5. Verify

- [x] 5.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green
- [x] 5.2 `openspec validate add-design-foundation --strict` and `node scripts/check-mvp-scope.mjs` pass

## 6. App wiring

- [x] 6.1 `apps/web/src/index.css` imports `@nomadhome/ui/styles/globals.css` (export added to UI package) so the app consumes the foundation
