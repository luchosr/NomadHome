# Tasks: add-host-dashboard-ui

## 1. Shared strings

- [x] 1.1 Add `host.*` string keys to `packages/shared/src/strings/en.ts`

## 2. Frontend — API clients

- [x] 2.1 Add `hostApi` in `apps/web/src/api/host.ts` — `listMine()`, `create()`, `update()`, `getOne()`, `publish()`, `unpublish()`
- [x] 2.2 Add `photoApi` in `apps/web/src/api/photos.ts` — `getUploadUrl()`, `register()`, `list()`, `deletePhoto()`
- [x] 2.3 Add `availabilityApi` in `apps/web/src/api/availability.ts` — `block()`, `list()`, `deleteBlock()`
- [x] 2.4 Add `hostBookingsApi.upcoming()` in `apps/web/src/api/bookings.ts`

## 3. Frontend — pages

- [x] 3.1 `HostListingsPage` (`/host/listings`) — listings table with status badges, "New listing" button, "Edit" links
- [x] 3.2 `CreateListingPage` (`/host/listings/new`) — RHF form with all listing fields + amenity checkboxes; POST on submit
- [x] 3.3 `EditListingPage` (`/host/listings/:id/edit`) — pre-filled form + publish/unpublish toggle + photo section + availability section
- [x] 3.4 `HostUpcomingPage` (`/host/upcoming`) — table of upcoming bookings
- [x] 3.5 Update `router.tsx` — replace `/host/*` placeholder with real routes (all RoleGuard host + ProtectedRoute)

## 4. Tests

- [x] 4.1 `HostListingsPage.test.tsx` — renders listing titles and edit links
- [x] 4.2 `CreateListingPage.test.tsx` — submits form and calls create API
- [x] 4.3 `EditListingPage.test.tsx` — renders pre-filled form, calls update on save, calls publish
- [x] 4.4 `HostUpcomingPage.test.tsx` — renders upcoming bookings table
