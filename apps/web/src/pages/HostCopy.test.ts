import { describe, it, expect, vi, afterEach } from "vitest";
import { en, t } from "@nomadhome/shared";
import type { LocaleKey } from "@nomadhome/shared";
import hostListingsSource from "./HostListingsPage.tsx?raw";
import hostUpcomingSource from "./HostUpcomingPage.tsx?raw";
import createListingSource from "./CreateListingPage.tsx?raw";
import editListingSource from "./EditListingPage.tsx?raw";
import becomeHostSource from "./BecomeHostPage.tsx?raw";
import createFormSource from "../components/CreateListingForm.tsx?raw";
import detailsFormSource from "../components/ListingDetailsForm.tsx?raw";
import photosSource from "../components/ListingPhotosCard.tsx?raw";
import availabilitySource from "../components/ListingAvailabilityCard.tsx?raw";
import amenitySource from "../components/AmenityCheckboxGrid.tsx?raw";
import { AMENITIES } from "../lib/listingData.js";

// NH-122 task 1.10 (host-identity D8): the restyle changes no copy. The literals below are the
// baseline values captured before the change. This whole file is a GUARD: it passes today and must
// keep passing, so any key rename or string edit during the restyle fails here.

const HOST_LISTINGS = {
  title: "My Listings",
  new_listing: "New listing",
  edit: "Edit",
  no_listings: "You have no listings yet.",
  status_draft: "Draft",
  status_published: "Published",
  status_disabled: "Disabled",
  publish: "Publish",
  unpublish: "Unpublish",
  save: "Save changes",
  create_title: "Create a new listing",
  edit_title: "Edit listing",
  field_title: "Title",
  field_description: "Description",
  field_type: "Type",
  field_city: "City",
  field_country: "Country (2-letter code)",
  field_address: "Address",
  field_capacity: "Capacity (guests)",
  field_rate: "Nightly rate",
  field_currency: "Currency",
  field_amenities: "Amenities",
  type_property: "Property",
  type_workspace: "Workspace",
  country_placeholder: "Select a country…",
  creating: "Creating…",
  hint_title: "Give your space a clear, catchy name (min 5 characters).",
  hint_description:
    "Describe amenities, vibe, and what makes your space unique (min 20 characters).",
  hint_type: "Property = a place to sleep and live. Workspace = a desk or office.",
  hint_city: "The city where guests will stay (e.g. Madrid, Lisbon).",
  hint_country: "Select the country where your listing is located.",
  hint_address: "Street name and number (e.g. Calle del Pez 12, Malasaña).",
  hint_capacity: "Maximum number of guests the space can accommodate.",
  hint_rate: "Price per night in the selected currency (e.g. 75 for €75.00).",
  hint_currency: "Select the currency you want to charge guests in.",
  hint_amenities: "Select all that apply — guests can filter by these.",
  confirmed_booking_singular: "confirmed booking",
  confirmed_booking_plural: "confirmed bookings",
  amenity_wifi: "Wi-Fi",
  amenity_kitchen: "Kitchen",
  amenity_workspace_desk: "Dedicated desk",
  amenity_meeting_room: "Meeting room",
  amenity_phone_booth: "Phone booth",
  amenity_laundry: "Laundry",
  amenity_air_conditioning: "Air conditioning",
  amenity_heating: "Heating",
  amenity_parking: "Parking",
  amenity_coffee: "Coffee",
};

const HOST_BOOKINGS = {
  title: "All Bookings",
  no_bookings: "No bookings yet.",
  no_bookings_cta: "View my listings",
  listing_col: "Listing",
  guest_col: "Guest",
  checkin_col: "Check-in",
  checkout_col: "Check-out",
  status_col: "Status",
  amount_col: "Amount",
};

const HOST_PHOTOS = {
  title: "Photos",
  upload: "Upload photo",
  delete: "Delete",
  uploading: "Uploading...",
  no_photos: "No photos yet.",
};

