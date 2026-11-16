# Step 8 Report - Unit Tests and Database Verification

- Date: 2026-11-16
- Change: refresh-visual-identity (NH-118)
- Agent: QA

## Safety note

The tasks say "dev database". Every command below ran against the disposable
`nomadhome_test` database only; the `nomadhome` development database was never
touched. Environment used:

```
DATABASE_URL=postgresql://nomadhome:nomadhome@localhost:5432/nomadhome_test
JWT_SECRET=0123456789abcdef0123456789abcdef
```

Active DB confirmed before any run via `select current_database()` ->
`nomadhome_test`.

## 7.1 Stale-assertion review

Before this step, `pnpm --filter @nomadhome/ui|web|shared test` were run as-is:
ui 45/45, web 100/100, shared 29/29 all green. No test fails against the
redesigned markup, so no assertion is stale. The affected tests were already
updated alongside the code in earlier commits (diff vs `main`, test files
only): `button.test.tsx` (forest/terracotta classes replaced by black/outline
assertions plus a legacy-scale negative match), `card.test.tsx`,
`badge.test.tsx`, `input.test.tsx`, `skeleton.test.tsx`, `pictogram.test.tsx`,
`tokens.test.ts`, `contrast.test.ts`, `ListingCard.test.tsx`,
`SearchFilterPanel.test.tsx`, `SearchPage.test.tsx`, `HeroSection.test.tsx`,
`shared/search.test.ts`, `api/search.test.ts`. Removed lines in web/ui tests
were limited to the old forest/terracotta class names, replaced by stricter
or equivalent assertions; the removed lines in `api/search.test.ts` are a
formatting change of the request builder. No edits were required in this step.

## 8.1 Commands and results

| Command                                                                      | Result                                                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm --filter @nomadhome/api exec vitest run src/search.test.ts` (targeted) | 1 file, 22 passed                                                                        |
| `pnpm --filter @nomadhome/{ui,web,shared} test` (targeted)                   | 45 + 100 + 29 passed                                                                     |
| `pnpm test`                                                                  | exit 0; shared 29, db 2, ui 45, web 100, api 144 passed (20 api files), 8/8 tasks, 1m25s |
| `pnpm lint`                                                                  | exit 0 (`--max-warnings 0`), 8/8 tasks                                                   |
| `pnpm typecheck`                                                             | exit 0, 8/8 tasks                                                                        |
| `pnpm build`                                                                 | exit 0, 5/5 tasks, web built in 1.61s                                                    |

Tail of `pnpm test`:

```
@nomadhome/api:test:  Test Files  20 passed (20)
@nomadhome/api:test:       Tests  144 passed (144)
 Tasks:    8 successful, 8 total
```

## 8.2 Database pre/post comparison (nomadhome_test)

```
before:  db=nomadhome_test listing=1 listing_amenity=0 amenity=1
after:   db=nomadhome_test listing=0 listing_amenity=0 amenity=0
```

The counts are NOT unchanged: the baseline held one leftover Listing and one
Amenity from earlier runs, and the API test suite empties these tables
(`resetDatabase()` from `@nomadhome/db`, e.g. `search.test.ts` line 125) and
leaves them empty. So the tests leave no data behind; they clear whatever was
there. This is expected on a disposable test DB, and nothing needs restoring.
The search feature itself is read-only (no writes by the endpoint).

## 8.3 Outcome

All gates green. No application or test changes were needed in this step.
