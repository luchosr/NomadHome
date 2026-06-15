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
  },
} as const;

export type Dictionary = typeof en;