const HOST_AVAILABILITY = {
  title: "Blocked dates",
  start_label: "Start date",
  end_label: "End date",
  block: "Block dates",
  delete: "Remove",
  no_blocks: "No blocked dates.",
  overlap_error: "These dates overlap with an existing blocked period.",
};

const BECOME_HOST = {
  title: "Become a host",
  subtitle: "Set up your host profile to start listing properties and workspaces.",
  display_name_label: "Display name",
  payout_email_label: "Payout email",
  terms_label: "I accept the host terms and conditions",
  submit: "Become a host",
  terms_required: "You must accept the host terms to continue.",
  already_host: "You're already set up as a host.",
  email_not_verified: "Please verify your email address before becoming a host.",
};

const BOOKING_STATUS: Record<string, string> = {
  status_pending: "Pending Payment",
  status_confirmed: "Confirmed",
  status_cancelled: "Cancelled",
  status_completed: "Completed",
};

const OTHER_KEYS: Record<string, string> = {
  "error.generic.unexpected": "Something went wrong. Please try again.",
};

const SOURCES = [
  hostListingsSource,
  hostUpcomingSource,
  createListingSource,
  editListingSource,
  becomeHostSource,
  createFormSource,
  detailsFormSource,
  photosSource,
  availabilitySource,
  amenitySource,
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("host copy is unchanged (NH-122)", () => {
  it("host.listings keys and values equal the baseline", () => {
    expect(en.host.listings).toEqual(HOST_LISTINGS);
  });

  it("host.bookings keys and values equal the baseline", () => {
    expect(en.host.bookings).toEqual(HOST_BOOKINGS);
  });

  it("host.photos keys and values equal the baseline", () => {
    expect(en.host.photos).toEqual(HOST_PHOTOS);
  });

  it("host.availability keys and values equal the baseline", () => {
    expect(en.host.availability).toEqual(HOST_AVAILABILITY);
  });

  it("identity.become_host keys and values equal the baseline", () => {
    expect(en.identity.become_host).toEqual(BECOME_HOST);
  });

  it("booking.dashboard.status_* values equal the baseline", () => {
    const actual = Object.fromEntries(
      Object.entries(en.booking.dashboard).filter(([k]) => k.startsWith("status_")),
    );
    expect(actual).toEqual(BOOKING_STATUS);
  });

  it("t() resolves every baseline literal to the same string", () => {
    const entries: [string, string][] = [
      ...Object.entries(HOST_LISTINGS).map(([k, v]): [string, string] => [`host.listings.${k}`, v]),
      ...Object.entries(HOST_BOOKINGS).map(([k, v]): [string, string] => [`host.bookings.${k}`, v]),
      ...Object.entries(HOST_PHOTOS).map(([k, v]): [string, string] => [`host.photos.${k}`, v]),
      ...Object.entries(HOST_AVAILABILITY).map(([k, v]): [string, string] => [
        `host.availability.${k}`,
        v,
      ]),
      ...Object.entries(BECOME_HOST).map(([k, v]): [string, string] => [
        `identity.become_host.${k}`,
        v,
      ]),
      ...Object.entries(BOOKING_STATUS).map(([k, v]): [string, string] => [
        `booking.dashboard.${k}`,
        v,
      ]),
      ...Object.entries(OTHER_KEYS),
    ];
    for (const [key, value] of entries) {
      expect(t(key as LocaleKey)).toBe(value);
    }
  });

  it("every key the host screens read exists in the dictionary", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const keys = new Set<string>();
    for (const source of SOURCES) {
      for (const match of source.matchAll(/\bt\(\s*"([a-z0-9_.]+)"\s*\)/g)) {
        keys.add(match[1] as string);
      }
    }
    for (const { labelKey } of AMENITIES) keys.add(labelKey);
    expect(keys.size).toBeGreaterThan(30);
    for (const key of keys) {
      expect(t(key as LocaleKey), key).not.toMatch(/^<key-not-found/);
    }
    expect(warn).not.toHaveBeenCalled();
  });
});
