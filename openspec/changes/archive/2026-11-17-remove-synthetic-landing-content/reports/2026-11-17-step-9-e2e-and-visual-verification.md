# Step 9 Report - E2E and Visual Verification

- Date: 2026-11-17
- Change: remove-synthetic-landing-content (NH-121)
- Agent: QA

## 9.4 `pnpm test:e2e`

`lsof -i :5173` was empty before the run (no foreign server); Playwright's `webServer`
started `pnpm dev` itself and port 5173 was free again afterwards. Specs mock `/search*`
(no real API needed). Env: test-DB variables exported; `nomadhome_test` counts stayed
`0|0|0|0|0` before and after.

```
53 passed (8.4s)
```

Real-data pass (9.3): not run. The e2e harness mocks the API and does not start it; wiring a
seeded API into Playwright was out of scope, and step 8 already verifies the real endpoint
against `nomadhome_test`.

## 9.5 Visual check (screenshots in `reports/screenshots/`, resized to 1100 px max)

Landing, featured section (one / three / zero listings), produced earlier in
`apps/web/.impeccable/review/` (not committed) and copied here:

| Viewport | One listing                        | Three listings                       | Zero listings (section hidden)      |
| -------- | ---------------------------------- | ------------------------------------ | ----------------------------------- |
| 1440     | `screenshots/landing-1440-one.png` | `screenshots/landing-1440-three.png` | `screenshots/landing-1440-zero.png` |
| 360      | `screenshots/landing-360-one.png`  | `screenshots/landing-360-three.png`  | `screenshots/landing-360-zero.png`  |

Additional screenshots taken in this step (mocked 3 rows, one with a long title):
`loaded3-1440.png`, `loaded3-360.png`, `loading-1440.png`, `loading-360.png`
(skeleton), `suspense-1440.png`, `suspense-360.png` (Suspense fallback). Rows are
real links with price, city and meta; at 1440 the long title clamps to two lines.
Observation (not fixed): in `loaded3-1440.png` the second line of the clamped title
("with a long title...") has its descenders slightly clipped by `line-clamp-2` with
`leading-solid`.

## Loading-state measurement (3 mocked listings, `/search` response held until released)

Script: `apps/web/.impeccable/review/measure-loading.mjs` (git-ignored). Heights in px.

| Metric                             | 1440            | 360             |
| ---------------------------------- | --------------- | --------------- |
| Skeleton board (3 rows)            | 460             | 844             |
| Skeleton rows each                 | 152             | 280             |
| Loaded board (3 rows)              | 524             | 672             |
| Loaded rows                        | 154 / 211 / 156 | 221 / 225 / 223 |
| Skeleton section                   | 757             | 1133            |
| Loaded section                     | 821             | 961             |
| Page height: skeleton / loaded     | 5842 / 5907     | 7480 / 7309     |
| Suspense fallback (min-height)     | 760 (measured)  | 760 (measured)  |
| Page height with Suspense fallback | 5845            | 7107            |

Shift when the data arrives:

- 1440: +64 px section (+65 px page). The skeleton rows (152) match single-line rows
  (154/156) to within 2-4 px; the row with the wrapped two-line title is 211 px, so the
  shift comes from that row only. With titles that fit one line it would be about 0.
- 360: -172 px section (-171 px page). The mobile skeleton row reserves `min-h-[17.5rem]`
  (280 px) while real rows measure about 221-225 px (a 55-59 px over-reservation per row).
  This is a large shift (about 17% of the board, 172 px), so the mobile skeleton minimum
  is too tall for these rows; flagged, source not changed.
- Suspense fallback to skeleton section: 1440 760 vs 757 (3 px); 360 760 vs 1133, so on mobile the
  page grows 373 px when the lazy chunk resolves, then shrinks 172 px when data arrives.

Conclusion: desktop skeleton height matches the loaded board within a few px (single-line
titles); mobile does not (172 px shrink). Recommend tuning the mobile skeleton row (e.g. about 14rem)
and the mobile Suspense fallback if layout shift matters; not changed here per instructions.
