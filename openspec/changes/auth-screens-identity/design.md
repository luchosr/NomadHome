# Design: auth-screens-identity

Ticket NH-125 (#125). Builds on `refresh-visual-identity` (NH-118) and
`warm-palette-swap` (NH-129). Frontend only: no backend, schema, route, API,
validation, redirect or `t()` key change. The three screens are **Operate
mode** (a task to complete fast and clearly), so ambition shows as precision:
one strong sign composition, exact pairings, shape-coded state and complete
accessibility, not extra decoration.

## Files in scope

| File                                                                            | Change                                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/web/src/components/AuthShell.tsx` (new)                                   | Title band + form panel + optional footer row, shared by Login and Register                     |
| `apps/web/src/components/FormField.tsx`                                         | Restyle label and error; link error to input (`errorIdFor`)                                     |
| `apps/web/src/components/ServerErrorAlert.tsx`                                  | Restyle to the form-level error panel; keep `role="alert"` and the `error: string \| null` prop |
| `apps/web/src/pages/LoginPage.tsx`                                              | Compose with `AuthShell`; form name, `aria-describedby`; no logic change                        |
| `apps/web/src/pages/RegisterPage.tsx`                                           | Same                                                                                            |
| `apps/web/src/pages/VerifyEmailPage.tsx`                                        | Three sign panels; one `h1` per state; live regions; no logic change                            |
| `apps/web/src/pages/{Login,Register,VerifyEmail}Page.test.tsx`                  | Extend (structure, states, accessibility)                                                       |
| `apps/web/src/components/{AuthShell,FormField,ServerErrorAlert}.test.tsx` (new) | Unit tests                                                                                      |
| `apps/web/e2e/auth-identity.spec.ts` (new)                                      | Computed colour, border style, layout and focus checks at 1440 and 360                          |
| `apps/web/DESIGN.md`                                                            | Add the auth composition and error grammar (what shipped)                                       |
| `apps/web/.impeccable/surfaces/src-pages-loginpage-tsx.md` (new)                | Surface brief                                                                                   |
| `openspec/changes/auth-screens-identity/reports/*`                              | Verification reports and screenshots                                                            |

Read but **not** changed: `packages/ui` primitives (`Button`, `Input`, `Badge`,
`Card`), `Layout.tsx`, `useRegister.ts`, `packages/shared` schemas and
`en.ts`, `apps/web/src/api/*`. `BecomeHostPage.tsx` is untouched but inherits
the restyled `FormField` and `ServerErrorAlert` (D8).

## D1. Page layout at 1440 and 360: ember title band over one paper form panel

**Decision.** Login and Register use one composition: a full-bleed **ember
title band** (the sign panel carrying the page title and the one-line
subtitle) directly under the nav, closed by a 2px ink rule, then a single
**paper form panel** (2px ink edge, 4px radius) centred in a 32rem column
below it. The title's left edge and the panel's left edge share the column.
There is no hero photo, no illustration and no second column.

- **1440 px.** Band is full width; its text sits in the 32rem column (centred).
  The panel is the same column. The whole Login form and the Register form
  with its three fields fit in a 900 px tall viewport without a server error
  (nav 58, band about 190, gap 32, panel 330 to 470). With a server error
  shown, the Register footer row can fall below the fold.
- **360 px.** Same stack, 16px gutters, band padding reduced, panel padding
  20px. Everything is one column, so there is nothing to reflow.

**Rationale.** It reuses the Search "ember query band over paper panels"
grammar the user already learned, keeps every control and every error on a
paper surface (so the two hardest pairing rules, "no danger on orange" and "no
muted ink on orange", hold by construction rather than by care), and gives the
title the destination-line treatment (Black weight, solid leading) that makes
the screens read as part of the same system as the landing.

| Option                                             | Verdict  | Why                                                                                                                                                                                                             |
| -------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Band over one centred panel (chosen)               | Chosen   | Shortest eye travel, one column at every width, errors never near orange, reuses an existing field pattern                                                                                                      |
| Split screen (ember sign left, form right at lg)   | Rejected | Needs content to fill the sign half and there is none that is not invented (no testimonials, claims or photography exist); collapses to the same stack at 360 anyway; doubles the visual work for the same task |
| Whole page ember with a paper panel floating on it | Rejected | Puts the form's error and helper text one margin away from orange; heavier than the task deserves; the landing already spends the "big orange" moment                                                           |
| Keep the bare canvas, restyle fields only          | Rejected | The page would still not read as part of the identity; the title would have no sign                                                                                                                             |

**Band anatomy.** `bg-ember text-fg` (ink on ember 4.81), `border-b-2
border-border`, vertical padding 24px mobile and 56px from md. Title: the base
`h1` (Overpass 900, `text-4xl` fluid 2.25 to 3.75rem, leading 0.95, tracking
-0.03em, `text-balance`). Subtitle: 16px medium **ink** (never `fg-muted` or
`fg-subtle`, which fail on ember: 3.20 and 2.20), capped at about 40ch.

**Panel anatomy.** `bg-surface-raised` (paper), `border-2 border-border`,
`rounded-card`, no shadow, no gradient. Body padding 20px mobile and 32px from
sm. Top margin 32px (24px mobile) under the band, bottom 64px.

## D2. Page structure, landmarks and the form name

The root `<main>` is owned by `Layout`; `AuthShell` MUST NOT render another.
`AuthShell` renders the band (`<header>`-free: a plain `div` so there is no
second banner landmark) with the `h1` carrying an `id`, and the panel. The
`<form>` is named by that heading (`aria-labelledby`), so a screen reader
announces "Welcome back, form". Pages pass `titleId` to the shell and to the
form.

## D3. Fields

- Label: 14px **bold ink** above the control (`text-sm font-bold text-fg`),
  8px gap. Replaces `font-medium text-fg-muted`.
- Control: the unchanged `Input` primitive (2px ink edge, paper fill, 2px
  radius, global two-layer focus ring). Vertical rhythm 20px between fields.
- Every input keeps its existing `id`, `type` and `autoComplete` (`email`,
  `current-password`, `new-password` twice). Additive attributes only:
  `aria-required="true"` on each field, `autoCapitalize="none"` and
  `spellCheck={false}` on the email field, and `aria-describedby` pointing at
  the error element **only while an error is rendered**. None of these changes
  validation or submission. The forms deliberately keep native validation
  behaviour (no `noValidate` added, none removed).
- Focus order equals DOM order equals visual order: email, password,
  (confirm password), submit, route link. Nothing uses positive `tabIndex`.
- Placeholder: none added (the label is the instruction).

## D4. Field errors: shape and contrast

`FormField` renders its error as a message **inside the paper panel** with a
4px solid danger rule on its left, 12px left padding, 14px **bold** danger text
(`danger` on paper 7.42), 8px under the control. The rule is the shape cue; the
`Input` primitive's existing `aria-[invalid=true]:border-danger` stays as the
supplementary colour cue. The element gets `id=${id}-error`
(`errorIdFor(id)`), and the page sets `aria-describedby` on the matching
input while the error exists. Field errors are **not** `role="alert"`: React
Hook Form focuses the first invalid field on a failed submit, which announces
its description, and several simultaneous alerts would be noisy. This also keeps
exactly one `role="alert"` on the page (the form-level error), which the
existing tests and e2e specs rely on.

Danger text never sits on ember (2.33) and never needs the tint: field errors
use the paper surface directly, so the tint-needs-an-edge rule from DESIGN.md is
not triggered.

## D5. Form-level (server) error: a sign panel

`ServerErrorAlert` renders, when `error` is non-empty, a panel directly above
the submit button: `role="alert"`, 2px **solid** danger edge, `bg-danger-bg`
fill (the tint keeps its 2px edge, as DESIGN.md requires), a 20px square
**filled danger tile** carrying a paper "!" mark (authored inline SVG on a
24 grid, square caps, `aria-hidden`), then the message in 14px bold danger on
the tint (6.48). The tile plus the solid edge are the shape cues. The text is
the server or fallback message exactly as today. It wraps with `break-words`
so a long message never overflows at 360 px. The component keeps its props
(`error`, optional `className`) and its return-null-when-empty behaviour.

Where it sits: after the last field, before the submit (current position),
inside the paper panel. It is never rendered on the band.

## D6. Submit and the route link

- Submit: unchanged `Button` primary (ink fill, paper label, 2px ink edge),
  full width, 14px 22px padding. While `isSubmitting` (Login, Register) or
  `!isValid` (Register) it is `disabled` and the primitive already switches to
  the dashed, stone, subtle-ink treatment: state by shape (computed in the
  table: subtle ink on stone 5.91, dashed edge 4.15).
- Route link ("Sign up" on Login, "Log in" on Register): a **footer row** of
  the panel, separated by a 2px ink rule, stone fill, 16px 20px padding. The
  prompt text is ink 14px; the link is ink, **bold and always underlined**
  (not weight alone, and not hover-only), with a minimum 44px tall target.
  As shipped, the link is separated from its prompt by `ml-1` (4px), not by
  a text space.
  Ink on stone 12.90. Hover and focus follow the global grammar (focus ring
  from the base layer; hover removes the underline offset change only, no
  colour invention).

## D7. VerifyEmail: three distinct sign panels

One `h1` per state, always present (pending gets one: the existing
`identity.verify_email.pending` string becomes the heading text; no new key).
The container is a single centred 36rem column with 40px top padding (64px from
md) and a wrapper live region so the state change is announced. As shipped the
wrapper carries `aria-live="polite"` only outside the error state (pending and
success); in the error state the panel's own `role="alert"` announces, which
avoids a double announcement.
Each state is **one panel with one fact**; shape carries the state, colour is
supplementary.

| State   | Panel fill and edge            | Tile (64px square, 2px edge, glyph on a 32 grid, 3-unit strokes, square caps, mitred joins) | Heading and body                          | Action                                     | Roles                                         |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| pending | stone, **dashed** 2px ink edge | **Dashed** ink edge, three solid ink squares (a static "in progress" mark; no spinner)      | `pending` text as `h1`, ink               | none                                       | live region `role="status"`, `aria-busy=true` |
| success | **ember**, solid 2px ink edge  | **Solid ink fill**, paper check                                                             | `success_title` `h1`, `success_body`, ink | ink primary link "Log in" to `/login`      | live region (polite)                          |
| error   | paper, solid 2px ink edge      | **Outlined** tile: 2px solid danger edge, paper fill, danger cross                          | `error_title` `h1`, `error_body`, ink     | ink primary link "Register" to `/register` | panel `role="alert"`                          |

- **Why dashed / filled / outlined.** It extends the system's existing grammar
  (dashed = tentative, solid = confirmed, struck or crossed = failed) so each
  state is distinguishable in grayscale and without reading colour.
- **Why ember for success.** It is the identity's "go" sign and the one place
  the verify screen earns colour; ink text and an ink button on ember are the
  approved pairing (4.81, and the button's ink edge against ember 4.81). The
  danger tile is never on ember; the error panel is paper by rule.
- **Why not green for success.** The spec forbids colour-only state and the
  deep success green exists for badges; using ember keeps the palette to its
  five names on this page.
- **Primary actions are `Link`s** (they navigate, as today). They reproduce the
  primary `Button` look through a small local class string
  (`border-2 border-border bg-action text-action-fg`, radius 2px, 14px 22px
  padding, bold 14px, hover `bg-action-hover`) because the `button` variant
  function is not exported and adding an export would touch the primitive's
  public surface (out of scope). A computed-style e2e assertion guards drift.
  On mobile the link is full width; from sm it is auto width.
- **Status behaviour is unchanged**: `pending` until the single API call
  resolves; missing token goes straight to `error` without calling the API;
  `StrictMode` double-invoke guard (`called` ref) stays.
- **Reduced motion.** The pending tile is static. No state animates, so there
  is nothing to disable; the global reduced-motion rule still applies to the
  colour transitions on links.

## D8. Shared wrappers and `BecomeHostPage`

`FormField` and `ServerErrorAlert` are used only by Login, Register and
`BecomeHostPage` (checked with `rg`). They are restyled **in place** rather than
forked, because a fork would leave two competing error grammars on near
identical forms. Consequences, accepted and recorded:

- `BecomeHostPage` gets the new label weight, the left-barred field error and
  the panel-style server error. Its logic, copy, validation and role queries
  are unchanged; the existing `findByRole("alert")` assertions keep passing
  (the component keeps `role="alert"` and its text).
- `FormField` gains one exported helper `errorIdFor(id)` and renders the error
  `id`. A caller that does not set `aria-describedby` still works.
- Adding `aria-describedby` to `BecomeHostPage` inputs is optional follow-up
  and is **not** part of this change (listed in tasks as a check only).

## D9. Existing affordances kept; scope defense

Login and Register currently have: email, password, (confirm password) fields;
a submit button; a route link; a server-error line. There is **no**
show-password toggle, no forgot-password link, no remember-me, no alternative
sign-in providers, no password-rule hint. None is added (scope defense, CLAUDE.md
section 2: alternative providers are post-MVP; the others are new features).

Behaviours deliberately preserved and noted:

- Register submit stays `disabled` until the form is valid (`mode:
"onTouched"`, `!isValid`). It is a known accessibility trade-off (a disabled
  submit gives no reason). It is part of the existing behaviour contract, so it
  stays; the dashed disabled shape remains the visible cue. Follow-up
  candidate, not in scope: persistent password-rule hint and enabling submit.
- Login keeps its role-based redirect effect and `from` handling untouched.

## D10. Accessibility, 360 px and motion checklist

- Every input has a visible `<label htmlFor>`; every error has an id and is
  linked via `aria-describedby`; invalid fields keep `aria-invalid`.
- Exactly one `h1` per page and state; heading order does not skip.
- The form has an accessible name (D2).
- Links are underlined on the footer row and have a 44px minimum target;
  buttons keep the primitive's 14px 22px padding (about 46px tall).
- Focus: global two-layer ring. Ink outline with paper gap on paper, stone,
  ember (4.81) and sage; nothing on these screens sits on an ink field, so the
  inverted ring is not needed. Ring is never clipped: panels do not set
  `overflow: hidden` on the form container.
- 360 px: single column, no fixed widths, `min-w-0` on flex children, long
  words and server messages `break-words`, `text-balance` titles. No horizontal
  scroll at 360 (asserted in e2e for every state, with a long email typed and a
  long server message mocked).
- Reduced motion: no animation is added; transitions are colour only and are
  already neutralised by the global rule.
- Touch: no hover-only information.

## D11. Copy

No `t()` key is added, removed or renamed and no string value changes. Reviewed
for off-voice copy: "Welcome back", "Create your account" and the verify strings
are plain and honest. One note, not changed: `identity.verify_email.error_body`
ends with "Please register again.", which is correct only for an expired link
and is semantic copy. **Copy changes: none.**

## D12. Test strategy (TDD)

- **Unit (Vitest + Testing Library), red first**, per screen: title is an `h1`
  inside the band; the form is named by it; labels are linked; invalid fields
  expose `aria-invalid` and `aria-describedby` pointing at the visible error
  text; the server error is the single `role="alert"`; the route link is
  present and underlined; Verify renders exactly one `h1` and the expected
  role and `data-state` in each of three states; no `role="alert"` for field
  errors; tile fills and border styles are asserted through the class names
  that implement them (jsdom does not compute Tailwind), complemented by e2e.
- **E2E (Playwright, mocked API)** in `auth-identity.spec.ts`, patterned on
  `layout.spec.ts`: computed background and text colour of the band
  (`rgb(230, 95, 53)` / ink), panel background paper and 2px border width,
  field-error `border-left-width: 4px` and colour, server-error panel
  `border-style: solid` with danger border colour and its nearest opaque
  ancestor background not ember, verify-state `border-style` (dashed, solid,
  solid) and tile fill, `scrollWidth <= innerWidth` at 1440 and 360 for every
  state, focus order by Tab, visible focus ring on the submit and the link.
- Screenshots are attached to the report as artifacts, never compared
  (same policy as `layout.spec.ts`).

## D13. Surface brief and DESIGN.md

Write `apps/web/.impeccable/surfaces/src-pages-loginpage-tsx.md` in the format
of the homepage brief (frontmatter `version`, `slug`, `primary_target`,
`related_targets`; sections for scope and mode, audience/job/action/proof/
constraints, direction contract with THESIS, OWN-WORLD, STORY, FIRST VIEWPORT,
FORM, FINISH, a palette note, unresolved decisions). Extend `DESIGN.md`:
Components gets "Auth screens" (band, panel, footer row, field error,
form-level error, verify state signs), the Do/Don't list gets "state glyph
tiles use dashed, filled, outlined" and the Named Rules stay. No palette or
token change.

## Computed contrast table

Script (kept in the session scratchpad, reproduced here so the table is
auditable; it is the same WCAG 2.1 formula as
`packages/ui/src/contrast.test.ts`):

```js
function lum(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
```

Palette: ink #1E1E1E, paper #F7F5F2, stone #E5E2DD, ember #E65F35, danger
#9B1C2E, danger-bg #F8E1E0, fg-subtle #57534E, border-muted #6F6A63.

| ID  | Pairing (where on these screens)                                   | Colours           | Ratio | Needs | Result                       |
| --- | ------------------------------------------------------------------ | ----------------- | ----- | ----- | ---------------------------- |
| A1  | Ink on ember: band title (36px+ Black, large text)                 | #1E1E1E / #E65F35 | 4.81  | 3     | pass                         |
| A2  | Ink on ember: band subtitle (16px medium, normal text)             | #1E1E1E / #E65F35 | 4.81  | 4.5   | pass                         |
| A3  | Ink on paper: labels, panel text, input text                       | #1E1E1E / #F7F5F2 | 15.32 | 4.5   | pass                         |
| A4  | Paper on ink: primary button and action link label                 | #F7F5F2 / #1E1E1E | 15.32 | 4.5   | pass                         |
| A5  | Ink on stone: footer row text and link, pending panel text         | #1E1E1E / #E5E2DD | 12.90 | 4.5   | pass                         |
| A6  | Ink edge on paper: panel and input edges (non-text)                | #1E1E1E / #F7F5F2 | 15.32 | 3     | pass                         |
| A7  | Ink edge on ember: band rule, success panel edge (non-text)        | #1E1E1E / #E65F35 | 4.81  | 3     | pass                         |
| A8  | Danger on paper: field error text (14px bold)                      | #9B1C2E / #F7F5F2 | 7.42  | 4.5   | pass                         |
| A9  | Danger on danger-bg: form-level error text                         | #9B1C2E / #F8E1E0 | 6.48  | 4.5   | pass                         |
| A10 | Danger edge against paper: form-level error outer edge, field rule | #9B1C2E / #F7F5F2 | 7.42  | 3     | pass                         |
| A11 | Danger edge against danger-bg: form-level error inner side         | #9B1C2E / #F8E1E0 | 6.48  | 3     | pass                         |
| A12 | Paper "!" mark on danger tile                                      | #F7F5F2 / #9B1C2E | 7.42  | 4.5   | pass                         |
| A13 | Danger cross and tile edge on paper (error state tile)             | #9B1C2E / #F7F5F2 | 7.42  | 3     | pass                         |
| A14 | Paper check on ink fill (success tile)                             | #F7F5F2 / #1E1E1E | 15.32 | 3     | pass                         |
| A15 | Ink on ember: success panel heading and body (16px+)               | #1E1E1E / #E65F35 | 4.81  | 4.5   | pass                         |
| A16 | Subtle ink on stone: disabled submit label                         | #57534E / #E5E2DD | 5.91  | 4.5   | pass                         |
| A17 | Muted edge on stone: disabled submit dashed edge (non-text)        | #6F6A63 / #E5E2DD | 4.15  | 3     | pass                         |
| A18 | Ink dashed edge on stone: pending panel and tile edge (non-text)   | #1E1E1E / #E5E2DD | 12.90 | 3     | pass                         |
| A19 | Ink focus outline on ember (success action focus, ember panel)     | #1E1E1E / #E65F35 | 4.81  | 3     | pass                         |
| A20 | Ink focus outline on stone (footer link focus, pending)            | #1E1E1E / #E5E2DD | 12.90 | 3     | pass                         |
| N1  | Not used: danger on ember                                          | #9B1C2E / #E65F35 | 2.33  | 4.5   | fails, so never placed there |
| N2  | Not used: paper text on ember                                      | #F7F5F2 / #E65F35 | 3.19  | 4.5   | fails, so never placed there |
| N3  | Not used: subtle ink on ember                                      | #57534E / #E65F35 | 2.20  | 4.5   | fails, so never placed there |

Note: danger on stone is 6.25 (passes) but field errors still stay on paper by
rule D4. The focus ring's gap layer is paper, so the ring is also separated from
the surface it sits on. No new colour value is introduced; every pairing above
already exists in `DESIGN.md`.

## Risks

| Risk                                                                      | Mitigation                                                                                          |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `BecomeHostPage` looks different after the wrapper restyle                | Intended; verified visually and by its own tests (tasks 6 and 10)                                   |
| A tile glyph drifts from the 32 grid / stroke rules                       | Draw on a 32 viewBox with 3-unit strokes; reviewed in the visual check                              |
| `Link` styled as a button diverges from the primitive over time           | Computed-style e2e assertion on the action link; note in DESIGN.md that it mirrors `Button` primary |
| Mobile `h1` wraps to three lines for a long locale in future              | `text-balance`, fluid size; English only in MVP                                                     |
| `aria-describedby` on an input that has no error                          | Only set while the error element is rendered; unit-tested both ways                                 |
| Pending panel mistaken for a skeleton                                     | It has real text (the heading) and `aria-busy`; skeleton rules do not apply                         |
| Existing tests that match by text now find two nodes (title and subtitle) | Review pass before implementation (tasks 6); queries use roles and `t()` keys                       |

## Open points

None blocking. Recorded follow-ups (not in scope):

- Persistent password-rule hint, with an enabled Register submit.
- `aria-describedby` and the left-bar error grammar on the `BecomeHostPage`
  terms checkbox error (still `text-xs text-danger`), and its 16px checkbox
  target.
- Register submit is disabled until the form is valid (pre-existing).
