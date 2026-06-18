# Tasks: add-auth-ui

## 1. Dependencies & config

- [x] 1.1 Add `react-hook-form` and `@hookform/resolvers` to `apps/web/package.json`
- [x] 1.2 Add Vite dev proxy (`/api` → `http://localhost:3000`) to `apps/web/vite.config.ts`

## 2. Shared strings

- [x] 2.1 Add `auth.*` and `nav.*` UI strings to `packages/shared/src/strings/en.ts`

## 3. API client

- [x] 3.1 `apps/web/src/api/client.ts` — base fetch with auth header + token injection
- [x] 3.2 `apps/web/src/api/auth.ts` — register, login, logout, me, refresh wrappers

## 4. Auth context

- [x] 4.1 `apps/web/src/contexts/auth.tsx` — AuthProvider + useAuth hook

## 5. Components

- [x] 5.1 `apps/web/src/components/ProtectedRoute.tsx`
- [x] 5.2 `apps/web/src/components/RoleGuard.tsx`
- [x] 5.3 `apps/web/src/components/Layout.tsx`

## 6. Pages

- [x] 6.1 `apps/web/src/pages/LoginPage.tsx`
- [x] 6.2 `apps/web/src/pages/RegisterPage.tsx`
- [x] 6.3 `apps/web/src/pages/HomePage.tsx`
- [x] 6.4 `apps/web/src/pages/NotFoundPage.tsx`

## 7. Router

- [x] 7.1 Update `apps/web/src/router.tsx` with real routes

## 8. Tests

- [x] 8.1 `apps/web/src/pages/LoginPage.test.tsx`
- [x] 8.2 `apps/web/src/pages/RegisterPage.test.tsx`
- [x] 8.3 `apps/web/src/components/ProtectedRoute.test.tsx`
