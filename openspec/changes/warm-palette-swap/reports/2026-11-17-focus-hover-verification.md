# Focus, hover, reduced-motion and placeholder verification (NH-129)

Change: `warm-palette-swap`. Tasks: 3.5, 4.2, 4.3, 4.4. Date: 2026-11-17.

## Method

- Vite dev server on port 5199, Chromium via Playwright, `/api` and `http://localhost:3000/**` mocked (same shape as `apps/web/e2e/layout.spec.ts`).
- Pages: landing `/` and search `/search?city=Lisbon`, at 1440x900 and 360x800.
- Focus: pressed Tab through every focus stop (landing 36 stops, search 16, plus the opened filter panel), measured the real computed `outline-*` and `box-shadow` of `document.activeElement` after the 300 ms colour transition finished. The backdrop is the nearest opaque ancestor background (the element's own fill when the outline offset is negative, as on board rows).
- Hover: hovered every visible link and button (landing 27, search 7, panel 10), measured computed text colour against the effective background of each text node in the hovered state.
- Contrast uses the WCAG 2.1 formula (same as `packages/ui/src/contrast.test.ts`).
- Raw measurement scripts are throwaway (not committed); the committed proof is `apps/web/e2e/focus-hover.spec.ts` (4 tests, run green against port 5199).

## Task 3.5: hero city input placeholder

| Viewport                        | Placeholder colour            | Input background                              | Placeholder ratio | Typed text ratio | Result        |
| ------------------------------- | ----------------------------- | --------------------------------------------- | ----------------- | ---------------- | ------------- |
| 1440                            | `rgb(30, 30, 30)` (ink)       | `rgb(230, 95, 53)` (ember, transparent field) | 4.81              | 4.81             | pass (>= 4.5) |
| 360                             | `rgb(30, 30, 30)`             | `rgb(230, 95, 53)`                            | 4.81              | 4.81             | pass          |
| Search city input (paper field) | `rgb(87, 83, 78)` (fg-subtle) | paper                                         | 7.01              | 15.32            | pass          |

The code already used `placeholder:text-fg` (no fix needed).

## Task 4.4: keyboard focus ring

Every focus stop shows `outline: 3px solid`, offset 2 px (board and destination rows use -5 px inset), plus the 2 px gap shadow where no other `box-shadow` wins.

| Field                                     | Example controls                                                                                                                 | Outline       | Gap   | Outline vs field   | Outline vs gap            | Result |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- | ------------------ | ------------------------- | ------ |
| Orange (ember)                            | hero city input, hero Search, "Explore all", final CTA Search / Sign up, search query band inputs, search button, Filters toggle | ink           | paper | 4.81               | 15.32                     | pass   |
| Ink panel (nav, footer)                   | logo, Log in, Sign up, all footer links                                                                                          | paper         | ink   | 15.32              | 15.32                     | pass   |
| Ink board rows (focus fills ember)        | departure-board rows                                                                                                             | ink (inset)   | ink   | 4.81 vs ember fill | n/a (gap outside the row) | pass   |
| Orange destination rows (focus fills ink) | Oaxaca, Lisbon, Medellin, Mexico City rows                                                                                       | paper (inset) | ink   | 15.32 vs ink fill  | 15.32                     | pass   |
| Paper                                     | hero date inputs, "See all stays", listing cards, filter panel inputs/select/buttons/chips                                       | ink           | paper | 15.32              | 15.32                     | pass   |
| Sage                                      | no interactive control sits on a sage panel on landing or search                                                                 | n/a           | n/a   | n/a                | n/a                       | n/a    |

Notes:

- First pass reported the board and destination rows as 1.00 and 3.19. That was a measurement artefact: the row background transitions for 300 ms and the probe read it mid-transition. Re-measured after the transition: values above.
- Secondary buttons (Filters toggle, panel Close) use `ring-1 ring-inset`, which replaces the global gap `box-shadow`, so they show only the outline layer: ink on ember 4.81, ink on paper 15.32. Still >= 3 and >= 4.5; no change.
- Date inputs: the calendar-picker indicator (extra Tab stop) draws Chrome's native blue focus ring, not the token ring. It sits on the paper-filled input and is clearly visible (screenshot `focus-paper-date-indicator.png`); not measured numerically and not tokenised (out of scope).
- Amenity chips use `peer-focus-visible:outline-border` (ink, 3 px, offset 2) on the paper panel: 15.32.

## Hover states (text on background, hovered)

| Element                                       | Idle background | Hover background      | Text colours measured                             | Ratio   | Result |
| --------------------------------------------- | --------------- | --------------------- | ------------------------------------------------- | ------- | ------ |
| Departure-board row                           | ink             | ember                 | ink text; price switches ember to ink             | 4.81    | pass   |
| Departure-board code tile ("OAX")             | ember           | ink                   | ember on ink at 24 px black (large)               | 4.81    | pass   |
| Destination-index row                         | ember           | ink                   | paper text                                        | 15.32   | pass   |
| Listing card (search)                         | paper           | stone                 | ink 12.90, fg-muted 8.59, badge ink on ember 4.81 | >= 4.81 | pass   |
| Primary buttons (Search)                      | ink             | `#333333`             | paper                                             | 11.61   | pass   |
| Secondary button (Filters)                    | paper           | stone                 | ink                                               | 12.90   | pass   |
| Nav Sign up                                   | ember           | paper                 | ink                                               | 15.32   | pass   |
| "See all stays", "Explore all", final Sign up | paper           | ink                   | paper                                             | 15.32   | pass   |
| Filter chip, unchecked                        | paper           | ember                 | ink                                               | 4.81    | pass   |
| Filter chip, checked                          | ink             | ink (hover keeps ink) | paper                                             | 15.32   | pass   |

Minimum text ratio across all 44 hovered controls: 4.81. Nothing below 4.5 for normal text. (At 360 px, four hover attempts on controls under the open bottom sheet timed out because the sheet covers them; this is a test limitation, not a defect.)

## prefers-reduced-motion

Emulated `reduce` (media query matched: true) on all four page/viewport combinations: 310 landing elements and 104 search elements checked (including `::before` and `::after`); 0 elements with transition or animation duration above 0.01 ms; `scroll-behavior: auto`; 0 running animations after a hover. Without the emulation, 29 landing elements and 9 search elements have non-zero transition durations, so the `globals.css` rule is what removes them.

## Task 4.2 and 4.3: layout and states

- Horizontal overflow: `scrollWidth` equals `innerWidth` on landing and search at 1440 and 360 (no horizontal scroll).
- Landing: every orange panel (hero, destination index, final CTA) shows ink text; every sage panel (co-living, testimonial) shows ink text; hero placeholder legible; no clipped text visible in the screenshots.
- Search: query band, filter panel (desktop sticky aside, mobile bottom sheet), cards, empty and loading states captured. No text below 4.5 in the empty state (script check on the form subtree).
- The error state was not captured: the query retries, so the 800 ms capture still showed the loading skeleton. Error styling is covered by the existing unit tests and contrast.test.ts role pairings; not claimed as visually verified here.

Screenshots (in `screenshots/`): `landing-desktop-1440.png`, `landing-mobile-360.png`, `search-desktop-1440.png`, `search-mobile-360.png`, `search-panel-desktop-1440.png`, `search-panel-mobile-360.png`, `search-empty-*.png`, `search-loading-*.png`, `focus-orange-hero-city.png`, `focus-ink-board-row.png`, `focus-paper-date-indicator.png`.

## Fixes

None needed. No source under `apps/web/src` or `packages/ui/src` changed.

## Added test

`apps/web/e2e/focus-hover.spec.ts` (computed-style assertions, same style as `layout.spec.ts`): hero placeholder ink on ember, focus ring on orange and ink fields, board row hover ember with ink text, reduced motion. Run against port 5199 with a temporary config: 4 passed. It has not been run through `pnpm test:e2e` (port 5173 was off limits).

## Commands

- `pnpm --filter @nomadhome/ui test`: 8 files, 70 tests passed.
- `pnpm --filter @nomadhome/web test`: 28 files, 140 tests passed.
- `pnpm lint`: 8 of 8 tasks successful.
- `pnpm typecheck`: 8 of 8 tasks successful.
