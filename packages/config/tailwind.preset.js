/**
 * Shared Tailwind preset for the NomadHome workspace.
 * Apps and the UI package extend this via `presets: [nomadhomePreset]`.
 *
 * Tokens mirror the NomadHome design system (`colors_and_type.css`):
 * warm editorial hospitality — sand surfaces, forest brand, terracotta accent.
 */
export default {
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FBF8F2",
          100: "#F5F0E8",
          200: "#ECE4D5",
          300: "#DDD2BE",
          400: "#C4B59B",
        },
        ink: {
          900: "#1A1A1A",
          700: "#3D3A35",
          500: "#6B665E",
          300: "#A39E92",
          100: "#D8D3C7",
        },
        forest: {
          900: "#1C2E27",
          700: "#2E4A3F",
          500: "#4A6F61",
          200: "#B8C9C1",
          50: "#E8EFEB",
        },
        terracotta: {
          900: "#8C3E20",
          700: "#B85A36",
          500: "#D97757",
          200: "#F2C9B5",
          50: "#FBEDE4",
        },
        success: { DEFAULT: "#5B7F5B", bg: "#E5EDE2" },
        warning: { DEFAULT: "#C68A1B", bg: "#F7ECCC" },
        danger: { DEFAULT: "#B04A3A", bg: "#F4DDD5" },
        info: { DEFAULT: "#3A6B8C", bg: "#DDE8EF" },
        // Semantic roles — reference brand scales via CSS vars so themes can override.
        brand: {
          primary: "var(--brand-primary)",
          "primary-hover": "var(--brand-primary-hover)",
          accent: "var(--brand-accent)",
          "accent-hover": "var(--brand-accent-hover)",
        },
      },
      backgroundColor: {
        app: "var(--bg-app)",
        elevated: "var(--bg-elevated)",
        inset: "var(--bg-inset)",
        inverse: "var(--bg-inverse)",
      },
      textColor: {
        "fg-1": "var(--fg-1)",
        "fg-2": "var(--fg-2)",
        "fg-3": "var(--fg-3)",
        "fg-muted": "var(--fg-muted)",
        "fg-inverse": "var(--fg-inverse)",
      },
      borderColor: {
        // role names avoid colliding with Tailwind border-WIDTH utilities (border-1/2)
        subtle: "var(--border-1)", // hairline on cream surfaces
        muted: "var(--border-2)", // hairline on white surfaces
        strong: "var(--border-strong)",
      },
      fontFamily: {
        serif: ['"Instrument Serif"', '"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"DM Sans"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", '"SF Mono"', "Menlo", "monospace"],
      },
      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        md: "18px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "44px",
        "4xl": "60px",
        "5xl": "80px",
      },
      lineHeight: {
        tight: "1.1",
        snug: "1.25",
        body: "1.55",
        loose: "1.7",
      },
      letterSpacing: {
        tight: "-0.02em",
        snug: "-0.01em",
        wide: "0.08em",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
        20: "80px",
        24: "96px",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        card: "16px",
        xl: "24px",
        pill: "999px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(28, 46, 39, 0.04)",
        sm: "0 2px 6px rgba(28, 46, 39, 0.05), 0 1px 2px rgba(28, 46, 39, 0.04)",
        md: "0 6px 18px rgba(28, 46, 39, 0.07), 0 2px 4px rgba(28, 46, 39, 0.04)",
        lg: "0 18px 40px rgba(28, 46, 39, 0.10), 0 4px 10px rgba(28, 46, 39, 0.05)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        "in-out": "cubic-bezier(0.65, 0.05, 0.36, 1)",
      },
      transitionDuration: {
        fast: "140ms",
        med: "220ms",
        slow: "360ms",
      },
    },
  },
  plugins: [],
};
