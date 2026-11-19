---
version: 1
slug: "src-pages-adminuserspage-tsx"
primary_target: "src/pages/AdminUsersPage.tsx"
related_targets: ["src/pages/AdminListingsPage.tsx", "src/components/ListingStatusTag.tsx"]
---

## Scope and visitor mode

Admin screens (AdminUsersPage at /admin/users and AdminListingsPage at /admin/listings, both under the admin role guard): Operate, inheriting the landing world (gantry signage). The admin scans accounts or listings, reads a state and disables or re-enables one row. Ambition shows as precision: one clear layout per breakpoint, shape-coded state, 44px actions and complete accessibility, not extra decoration or features (no filter, search, pagination or dialog).

## Audience, job, action, proof, constraints

- Audience: a signed-in NomadHome admin on a laptop, occasionally a phone.
- Job: find an account or listing, read whether it is active or disabled, and moderate it.
- Action: Disable and Re-enable on a user or a listing.
- Proof: real account and listing data only: email, roles, account state; title, type, city, host email, listing status. Nothing invented; no counts, activity or audit figures.
- Constraints: Tailwind + packages/ui, t() for all copy (no key or string value changed), WCAG 2.1 AA, 360 px to 1440 px, no route, API, query, mutation or schema change, nothing changed in packages/ui.

## Direction contract

THESIS: An admin list is a timetable of rows with a state you read by its outline before its colour, and an action that is always 44px and always in the same place. Refuses the stock admin table of a rounded pill badge, a red or green status chip and a shadowed card.

OWN-WORLD: The landing's wayfinding world on paper, held by 2px ink edges, with no ember at all: these are work screens, so the destructive action is danger on paper and the secondary action is ink on paper. An account state is a tag: Active is solid with an ink square marker, Disabled is solid in a muted edge with struck text. A listing status reuses the host ListingStatusTag (dashed draft, solid published with a marker, struck disabled). An error is a danger-tint panel with a filled danger tile and one H1.

STORY: The admin opens a flat table, reads each state by its tag, and acts on a row; on a phone the same rows are 2px-edged cards with a full-width action.

FIRST VIEWPORT: Black-weight title over a flat table from sm (2px ink head rule, 1px muted row rules, state tag, 44px action) or, below sm, 2px-edged cards with email or title, state tag, roles or type and city, and a full-width action.

FORM: Local pieces per file (a local StatePanel, a local AccountStatusTag in AdminUsersPage), plus the shared ListingStatusTag. Table from sm and cards below sm are both rendered and only one is displayed. Long strings (email, title, city, host email) sit in max-width wrappers with overflow-wrap anywhere; the action cell is whitespace-nowrap with a small right padding so the focus ring is not clipped.

FINISH: unreviewed and undocumented is unfinished; this build ends with the verification and DESIGN.md.

## Palette note

No palette or token change and no ember on any admin screen. Ink on paper carries titles, emails and tag text (15.32); muted ink carries roles, type, city and cells (10.20); the Disabled tag edge uses border-muted (4.93 on paper) with a 12px muted struck label that is legible at 10.20 but small. Danger text sits on paper or the danger tint only.

## Unresolved decisions

- StatePanel is now a fifth local copy (host, booking, listing detail and both admin pages); a shared StatePanel and StatusTag extraction (with the account and booking tags) is the next refactor.
- The Badge pill in packages/ui is no longer used by any admin page; only the ListingCard accent tab uses it. A shape-per-tone Badge is a separate ticket (accepted deviation).
- Re-enable is the plain secondary Button (border-2 border-border). The action Buttons show the full two-layer focus ring since NH-138 removed the per-file overrides.
- Disable and Re-enable have no disabled-while-pending state and the mutations have no error handling (both pre-existing, behaviour kept and guarded by tests); per-row accessible names need new copy.
- Roles are raw plain text; there are no role badges.
- The listings table has six columns; a md: breakpoint for the table (cards until md) was considered and left as a follow-up. HostUpcomingPage has the same latent long-string issue (NH-122).
