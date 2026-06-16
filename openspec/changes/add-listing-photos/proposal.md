# Proposal: add-listing-photos

## Why

Hosts can create draft listings (NH-009) but cannot attach photos. Without photos a
listing cannot be published (the publish-time gate requires ≥1 `ListingPhoto`). This
change adds the photo upload and management capability, resolving the `[OPEN]`
photo-storage decision from `openspec/project.md §8` in favour of Cloudflare R2.

Ticket: NH-010.

## What Changes

- A `ListingPhoto` model (`id`, `listingId`, `url`, `position`, `createdAt`) with a
  composite UNIQUE on `(listingId, position)`.
- A **signed-upload flow**: the API issues a short-lived R2 presigned PUT URL; the
  client uploads the file directly to R2; the client then registers the resulting
  object key with the API. No file bytes pass through the API server.
- Five host-only endpoints (all require `auth` + `host` role + listing ownership):
  - `POST /listings/:id/photos/upload-url` — issue presigned PUT URL
  - `POST /listings/:id/photos` — register an uploaded photo
  - `GET  /listings/:id/photos` — list photos ordered by position
  - `PATCH /listings/:id/photos/:photoId/position` — change a photo's position
  - `DELETE /listings/:id/photos/:photoId` — remove a photo
- Five new environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- ADR in `design.md` closing the photo-storage open decision.
- `openspec/project.md §8` row removed; `docs/data-model.md §9` open-decision entry
  resolved.

## Impact

- **Capabilities affected**: `listings`.
- **Breaking changes**: none — new endpoints only.
- **Migration required**: yes — adds `ListingPhoto` table.
- **Out of scope**: publish/unpublish gate (NH-011), guest-facing photo display,
  image resizing/CDN optimisation, `storageProvider` column (single-provider MVP).

## Risks & Mitigations

| Risk                                                                          | Likelihood | Mitigation                                                                                                                        |
| ----------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Client uploads to R2 but never calls the register endpoint (orphaned objects) | Low        | Acceptable for MVP; a background cleanup job is post-MVP.                                                                         |
| Position collision on concurrent photo uploads                                | Low        | DB UNIQUE `(listingId, position)` surfaces as 409; client can retry with a different position.                                    |
| R2 credentials misconfigured in CI                                            | Medium     | Storage adapter is injected as a dependency; tests mock it. R2 env vars are optional (tests skip presigned-URL path when absent). |

## Rollout

Big bang — no feature flag. Integration tests mock the R2 presigned-URL call;
photo registration and delete hit the real DB in CI as with other DB-backed tests.
