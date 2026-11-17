# Step 7 Report - Unit Tests and Database Verification

- Date: 2026-11-17
- Change: remove-synthetic-landing-content (NH-121)
- Agent: QA

## Safety note

Only the disposable `nomadhome_test` database was used (`select current_database()`
-> `nomadhome_test`, verified before every SQL command; psql runs through
`docker exec nomadhome-postgres-1 psql -U nomadhome -d nomadhome_test`). The `nomadhome`
development database was never touched. Environment:

```
DATABASE_URL=postgresql://nomadhome:nomadhome@localhost:5432/nomadhome_test
JWT_SECRET=0123456789abcdef0123456789abcdef
```

## 7.1 Commands and results

| Command                                        | Result                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm --filter @nomadhome/web exec vitest run` | 31 files, 173 passed (targeted: landing/FeaturedStays/HomePage live here)     |
| `pnpm test` (run twice)                        | exit 0; ui 70, shared 34, db 2, api 144 (20 files), web 173 passed; 8/8 tasks |
| `pnpm lint`                                    | exit 0 (zero warnings), 8/8 tasks                                             |
| `pnpm typecheck`                               | exit 0, 8/8 tasks                                                             |
| `pnpm build`                                   | exit 0, 5/5 tasks                                                             |

Tail of `pnpm test`:

```
@nomadhome/api:test:  Test Files  20 passed (20)
@nomadhome/api:test:       Tests  144 passed (144)
@nomadhome/web:test:       Tests  173 passed (173)
 Tasks:    8 successful, 8 total
```

## 7.2 Database pre/post comparison (nomadhome_test)

Columns: db | Listing | ListingPhoto | ListingAmenity | Amenity | User.

```
before pnpm test:  nomadhome_test|0|0|0|0|0
after  pnpm test:  nomadhome_test|0|0|0|0|0
after  pnpm test (second run): nomadhome_test|0|0|0|0|0
```

Counts are unchanged (the API suite resets tables and leaves them empty; the
change itself is read-only). Nothing needed restoring.

## Outcome

All gates green; no source or test changes were needed in this step.
