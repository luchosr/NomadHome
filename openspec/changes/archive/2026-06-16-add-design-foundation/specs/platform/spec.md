# platform — Delta for add-design-foundation

## ADDED Requirements

### Requirement: Shared design tokens expose the NomadHome brand to Tailwind

The system SHALL expose the NomadHome design tokens through the shared Tailwind
preset (`packages/config/tailwind.preset.js`) so that every workspace app and the
UI package consume one source of brand values. The preset MUST define, under
`theme.extend`, the brand color scales (`sand`, `ink`, `forest`, `terracotta`),
the semantic color roles (e.g. brand primary/accent, fg/bg/border roles), the
font families (`serif`, `sans`, `mono`), the type scale, the spacing scale, the
border radii (including a `card` radius), and the warm shadow elevations defined
in the design system's `colors_and_type.css`.

#### Scenario: Brand utility classes resolve from the preset

- **GIVEN** an app that extends the shared Tailwind preset
- **WHEN** a component uses `bg-forest-700`, `text-ink-900`, `rounded-card`, and `shadow-md`
- **THEN** the build resolves each to the corresponding design-token value
- **AND** no class falls back to an undefined/empty Tailwind value

### Requirement: UI package ships brand base styles and fonts

The system SHALL provide a single shared stylesheet entry point in
`packages/ui` that loads the brand fonts (Instrument Serif, DM Sans, JetBrains
Mono — flagged as Google Fonts substitutions), declares the design-token CSS
custom properties, and applies base element styles: the default canvas is the
sand surface (never pure white), headings use the editorial serif, and
interactive elements expose a visible focus ring. The stylesheet MUST keep the
`@tailwind base/components/utilities` directives.

#### Scenario: Base styles apply the brand canvas and serif headings

- **GIVEN** the UI package stylesheet is imported by an app
- **WHEN** the document body and an `h1` are rendered with no extra classes
- **THEN** the body background resolves to the sand surface token and the `h1` uses the serif font family

### Requirement: Shared primitives follow the design system

The system SHALL provide shared React primitives in `packages/ui` that match the
design system: a `Button` supporting `primary`, `secondary`, `tertiary`, and
`destructive` variants, plus `Badge`, `Input`, and `Card` components. The
`Button` default variant MUST be the forest-filled primary with a 12 px radius,
and all primitives MUST be exported from the package entry point. Existing
`Button` consumers MUST keep working without prop changes (the `variant` prop is
optional and defaults to `primary`).

#### Scenario: Button renders the requested variant

- **GIVEN** the `Button` primitive
- **WHEN** it is rendered with `variant="secondary"`
- **THEN** it renders a forest-bordered, transparent-fill button
- **AND** rendering with no `variant` prop yields the forest-filled primary

#### Scenario: New primitives are exported

- **WHEN** `Badge`, `Input`, and `Card` are imported from the `packages/ui` entry point
- **THEN** each import resolves to a renderable React component
