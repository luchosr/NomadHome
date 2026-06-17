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
    login: {
      invalid_credentials: "Invalid email or password.",
    },
    become_host: {
      terms_required: "You must accept the host terms to continue.",
      already_host: "You're already set up as a host.",
    },
  },
  listings: {
    create: {
      invalid_type: "Choose either a property or a workspace.",
      invalid_country: "Enter a valid country code.",
      invalid_capacity: "Capacity must be at least 1.",
      invalid_rate: "Nightly rate must be greater than 0.",
      amenities_required: "Select at least one amenity.",
      unknown_amenity: "One or more selected amenities don't exist.",
    },
    photo: {
      invalid_position: "Position must be a non-negative integer.",
      not_found: "Photo not found.",
      position_conflict: "A photo already exists at that position.",
      forbidden: "You can only manage photos on your own listings.",
    },
    publish: {
      no_photo: "Add at least one photo before publishing.",
    },
    availability: {
      invalid_date: "Date must be in YYYY-MM-DD format.",
      end_before_start: "End date must be after start date.",
      not_found: "Availability block not found.",
      forbidden: "You can only manage availability on your own listings.",
      overlap: "This date range overlaps an existing block.",
    },
    error: {
      not_found: "Listing not found.",
      forbidden: "You can only manage your own listings.",
    },
  },
  search: {
    error: {
      end_before_start: "Check-out must be after check-in.",
      invalid_dates: "Invalid date format. Use YYYY-MM-DD.",
      invalid_page: "Page must be an integer greater than or equal to 1.",
      invalid_page_size: "Page size must be an integer between 1 and 100.",
    },
  },
  booking: {
    error: {
      not_found: "Booking not found.",
      listing_not_found: "Listing not found or not available for booking.",
      self_booking: "You cannot book your own listing.",
      overlap: "These dates are no longer available.",
      not_cancellable: "This booking cannot be cancelled.",
      checkin_passed: "Check-in date has already passed.",
      no_fee_config: "Platform fee configuration is missing. Contact support.",
    },
  },
} as const;

export type Dictionary = typeof en;
