/**
 * Shared Tailwind preset for the NomadHome workspace.
 * Apps and the UI package extend this via `presets: [nomadhomePreset]`.
 *
 * Gantry Signage tokens: signal yellow, black, white and sign green.
 * Semantic roles (surface, fg, border, action, success) are the supported
 * API; the raw palette names exist so roles can reference them.
 */
const BLACK = "#0A0A0A";
const WHITE = "#FFFFFF";
const SIGNAL = "#FFC700";
const SIGN_GREEN = "#00704A";

export default {
  theme: {
    extend: {
      colors: {
        // Brand palette
        signal: SIGNAL,
        "sign-green": SIGN_GREEN,
        black: BLACK,
        white: WHITE,
        // Semantic roles
        surface: {
          DEFAULT: WHITE,
          raised: WHITE,
          inset: "#F2F2F2",
          inverse: BLACK,
          signal: SIGNAL,
          green: SIGN_GREEN,
        },
        fg: {
          DEFAULT: BLACK,
          muted: "#404040",
          subtle: "#545454",
          inverse: WHITE,
        },
        border: {
          DEFAULT: BLACK,
          muted: "#767676",
        },
        action: {
          DEFAULT: BLACK,
          hover: "#2B2B2B",
          fg: WHITE,
        },
        success: { DEFAULT: SIGN_GREEN, bg: "#E3F1EA" },
        warning: { DEFAULT: "#7A4F00", bg: "#FFF1B8" },
        danger: { DEFAULT: "#B00020", hover: "#8A0019", bg: "#FBE3E6" },
        info: { DEFAULT: "#00508C", bg: "#E1EDF7" },
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
        xs: "0 1px 0 0 #0A0A0A",
        sm: "0 2px 0 0 #0A0A0A",
        md: "0 4px 0 0 #0A0A0A",
        lg: "0 6px 0 0 #0A0A0A",
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
