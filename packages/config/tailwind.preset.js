/**
 * Shared Tailwind preset for the NomadHome workspace.
 * Apps and the UI package extend this via `presets: [nomadhomePreset]`.
 *
 * Gantry Signage tokens in the warm palette: ember (orange panel), sage, paper,
 * stone and ink. Semantic roles (surface, fg, border, action, success) are the
 * supported API; the raw palette names exist so roles can reference them.
 */
const INK = "#1E1E1E";
const PAPER = "#F7F5F2";
const STONE = "#E5E2DD";
const EMBER = "#E65F35";
const SAGE = "#96A8A6";

export default {
  theme: {
    extend: {
      colors: {
        // Brand palette
        ember: EMBER,
        sage: SAGE,
        paper: PAPER,
        stone: STONE,
        ink: INK,
        // Semantic roles
        surface: {
          DEFAULT: PAPER,
          raised: PAPER,
          inset: STONE,
          inverse: INK,
          ember: EMBER,
          sage: SAGE,
        },
        fg: {
          DEFAULT: INK,
          muted: "#3F3B37",
          subtle: "#57534E",
          inverse: PAPER,
        },
        border: {
          DEFAULT: INK,
          muted: "#6F6A63",
        },
        action: {
          DEFAULT: INK,
          hover: "#333333",
          fg: PAPER,
        },
        success: { DEFAULT: "#2F5F3E", bg: "#E4EEE5" },
        warning: { DEFAULT: "#7A4A00", bg: "#F6E7C1" },
        danger: { DEFAULT: "#9B1C2E", hover: "#7E1625", bg: "#F8E1E0" },
        info: { DEFAULT: "#1F4E79", bg: "#E1EBF3" },
      },
      fontFamily: {
        display: ['"Overpass Variable"', "Overpass", "-apple-system", '"Segoe UI"', "sans-serif"],
        sans: ['"Overpass Variable"', "Overpass", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ["ui-monospace", '"SF Mono"', "Menlo", "Consolas", "monospace"],
      },
      // Fluid sign scale: the larger steps use clamp() and hold at a 360 px viewport.
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        md: "1.125rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "clamp(1.5rem, 1.2rem + 1.4vw, 2rem)",
        "3xl": "clamp(1.75rem, 1.3rem + 2.2vw, 2.75rem)",
        "4xl": "clamp(2.25rem, 1.5rem + 3.6vw, 3.75rem)",
        "5xl": "clamp(2.5rem, 1.6rem + 4.4vw, 5rem)",
        "sign-xl": "clamp(2.75rem, 1.9rem + 4.8vw, 6rem)",
        "sign-numeral": "clamp(3.5rem, 2rem + 7vw, 6rem)",
      },
      lineHeight: {
        solid: "0.92",
        tight: "1.05",
        snug: "1.25",
        body: "1.55",
        loose: "1.7",
      },
      letterSpacing: {
        tight: "-0.03em",
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
      // Sign panels are square or near-square.
      borderRadius: {
        xs: "0px",
        sm: "2px",
        md: "2px",
        lg: "4px",
        card: "4px",
        xl: "4px",
        pill: "4px",
      },
      // Flat elevations: a hard bar under the panel, zero blur.
      boxShadow: {
        xs: "0 1px 0 0 #1E1E1E",
        sm: "0 2px 0 0 #1E1E1E",
        md: "0 4px 0 0 #1E1E1E",
        lg: "0 6px 0 0 #1E1E1E",
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
