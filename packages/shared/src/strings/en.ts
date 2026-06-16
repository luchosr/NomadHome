/**
 * English-only string dictionary for the MVP.
 *
 * Reserved top-level domains `common`, `error`, and `validation` are always
 * present. Every other top-level domain MUST correspond to a capability folder
 * under `openspec/specs/<capability>/`. See `./README.md` and the `platform`
 * capability spec for the full contract.
 */
export const en = {
  common: {
    app: {
      name: "NomadHome",
      tagline: "Co-living and workspaces for digital nomads",
    },
    action: {
      close: "Close",
    },
  },
  error: {
    generic: {
      unexpected: "Something went wrong. Please try again.",
    },
  },
  validation: {
    required: {
      field: "This field is required.",
    },
    email: {
      invalid: "Enter a valid email address.",
    },
    password: {
      too_short: "Password must be at least 10 characters.",
      needs_letter: "Password must include at least one letter.",
      needs_digit: "Password must include at least one number.",
    },
  },
  identity: {
    register: {
      failed: "We couldn't complete your registration. Please try again.",
    },
  },
} as const;

export type Dictionary = typeof en;
