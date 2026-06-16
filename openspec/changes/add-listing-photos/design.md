# Design: add-listing-photos

## ADR-001: Photo storage backend — Cloudflare R2

**Decision**: Use Cloudflare R2 as the sole photo storage backend for MVP.

**Context**: `openspec/project.md §8` listed this as an `[OPEN]` decision with three
candidates: Cloudflare R2, AWS S3, and Supabase Storage. The project recommendation
was R2 (zero egress fees, S3-compatible API).

**Decision driver**: User confirmed R2 (NH-010 planning, 2026-06-17).

**Trade-offs accepted**:

| Factor            | R2             | S3             | Supabase Storage |
| ----------------- | -------------- | -------------- | ---------------- |
| Egress fees       | $0             | ~$0.09/GB      | $0 (limited)     |
| S3-compat API     | Yes            | Native         | Partial          |
| Ecosystem tooling | AWS SDK (full) | AWS SDK (full) | Supabase JS only |
| Vendor lock-in    | Cloudflare     | AWS            | Supabase         |

R2 wins on cost profile for an image-heavy app and reuses the AWS SDK, which is
already the de-facto standard.

**Consequences**:

- The `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` packages are added
  to `apps/api`. They're pointed at the R2 endpoint
  `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.
- No `storageProvider` column on `ListingPhoto` — single-provider MVP. If a second
  provider is needed post-MVP, add the column in a migration + migrate existing rows.
- Object deletion from R2 on photo delete is deferred to post-MVP (a lifecycle rule
  or background job). The `ListingPhoto` DB record is the source of truth for what
  is "live"; orphaned objects in R2 are inert.

## Signed-upload flow rationale

File bytes never route through the API server, keeping API memory/CPU flat regardless
of photo size or concurrency. The trade-off is a two-step client flow (get URL, then
register), but this is the industry standard (Cloudinary, Vercel Blob, S3 multipart
all use it).

## Position conflict handling

`(listingId, position)` is a DB-level UNIQUE constraint. On conflict the DB raises a
unique-violation error which the service maps to a `PhotoPositionConflictError` and
the controller returns 409. Clients should treat 409 as "pick a different position or
re-fetch current positions first."
