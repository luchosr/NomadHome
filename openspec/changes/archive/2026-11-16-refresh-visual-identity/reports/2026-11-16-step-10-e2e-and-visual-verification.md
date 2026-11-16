# Step 10 Report - E2E and Visual Verification

- Date: 2026-11-16
- Change: refresh-visual-identity (NH-118)
- Agent: QA

## Environment and safety

The existing Playwright suite is 100% route-mocked (`page.route`, `mockSession`):
no spec reads or writes any database, and `webServer` is `pnpm dev` with
`reuseExistingServer`, so a vite dev server already running from this worktree
(port 5173) was reused and the API/`.env` dev database were never started.
The env `DATABASE_URL=.../nomadhome_test` was exported for the run anyway. The
`nomadhome` development database was not touched. Nothing needs restoring after
`pnpm test:e2e`.

## 10.1 Selector review

Read `e2e/search.spec.ts` and all other specs touching landing/search/auth.
All selectors are role/label based (`getByLabel(/city/i)`, `getByRole("button",
{ name: /^search$/i })`, `getByText`, "Filters" button) and still match the
redesigned markup, so no selector needed updating and no behavior assertion was
changed. (Existing mock payloads omit `amenities`; the field is optional so they
remain valid.)

## 10.2 `pnpm test:e2e`

```
Running 41 tests using 5 workers
...
  41 passed (5.3s)
```

All 41 pre-existing specs pass; no regression caused by the redesign, no
pre-existing failure. After adding the new spec (10.3) the full suite is 45
tests (re-run result below).

## 10.3 Layout checks (`apps/web/e2e/layout.spec.ts`)

Four tests: landing and search, each at 1440x900 and 360x800, with the search
API mocked (payload includes `amenities: ["ac","kitchen","wifi"]`).

Choice of assertions instead of `toHaveScreenshot`: the repo has no pixel
baselines (design.md D6) and baselines recorded on macOS would fail on Linux CI
because of font rendering and antialiasing. So the tests assert structure that
breaks when the layout breaks:

- `documentElement.scrollWidth <= innerWidth` (no horizontal overflow)
- landing: hero city input, `stay-length` numeral and submit button are visible,
  inside the viewport and have pairwise non-overlapping bounding boxes
- search: city input, submit button and two result cards are visible, inside the
  viewport and non-overlapping; first card shows its amenity label
- computed `font-family` of the h1 contains `Overpass`
- computed background of the hero / search header band is `rgb(255, 199, 0)`
  (signal #FFC700)
- full-page screenshots are attached to the Playwright report with
  `testInfo.attach` and never compared.

Mutation check: changing the expected colour to `rgb(1, 2, 3)` made all four
tests fail (`Expected: "rgb(1, 2, 3)" Received: "rgb(255, 199, 0)"`); restored.

## 10.4 Real-browser walk (final build, `vite preview` on :4173, Chromium)

Screenshots (gitignored, `apps/web/.impeccable/review/`): `v6-landing-{1440,360}-{full,focus}.png`,
`v6-search-{1440,360}-{full,filters-open,filters-closed,empty,error}.png`.

| Check                                                               | 1440                                        | 360                          |
| ------------------------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| Landing horizontal overflow (scrollWidth/innerWidth)                | 1440/1440                                   | 360/360                      |
| Search horizontal overflow                                          | 1440/1440                                   | 360/360                      |
| Landing Tab pass (39 stops): focused element under 58 px sticky nav | 0                                           | 0                            |
| Search Tab pass (29 stops): focused element under sticky nav        | 0                                           | 0                            |
| Filters button opens panel (`complementary`, aria-expanded=true)    | yes, side panel 288 px wide                 | yes, full-width sheet 360 px |
| Escape closes panel and returns focus to the Filters button         | yes                                         | yes                          |
| Empty state ("No listings found")                                   | shown                                       | shown                        |
| Error state (mocked HTTP 500): "Search unavailable" alert           | shown after react-query retries (about 7 s) | shown                        |
| Page errors                                                         | none                                        | none                         |

Notes:

- The Tab pass flagged date inputs as "no focus indicator" on exactly one stop
  per field. Cause: after the three date segments, Tab lands on Chromium's
  native calendar-picker button inside the input's shadow DOM; the input
  reports `:focus-visible` false there and Chromium draws its own native ring
  on that button. Every segment stop shows the 3 px outline plus white gap
  (`matches(":focus-visible")` true). Not an app defect.
- The only console errors were the mocked 500 responses (1 request plus 3
  react-query retries), expected in the error scenario.
- Visual inspection of `v6-search-360-filters-open.png` and
  `v6-search-360-error.png`: sheet, header band and error panel render correctly.
- The preview server was stopped by PID after the walk.
