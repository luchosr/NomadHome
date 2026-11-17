# Step 8 Report - Manual Endpoint Testing with curl

- Date: 2026-11-17
- Change: remove-synthetic-landing-content (NH-121)
- Agent: QA

## Safety note

Only `nomadhome_test` was used (database name confirmed before the seed and the
cleanup). The API was started with explicit env overrides on free port 3099 (not the
`.env`-loading `dev` script) and stopped afterwards by PID:

```
cd apps/api
PORT=3099 DATABASE_URL=postgresql://nomadhome:nomadhome@localhost:5432/nomadhome_test \
  JWT_SECRET=0123456789abcdef0123456789abcdef pnpm exec tsx src/index.ts
# -> [api] NomadHome API listening  on port 3099
```

Route: `apps/api/src/app.ts` mounts `app.use("/search", searchRouter)` and the router
has `GET /`, so the endpoint is `GET /search` (no `/api` prefix; the task wording
`/api/search` does not apply). `pageSize` is validated by `packages/shared/src/schemas/search.ts`
as integer 1..100 (default 20), `page` integer >= 1.

## 8.1 Empty database (baseline: all counts 0)

`curl -s -w "\nHTTP %{http_code}\n" "http://localhost:3099/search?page=1&pageSize=3"`

```
{"data":[],"pagination":{"total":0,"page":1,"pageSize":3,"hasMore":false}}
HTTP 200
```

Non-existent city `?city=Nowhereville&page=1&pageSize=3` -> same body, `HTTP 200`
(empty `data`, `total: 0`).

## 8.2 Invalid parameters (documented actual behavior, API unchanged)

| Query                 | HTTP | Body                                                                                                             |
| --------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| `page=1&pageSize=0`   | 400  | `{"error":"validation","issues":{...,"fieldErrors":{"pageSize":["Number must be greater than or equal to 1"]}}}` |
| `page=1&pageSize=101` | 400  | `... "pageSize":["Number must be less than or equal to 100"]`                                                    |
| `page=0&pageSize=3`   | 400  | `... "page":["Number must be greater than or equal to 1"]`                                                       |
| `page=1&pageSize=abc` | 400  | `... "pageSize":["Expected number, received nan"]`                                                               |

Invalid values are rejected (not clamped), so the landing's `pageSize=3` is always valid.

## 8.3 Seed (nomadhome_test only, SQL through `docker exec ... psql`)

Rows added (all ids prefixed `qa121-`): User `qa121-host` + HostProfile; Amenity `wifi`;
Listings `qa121-l1` "QA Oldest Loft" (createdAt 2026-01-01), `qa121-l2` "QA Second Studio"
(01-02), `qa121-l3` "QA Third Desk" (WORKSPACE, 01-03), `qa121-l4` "QA Newest Villa" (01-04)
all PUBLISHED in Qaville/PT/EUR; `qa121-l5` "QA Draft Hidden" (DRAFT, 01-05); ListingPhoto
`qa121-p1` (`/uploads/qa121.jpg`) and ListingAmenity (`qa121-l4`, wifi). Counts after seed:
`nomadhome_test|5|1|1|1|1` (Listing, ListingPhoto, ListingAmenity, Amenity, User).

`curl -s -w "\nHTTP %{http_code}\n" "http://localhost:3099/search?page=1&pageSize=3"`

```
{"data":[{"id":"qa121-l4","title":"QA Newest Villa","type":"PROPERTY","city":"Qaville","country":"PT","nightlyRateCents":9000,"currency":"EUR","totalCents":9000,"primaryPhotoUrl":"/uploads/qa121.jpg","amenities":["wifi"]},{"id":"qa121-l3","title":"QA Third Desk","type":"WORKSPACE",...,"nightlyRateCents":2500,"currency":"EUR",...,"primaryPhotoUrl":null,"amenities":[]},{"id":"qa121-l2","title":"QA Second Studio",...,"nightlyRateCents":8000,...,"amenities":[]}],"pagination":{"total":4,"page":1,"pageSize":3,"hasMore":true}}
HTTP 200
```

- HTTP 200 and `{ data, pagination }` envelope: pass.
- 3 items for 4 published listings (the DRAFT is excluded; `total: 4`, `hasMore: true`): pass.
- Newest first (l4, l3, l2 by createdAt desc): pass.
- Fields present on each item: `id, title, type, city, country, nightlyRateCents, currency, primaryPhotoUrl`
  (plus `totalCents` and `amenities`): pass. Currency returned: `EUR`.
- `page=2&pageSize=3` -> `HTTP 200`, one item (`qa121-l1`), `hasMore: false`.
- Listing without photo returns `primaryPhotoUrl: null`; without amenities `amenities: []`.

## 8.4 Cleanup and counts

Deleted in FK order (ListingAmenity, ListingPhoto, Listing, Amenity `wifi`, HostProfile, User) with
`DELETE 1/1/5/1/1/1`. Counts afterwards: `nomadhome_test|0|0|0|0|0`, equal to the step 7
baseline. API stopped by the PIDs started here (the `tsx` process and its launcher); `lsof -i :3099` is empty.
