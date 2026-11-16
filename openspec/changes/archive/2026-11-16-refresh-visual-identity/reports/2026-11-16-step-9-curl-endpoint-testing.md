# Step 9 Report - Manual Endpoint Testing with curl

- Date: 2026-11-16
- Change: refresh-visual-identity (NH-118)
- Agent: QA

## Safety note

The tasks mention the "dev database"; it was NOT used. Everything ran against
the disposable `nomadhome_test` database (confirmed `select current_database()`
-> `nomadhome_test`). The API was started with explicit env overrides, not the
`.env`-loading `dev` script:

```
cd apps/api
PORT=3199 DATABASE_URL=postgresql://nomadhome:nomadhome@localhost:5432/nomadhome_test \
  JWT_SECRET=0123456789abcdef0123456789abcdef pnpm exec tsx src/index.ts
# -> [api] NomadHome API listening  on port 3199
```

## Route prefix

`apps/api/src/app.ts` mounts `app.use("/search", searchRouter)` and the router
exposes `GET /`, so the endpoint is `GET /search` (there is NO `/api` prefix,
unlike the task wording).

## 9.1 Seed (nomadhome_test only, SQL via `docker exec ... psql`)

Rows added (ids prefixed `qa118-`): 1 host User + HostProfile; Listing
`qa118-l1` "QA Amenity Loft" (PUBLISHED, city Qaville) with amenities inserted
in the order wifi, kitchen, ac; Listing `qa118-l2` "QA Bare Studio"
(PUBLISHED, Qaville, no amenities); Amenity rows wifi, kitchen, ac.
Counts after seeding: Listing 2, ListingAmenity 3, Amenity 3.

## 9.1 / 9.2 curl evidence

`curl -s -w "\nHTTP %{http_code}\n" "http://localhost:3199/search?city=Qaville"`

```
{"data":[{"id":"qa118-l1","title":"QA Amenity Loft","type":"PROPERTY","city":"Qaville","country":"PT","nightlyRateCents":9000,"currency":"EUR","totalCents":9000,"primaryPhotoUrl":null,"amenities":["ac","kitchen","wifi"]},{"id":"qa118-l2","title":"QA Bare Studio","type":"PROPERTY","city":"Qaville","country":"PT","nightlyRateCents":7000,"currency":"EUR","totalCents":7000,"primaryPhotoUrl":null,"amenities":[]}],"pagination":{"total":2,"page":1,"pageSize":20,"hasMore":false}}
HTTP 200
```

- HTTP 200 and `{ data, pagination }` envelope: pass.
- `amenities` is `["ac","kitchen","wifi"]` (alphabetical although inserted
  wifi, kitchen, ac): pass.
- Listing without amenities returns `"amenities":[]`: pass.
- Existing fields (id, title, type, city, country, nightlyRateCents, currency,
  totalCents, primaryPhotoUrl) and pagination are unchanged: pass.

Filter keeps the full amenity list on the item:
`curl -s -w "\nHTTP %{http_code}\n" "http://localhost:3199/search?city=Qaville&amenities=wifi"`

```
{"data":[{"id":"qa118-l1",...,"amenities":["ac","kitchen","wifi"]}],"pagination":{"total":1,"page":1,"pageSize":20,"hasMore":false}}
HTTP 200
```

Invalid page: `curl -s -i "http://localhost:3199/search?city=Qaville&page=0"`

```
HTTP/1.1 400 Bad Request
{"error":"validation","issues":{"formErrors":[],"fieldErrors":{"page":["Number must be greater than or equal to 1"]}}}
```

400 unchanged: pass.

## 9.3 Cleanup

SQL run against `nomadhome_test`: delete from ListingAmenity (the two ids),
Listing (`qa118-l1`, `qa118-l2`), Amenity (wifi, kitchen, ac), HostProfile and
User (`qa118-host`). Post-cleanup counts: Listing 0, ListingAmenity 0, Amenity
0, User 0, which equals the post-step-8 baseline (the test suite had already
emptied the tables; see the step 8 report). The API was stopped by PID (node
child 76116 and its pnpm wrapper); port 3199 no longer listens.
