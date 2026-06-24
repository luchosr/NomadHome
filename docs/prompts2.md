# NomadHome — Full Prompt History

All user prompts across every session from project inception to present, in chronological order.

---

## Session 1 — Project Bootstrap & Monorepo Setup (NH-001)

- "Let's start the NomadHome project. Set up the monorepo skeleton with pnpm workspaces, Turbo, ESLint, Prettier, Husky, commitlint, and lint-staged."
- "Initialize OpenSpec for the project."
- "Set up the GitHub Actions CI workflow with the quality gates defined in CLAUDE.md."

---

## Session 2 — Design System & UI Foundation (NH-003)

- "Set up the design system foundation: Tailwind CSS config, shadcn/ui, shared UI package, and design tokens."

---

## Session 3 — Database Test Harness & Identity (NH-004, NH-005, NH-006, NH-007)

- "Add the database test harness with Vitest and a real PostgreSQL test database."
- "Implement identity registration: email/password signup with bcrypt hashing, JWT access token, and refresh token."
- "Implement identity login: email/password login returning JWT + refresh token."
- "Implement token refresh and logout."

---

## Session 4 — Host Onboarding & Listings (NH-008 to NH-011)

- "Add host onboarding: become-host flow, HostProfile model, terms acceptance."
- "Add listing CRUD: create, read, update, delete listings for hosts."
- "Add listing photos: upload to Cloudflare R2, reorder, delete."
- "Add listing publish and availability: publish/unpublish, block date ranges."

---

## Session 5 — Search, Booking, Payments, Reviews, Dashboards (NH-012 to NH-017)

- "Add search: query listings by city and date range with availability filtering."
- "Add booking: guests can create reservations, cancel, and see status."
- "Add payments: Stripe Checkout session for guest payment, webhook to confirm booking."
- "Add reviews: post-stay review (1–5 stars + text), one per booking."
- "Add host dashboard API: list own listings, upcoming bookings."
- "Add admin moderation API: list all users and listings, disable/enable."

---

## Session 6 — Frontend UIs (NH-018 to NH-023)

- "Add auth UI: login page, register page, token storage, protected routes."
- "Add search UI: search bar on home page, results listing cards."
- "Add booking UI: listing detail page with date picker and book-now button, booking form page."
- "Add guest dashboard UI: my bookings page with cancel and review actions."
- "Add host dashboard UI: create listing, edit listing with photos and availability, upcoming bookings page."
- "Add admin UI: admin users table and admin listings table with disable/enable actions."
- "When I log in as admin and go to /admin I get a 404 — fix the env var loading so the API starts correctly."

---

## Session 7 — Post-MVP Polish & Feature-Entrega2 Branch

- "Redesign the landing page from the NomadHome design system."
- "Redesign the nav with a logo mark, serif wordmark, and design system tokens."
- "Add a become-host page and a nav link for guests."
- "Fix login to include the user object in the response."
- "Can you add some listings in Madrid, for testing purposes so when I log as a guest I can see them?"
- "I have tested for Madrid at first it worked, but now I have this error: [ECONNREFUSED]"
- "ok, when I reach the home page and I put the input search some word, by example Madrid, and hit search button, please show me all accommodations in Madrid, independent from the date"
- "When selecting the check-in and check-out dates, you should only be able to select from the current day onwards, and never previous days."
- "When I create a new listing, each form input must include a label explaining the validation so the user understands how to complete each field, and the 'create a new listing' action button must be disabled unless all form validations are met. In the 'Country' field, there must be a dropdown menu with the following options: European Union countries, North America, South America, and Asia."
- "ok, the Nightly rate must be in currency units, not in cents. And in the currency input, there must be a dropdown menu with currency from the countries mentioned before."
- "when I create a listing, I have the following error in network tab: Request URL http://localhost:5173/api/listings/5ab4f76b-3bde-4bbe-b0cf-db126ce47edb — Status Code 404 Not Found"
- "When I'm editing a listing draft and I try to upload a photo, I have this error on network tab in my browser: POST /api/listings/{id}/photos/upload-url — Status Code 500 Internal Server Error. can you recheck last prompt?"
- "ok, there is a problem, as a host, when I block an accommodation for a specific date and apply it, then when I search for that accommodation and select it, I can choose the blocked dates to reserve, and I think it is a mistake. If a property is locked to a specific date range, it should not be selectable for booking in that date range. In the booking view when displaying the calendar to choose dates, dates blocked by the host should not be able to be selected."
- "fine but blocked dates should not be able to be selected from the calendar input directly."
- "perfect, but in the UI the calendar exceeds the limits of the container, it's looking ugly."
- "nope, the idea is not to shrink the calendar, is to expand the div that contains it."
- "can you create a file named prompts2.md with all the prompt history in this session? please create it inside docs folder."
- "sorry, can you include all prompts since the beginning of the project?"
- "please create a new branch named 'feature-entrega2-LR', and commit all changes grouped by logical change."
