# platform — Delta for admin-moderation-keeps-focus

## MODIFIED Requirements

### Requirement: Shared primitives follow the design system

The system SHALL provide shared React primitives in `packages/ui` that match the
design system: a `Button` supporting `primary`, `secondary`, `tertiary`, and
`destructive` variants, plus `Badge`, `Input`, `Card`, and `Skeleton`
components. The `Button` default variant MUST be the solid ink primary on the
warm panel system, and all primitives MUST be exported from the package entry
point. Every `Button` variant MUST paint its edge with `border-2` and MUST NOT
use a ring or a box shadow at rest; the secondary variant MUST set `border-border`
on that edge and a disabled secondary MUST keep `border-dashed` and
`border-border-muted` at the same 2px width. A `Button` with
`aria-disabled="true"` MUST look the same as a natively disabled `Button` of the
same variant: dashed muted edge, stone fill and subtle ink for `primary`,
`secondary` and `destructive`, and a struck-through label for `tertiary`. It MUST
show the default cursor, MUST NOT change its look on hover and MUST NOT shift
when pressed. It MUST stay focusable with its focus ring, and MUST NOT use
`pointer-events: none` for this state, so that a pointer press does not move focus
away from it. `aria-disabled` alone does not block activation: the consumer MUST
ignore it. `aria-disabled="false"` or no attribute MUST leave the look unchanged. `Card` MUST render with `border-2`
and `border-border` and no `ring-*` utility, and the shared `FLAT_CARD_CLASS`
override MUST NOT exist. Existing primitive consumers MUST keep working without
prop changes (the `variant` prop is optional and defaults to `primary`); this
change SHALL NOT alter any primitive's public props or behavior, only its
styling and the added `buttonVariants` export.

#### Scenario: Button renders the requested variant

- **GIVEN** the `Button` primitive
- **WHEN** it is rendered with `variant="secondary"`
- **THEN** it renders the secondary (outlined, transparent-fill) treatment
- **AND** rendering with no `variant` prop yields the solid ink primary

#### Scenario: Existing primitive APIs are preserved

- **WHEN** `Button`, `Badge`, `Input`, `Card`, and `Skeleton` are imported from the `packages/ui` entry point
- **THEN** each resolves to a renderable React component accepting the same props as before this change

#### Scenario: Variants have a 2px edge and no ring or shadow

- **GIVEN** each `Button` variant
- **WHEN** its class list is inspected and its computed style is read at rest
- **THEN** it has `border-2`, has no `ring` or `shadow` utility, and its computed box shadow is `none`
- **AND** the secondary variant has `border-border` and no `border` or `ring-1` single-pixel pairing

#### Scenario: Disabled secondary keeps a dashed 2px edge

- **GIVEN** a disabled secondary `Button`
- **WHEN** its class list and computed border are inspected
- **THEN** it has `border-dashed` and `border-border-muted` and a 2px border width

#### Scenario: aria-disabled looks like disabled and stays focusable

- **GIVEN** a `Button` of each variant with `aria-disabled="true"`
- **WHEN** its computed style is read at rest, on hover and while pressed
- **THEN** it matches the natively disabled look of that variant, with the default cursor and no hover or press change
- **AND** it can be focused, stays focused when clicked and does not compute `pointer-events: none`

#### Scenario: aria-disabled false keeps the enabled look

- **GIVEN** a `Button` with `aria-disabled="false"`
- **WHEN** it is rendered and hovered
- **THEN** it looks and behaves as an enabled `Button`

#### Scenario: Card has a 2px edge and no ring

- **GIVEN** a `Card`
- **WHEN** its class list and computed style are inspected
- **THEN** it has `border-2` and `border-border`, no `ring-` utility and a computed box shadow of `none`
- **AND** no source file exports or references `FLAT_CARD_CLASS`

### Requirement: Moderation actions are 44px real buttons with a flat secondary edge

The admin moderation actions SHALL stay real `button` elements, in both layouts, with the same handlers,
labels and accessible names as before, and MUST be at least 44px tall. While the
mutation is pending the action MUST be marked with `aria-disabled="true"` instead of
the native `disabled` attribute, under the same per-row pending condition. Disable MUST stay the
destructive variant, with the paper label on the danger fill. Re-enable MUST stay
the plain secondary variant, with no local override, so that it has a solid 2px
edge from `border-2` and no ring or box shadow. Inside the cards (below `sm`) each action MUST be full
width. Each action MUST be one tab stop.

#### Scenario: Actions are 44px buttons

- **GIVEN** an admin viewing an active account and a disabled account, and a published and a disabled listing, at 1440 px and at 360 px
- **WHEN** the actions of the visible layout are inspected
- **THEN** each Disable and Re-enable is a `button` at least 44px tall and the card actions span the card width at 360 px

#### Scenario: Re-enable has a flat 2px edge

- **GIVEN** a disabled account or listing
- **WHEN** the Re-enable button is inspected
- **THEN** it carries the plain secondary variant classes with no `![box-shadow:none]` and its computed border width is 2px with no box shadow at rest

#### Scenario: Actions still fire the same mutations

- **GIVEN** an active account or published listing and a disabled one
- **WHEN** the admin presses Disable, and separately Re-enable
- **THEN** the same mutation runs with the same arguments and invalidates the same query keys as before this change

### Requirement: Admin restyle changes no behavior

The restyle of the admin screens SHALL NOT change routes, the `RoleGuard`
`admin` condition, API calls, query keys, mutations and their invalidation,
accessible names, the existing `t()` keys, the text of any existing string, the
API client or `Badge`. The Disable and Re-enable handlers and `disabled`
conditions are extended by the `admin` capability requirement "Admin users and
listings pages show pending and error feedback on moderation actions" (per-row pending state, marked with `aria-disabled` so the button keeps focus, and
visible failure feedback); that is the only handler and disabled-state change. No data, schema or backend file MUST change. The moderation
behavior of the `admin` capability is consumed unchanged. The follow-ups (shared
state panel and status tag, the `Badge` pill, per-row accessible names) MUST be
recorded; the secondary button override is closed by the `buttonVariants`
requirements and MUST NOT be recorded as open, and the missing mutation error
handling is closed by the `admin` requirement above and MUST NOT be recorded as
open.

#### Scenario: Admin flows are unchanged

- **GIVEN** an admin disabling and re-enabling an account and a listing
- **WHEN** each action is completed
- **THEN** the same requests with the same arguments are sent and the same queries are invalidated as before this change

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `admin.users`, `admin.listings`, `host.listings.status_*` and `error.generic.unexpected` keys are compared
- **THEN** their keys and values are identical

#### Scenario: No backend or client change

- **GIVEN** the change diff against `origin/main`
- **WHEN** the changed paths are listed
- **THEN** none is under `apps/api/`, `packages/db/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the shared state panel and status tag, the `Badge` pill and the per-row accessible names
- **AND** `FLAT_SECONDARY` and the missing mutation error handling are not listed as open
