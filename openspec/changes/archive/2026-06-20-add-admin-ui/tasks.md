# Tasks: add-admin-ui

## 1. Backend — admin list endpoints

- [x] 1.1 Add `listUsers(page, limit)` to `AdminRepository`
- [x] 1.2 Add `listListings(page, limit)` to `AdminRepository`
- [x] 1.3 Add `listUsers` and `listListings` methods to `AdminService`
- [x] 1.4 Add `listUsers` and `listListings` handlers to `AdminModerationController`
- [x] 1.5 Mount `GET /users` and `GET /listings` on `adminRouter`
- [x] 1.6 Integration tests for both new endpoints

## 2. Shared strings

- [x] 2.1 Add `admin.*` string keys to `packages/shared/src/strings/en.ts`

## 3. Frontend — API client

- [x] 3.1 Add `adminApi` in `apps/web/src/api/admin.ts`

## 4. Frontend — pages

- [x] 4.1 `AdminUsersPage` (`/admin/users`)
- [x] 4.2 `AdminListingsPage` (`/admin/listings`)
- [x] 4.3 Update `router.tsx` — replace `/admin/*` placeholder with real routes

## 5. Tests

- [x] 5.1 Backend: integration tests for `GET /admin/users` and `GET /admin/listings`
- [x] 5.2 `AdminUsersPage.test.tsx`
- [x] 5.3 `AdminListingsPage.test.tsx`
