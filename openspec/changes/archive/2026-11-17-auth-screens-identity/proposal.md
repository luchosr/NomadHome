# Proposal: auth-screens-identity

## Why

The landing and search screens ship the Gantry Signage identity in the warm
palette (`refresh-visual-identity` NH-118, `warm-palette-swap` NH-129), but the
three authentication screens still render the pre-identity look: a centred
`max-w-sm` column on the bare canvas, a plain bold heading, `fg-subtle` helper
text, `text-xs` danger text under each field, a danger-coloured paragraph for
server errors, and on `VerifyEmailPage` a rounded `rounded-full` icon disc and a
`rounded-xl` link-button that use radii and shapes the design system forbids
(`DESIGN.md`: radii 0 to 4px, no pills). A visitor who clicks "Sign up" on the
landing sign panel lands on a page that looks like a different product, at the
exact moment the product asks for trust.

Beyond identity, the screens have concrete accessibility gaps that an Operate
screen cannot afford: field errors are not programmatically tied to their
input (`aria-describedby` missing), the verify screen's pending state has no
heading at all, the three verify states share one layout and differ only by a
small icon colour (state by colour, WCAG 1.4.1), the secondary links are
distinguished from body text by weight alone, and text colours (`fg-muted`,
`fg-subtle`) are chosen per element rather than from a panel pairing.

Ticket NH-125 (GitHub issue #125): "Apply the Gantry Signage identity to the
auth screens". Refs #125; closes #125.

## What

Visual and compositional work only. Behaviour, routes, validation (React Hook
Form + Zod), API calls, redirects, copy semantics and every `t()` key stay.

- **One shared sign composition** for Login and Register: a full-bleed ember
  title band (the page title is the destination line, set solid, ink on ember,
  2px ink bottom rule) above a single centred paper form panel with a 2px ink
  edge. The secondary route link ("Sign up" / "Log in") sits in a stone footer
  row of the panel, underlined, with an enlarged tap target.
- **Fields on paper only.** Controls, labels and errors live inside the paper
  panel, never on the orange band, so the "danger never on orange" and "no
  muted ink on orange" rules hold by construction.
- **Shape-coded errors.** A field error is a left-barred message
  linked to its input; the form-level server error is a full panel with a solid
  danger edge, tint fill and a filled marker tile, announced as an alert.
- **VerifyEmail as three distinct sign panels**: pending (stone fill, dashed
  edge, three-dot tile, polite status), success (ember panel, solid edge,
  ink-filled check tile, ink primary action), error (paper panel, solid edge,
  outlined crossed tile in danger, alert role). Each state has exactly one
  `h1`.
- Restyle the shared `FormField` and `ServerErrorAlert` wrappers in place and
  add an `AuthShell` component for the band and panel. `BecomeHostPage`
  shares the two wrappers and inherits their restyle (no behaviour change).
- Write the surface brief `apps/web/.impeccable/surfaces/src-pages-loginpage-tsx.md`
  and extend `apps/web/DESIGN.md` with the auth composition and error grammar.

## Impact

- **Capabilities affected**: `platform` (adds requirements for the auth
  screens' identity, error shape and contrast, VerifyEmail states, 360 px and
  keyboard behaviour, and no-behaviour-change). `identity` is **consumed
  unchanged**: its `register-page` and `login-page` requirements name the
  routes but constrain behaviour only, and no scenario there changes, so no
  `## MODIFIED` entry is needed.
- **Breaking changes**: no. No API, schema, route, `t()` key or shared
  primitive prop change. No new dependency.
- **Migration required**: no. No Prisma change, no data migration, no backend
  change.
- **Out of scope**: password-visibility toggle, forgot-password or reset flow,
  password-strength meter, persistent password-rule hint (all would add
  features or copy); alternative sign-in providers (deferred, see
  `openspec/project.md` section 3); restyling `BecomeHostPage` beyond what it
  inherits from the two wrappers; changes to the nav or to `Layout`; new
  pictograms in `packages/ui`; copy rewrites (none planned; any needed copy
  change is listed in design.md D11); backend behaviour of verification.

## Risks & Mitigations

| Risk                                                                                       | Likelihood | Mitigation                                                                                                              |
| ------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Restyling shared `FormField`/`ServerErrorAlert` changes `BecomeHostPage` look              | High       | Intended and bounded: same grammar, no behaviour change; its tests and an e2e glance are in the tasks (design.md D8)    |
| A new live region or heading breaks existing tests that count `role="alert"` or query text | Medium     | Field errors are not alerts; one `role="alert"` per failed submit stays; tests reviewed before implementation (tasks 6) |
| Danger text ends up on orange through a future edit                                        | Low        | Fields and errors are confined to the paper panel; a computed-colour e2e asserts the ancestor background of every error |
| Disabled Register submit (`!isValid`) stays unexplained for assistive tech                 | Medium     | Behaviour is kept by design; the dashed disabled shape is already state by shape; recorded as follow-up (design.md D9)  |
| 360 px Register first viewport scrolls on short phones                                     | Medium     | Compact mobile band padding; submit reachable without horizontal scroll; verified at 360x800 and 360x640 (tasks 9)      |
| Shape-only state cues are subtle in grayscale                                              | Low        | Dashed vs solid vs filled tile are asserted by computed border-style and tile fill in unit and e2e tests                |

## Rollout

Big bang in one PR; no flag. The PR description links the change-id, says
"Refs #125; closes #125", and attaches the 1440 px and 360 px screenshots.
