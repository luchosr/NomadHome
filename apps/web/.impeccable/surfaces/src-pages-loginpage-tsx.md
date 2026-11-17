---
version: 1
slug: "src-pages-loginpage-tsx"
primary_target: "src/pages/LoginPage.tsx"
related_targets: ["src/pages/RegisterPage.tsx", "src/pages/VerifyEmailPage.tsx"]
---

## Scope and visitor mode

Login, Register and VerifyEmail: Operate, inheriting the landing world (gantry signage). The task is to get through the form or learn the verification result, quickly and without ambiguity.

## Audience, job, action, proof, constraints

- Audience: a nomad signing in, creating an account, or following the link in a verification email.
- Job: authenticate, register, or confirm an email address.
- Action: submit the form; on verify, follow the single action link (Log in on success, Register on error).
- Proof: none invented. No testimonials, claims or photography on these screens.
- Constraints: Tailwind + shadcn/ui + packages/ui, t() for all copy, WCAG 2.1 AA, 360 px to 1440 px, no route, API, schema or validation change. The shared FormField and ServerErrorAlert are restyled in place, so BecomeHostPage inherits the new field and form-level error look.

## Direction contract

THESIS: A sign-in screen is a gate sign: one ember title band says where you are, one paper panel does the task. Refuses the bare canvas with restyled fields that reads as a different product from the landing.

OWN-WORLD: Same airport and rail wayfinding world. Composition is AuthShell: a full-bleed ember title band (H1 in Black weight, solid leading, ink subtitle) closed by a 2px ink rule, over one paper form panel (2px ink edge, 4px radius) in a 32rem column, with an optional stone footer row holding the route link. Errors stay on paper. State is carried by shape: field errors are left-barred, the form-level error is a filled-tile panel, and the three verify panels are dashed, solid-filled and outlined.

STORY: The visitor recognises NomadHome from the first pixel, believes the form because it is plain and every error is stated next to its cause, and acts by submitting.

FIRST VIEWPORT: Slim navigation, the ember band with title and one-line subtitle, then the paper panel with the fields and the full-width ink submit. At 1440x900 the Login form and the Register form (three fields) fit without a server error; with a server error the Register footer row can fall below the fold. At 360 px it is the same single column. VerifyEmail is one centred 36rem state panel with a 64px tile, one H1 and at most one action.

FORM: Reuse of the Search "ember query band over paper panels" grammar (decision D1). Field error grammar (D4): a 4px danger left bar with bold danger text, tied to the input by aria-describedby, not an alert. Form-level error (D5): a danger-bg panel with a filled danger tile and role alert, rendered on paper. Footer link (D6): bold, always underlined, 44px target, separated from its prompt by an ml-1 margin. Verify (D7): pending is a dashed stone panel with a dashed tile and three ink squares; success is an ember panel with an ink-filled tile and paper check and a Log in link; error is a paper panel with a danger-outlined tile and cross and a Register link, role alert. The verify wrapper carries aria-live polite only outside the error state, so the error is announced once. The action links mirror the primary button through a local class string.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict and DESIGN.md.

## Palette note

No palette or token change. Ember appears only as the title band and the verify success panel; danger never sits on ember; muted ink never sits on ember.

## Unresolved decisions

- Persistent password-rule hint with an enabled Register submit (the submit is disabled until valid, which is pre-existing).
- BecomeHostPage terms checkbox error still uses text-xs text-danger without aria-describedby or the left-bar grammar, and its checkbox target is 16px.
- The verify action Links duplicate the primary button classes because the button variant function is not exported.
- Host, admin and booking screens remain out of scope.
