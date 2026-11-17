# platform — Delta for auth-screens-identity

## ADDED Requirements

### Requirement: Auth screens use the Gantry Signage identity

The login, registration and email-verification screens SHALL render the Gantry
Signage identity in the warm palette with no behavior, route or API change.
The login and registration screens MUST present the page title as an `h1` in a
full-width ember title band (ink text, 2px ink bottom rule, display font set
solid) directly above a single paper form panel with a 2px ink edge, with no
hero photo, illustration or second column. All form controls, labels and error
messages MUST sit inside the paper panel and MUST NOT sit on an ember or sage
surface. The route link ("Sign up" on login, "Log in" on registration) MUST sit
in a stone footer row of the panel and MUST be underlined, not distinguished
by colour or weight alone. All user-facing strings MUST go through `t()`.

#### Scenario: Title band and form panel render the approved colours

- **GIVEN** the login page rendered at a 1440 px viewport
- **WHEN** the title band and the form panel are inspected
- **THEN** the band background resolves to `#E65F35` and its text resolves to the ink token
- **AND** the page title is the only `h1`
- **AND** the form panel background resolves to the paper token and its border width is 2px in the ink token

#### Scenario: Registration uses the same composition

- **GIVEN** the registration page rendered at a 1440 px viewport
- **WHEN** its structure is inspected
- **THEN** it shows the ember title band above one paper form panel containing the email, password and confirm password fields and the submit action
- **AND** the footer row of the panel is on the stone surface and holds an underlined link to `/login`

#### Scenario: Controls and messages never sit on orange

- **GIVEN** the login or registration page in any state, including field errors and a server error
- **WHEN** the nearest opaque background of every input, label and error message is resolved
- **THEN** none resolves to ember or sage

#### Scenario: Primary action keeps the ink panel look

- **GIVEN** the login page with a valid form
- **WHEN** the submit action is inspected
- **THEN** its background resolves to the ink token, its label to the paper token and its border to 2px ink

### Requirement: Auth form fields are labelled, linked to their errors and shape-coded

Every auth form field SHALL have a visible label connected to its input, and
SHALL keep its existing `autocomplete` value (`email`, `current-password`,
`new-password`). A field error MUST render inside the paper panel as a message
with a 4px solid danger rule on its left and 14px bold danger text, MUST carry
an id, and the input MUST reference it through `aria-describedby` only while the
error is shown, alongside `aria-invalid`. Field errors SHALL NOT use
`role="alert"`. A form-level (server) error MUST render as a single panel with
`role="alert"`, a 2px solid danger edge, the danger tint fill and a filled
danger marker tile, directly above the submit action. State MUST NOT depend on
colour alone. Danger text and danger fills MUST NOT sit on an ember or sage
surface. Error text MUST meet 4.5:1 against the surface it sits on.

#### Scenario: Labels and autocomplete are present

- **GIVEN** the login and registration pages
- **WHEN** their fields are inspected
- **THEN** each input has an accessible name from a visible label
- **AND** the email input has `autocomplete="email"`, the login password `current-password`, and the registration password and confirm password `new-password`

#### Scenario: Field error is linked to its input and shaped

- **GIVEN** the login page with the email left empty
- **WHEN** the form is submitted
- **THEN** the email input has `aria-invalid="true"` and an `aria-describedby` that references the visible error message
- **AND** the message has a 4px solid left border in the danger token and 14px bold text in the danger token on the paper surface
- **AND** the message is not a `role="alert"` element

#### Scenario: Error link is removed when the error clears

- **GIVEN** an email field showing a validation error
- **WHEN** the user corrects the value and the error clears
- **THEN** the input no longer has an `aria-describedby` that references the removed message
- **AND** `aria-invalid` is no longer `true`

#### Scenario: Server error is one alert panel with a shape cue

- **GIVEN** the login page where the API rejects the credentials with a message
- **WHEN** the rejection is displayed
- **THEN** exactly one element with `role="alert"` is present and it contains the message exactly as returned or the generic fallback
- **AND** the alert has a 2px solid danger border, a danger-tint background and a filled marker tile
- **AND** it sits inside the paper panel directly above the submit action

#### Scenario: Error pairings pass computed contrast

- **GIVEN** the field error text on paper, the form-level error text on the danger tint, the danger edge on paper and the paper mark on the danger tile
- **WHEN** their contrast ratios are computed with the WCAG 2.1 formula
- **THEN** the text pairings are at least 4.5:1 and the edge pairing at least 3:1

#### Scenario: No invented content or deferred features

- **GIVEN** the login, registration and verification pages
- **WHEN** their content is inspected
- **THEN** no testimonial, statistic, claim of user count, trust badge, price, password-visibility toggle, password-recovery link or alternative sign-in provider is present

### Requirement: Email verification result is shown as one of three distinct sign panels

The email verification screen SHALL render exactly one of three sign panels, each
with exactly one `h1` and each distinguishable by shape without colour. The
pending panel MUST have a stone fill, a dashed 2px ink edge, a dashed-edge tile
with three solid squares and no animation, and MUST be exposed as a polite
busy status. The success panel MUST have an ember fill, a solid 2px ink edge, an
ink-filled tile with a paper check, ink text and an ink primary link to
`/login`. The error panel MUST have a paper fill, a solid 2px ink edge, an
outlined tile with a 2px solid danger edge and a danger cross, ink text and an
ink primary link to `/register`, and MUST be exposed with `role="alert"`.
Danger MUST NOT appear on the ember success panel. The verification request, its
single invocation per token and the missing-token handling MUST NOT change.

#### Scenario: Pending state

- **GIVEN** the verification request has not resolved
- **WHEN** the screen is rendered
- **THEN** one `h1` shows the pending text
- **AND** the panel is stone with a dashed 2px ink border and is exposed as a status with `aria-busy="true"`
- **AND** the tile has a dashed border and no element inside the panel animates

#### Scenario: Success state

- **GIVEN** the verification request resolves successfully
- **WHEN** the screen settles
- **THEN** one `h1` shows the success title and the success body is visible
- **AND** the panel background resolves to `#E65F35` with a solid 2px ink border and ink text
- **AND** the tile fill resolves to the ink token and the link to `/login` is an ink-filled primary action

#### Scenario: Error state

- **GIVEN** the verification request rejects, or the URL has no token
- **WHEN** the screen settles
- **THEN** one `h1` shows the error title and the error body is visible
- **AND** the panel is paper with a solid 2px ink border and is exposed with `role="alert"`
- **AND** the tile has a 2px solid danger border and a danger cross on a paper fill
- **AND** the link to `/register` is an ink-filled primary action

#### Scenario: States are distinguishable in grayscale

- **GIVEN** the three states rendered in grayscale
- **WHEN** their panel border styles, tile fills and glyphs are compared
- **THEN** pending is dashed, success is solid with a filled tile and a check, and error is solid with an outlined tile and a cross
- **AND** no two states share the same combination

#### Scenario: Verification behaviour is unchanged

- **GIVEN** the verification page opened with a token
- **WHEN** the screen renders and re-renders
- **THEN** the verification request is made once with that token
- **AND** with no token the request is not made and the error state is shown

### Requirement: Auth screens are usable at 360 px, by keyboard and with reduced motion

The login, registration and verification screens SHALL render without
horizontal scrolling and without clipped content at a 360 px viewport in every
state, including long typed values, long server messages and the three
verification states. Keyboard focus order MUST follow the visual order (email,
password, confirm password where present, submit, route link) with a visible
two-layer focus ring on every interactive element. The route link and the
verification actions MUST have a target at least 44px tall. The screens MUST
NOT introduce animation, and colour transitions MUST be neutralised under
`prefers-reduced-motion: reduce`.

#### Scenario: No horizontal overflow at 360 px

- **GIVEN** the login, registration and verification screens rendered at 360 px width
- **WHEN** each is shown with field errors, with a long server error message and in each verification state
- **THEN** the document scroll width does not exceed the viewport width
- **AND** the title, every field, the submit action and the route link are inside the viewport

#### Scenario: First viewport at 360 px

- **GIVEN** the login page at 360 by 800 px
- **WHEN** the first viewport is inspected
- **THEN** the title, both fields and the submit action are visible without scrolling

#### Scenario: Keyboard order and focus ring

- **GIVEN** the registration page focused at the document start
- **WHEN** the user presses Tab repeatedly
- **THEN** focus visits the email, password, confirm password, submit action and the log-in link in that order
- **AND** each focused element shows a 3px outline in the ink token with a paper gap ring

#### Scenario: Reduced motion

- **GIVEN** a user with `prefers-reduced-motion: reduce`
- **WHEN** any auth screen is used
- **THEN** no element inside the screen content animates and colour transitions complete without delay

### Requirement: Auth screen restyle changes no behavior

The restyle of the login, registration and verification screens SHALL NOT change
routes, request payloads, validation rules and messages, redirect targets, the
set of `t()` keys, or the text of any existing string. Login success MUST still
redirect by role or to the explicit `from` target; registration MUST still send
the same request and navigate as before; the registration submit MUST remain
disabled until the form is valid.

#### Scenario: Login redirect and error behavior are unchanged

- **GIVEN** the login page with credentials that the API accepts or rejects
- **WHEN** the form is submitted
- **THEN** an accepted login redirects exactly as before (explicit `from`, or by role)
- **AND** a rejected login shows the server message or the generic fallback in the single alert

#### Scenario: Registration request and validation are unchanged

- **GIVEN** the registration page
- **WHEN** a valid form is submitted and when passwords differ or are too short
- **THEN** the same register call is made with the email and password only on a valid form
- **AND** the same validation messages appear and the submit stays disabled while the form is invalid

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `auth` and `identity.verify_email` groups are compared
- **THEN** their keys and values are identical
