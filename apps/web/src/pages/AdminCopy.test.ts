import { describe, it, expect, vi, afterEach } from "vitest";
import { en, t } from "@nomadhome/shared";
import type { LocaleKey } from "@nomadhome/shared";
import adminUsersSource from "./AdminUsersPage.tsx?raw";
import adminListingsSource from "./AdminListingsPage.tsx?raw";

// NH-123 task 1.6 (admin-identity D7): the restyle changes no copy. The literals below are the
// baseline values captured before the change. This whole file is a GUARD: it passes today and must
// keep passing, so any key rename or string edit during the restyle fails here.

const ADMIN_USERS = {
  title: "Users",
  email_col: "Email",
  roles_col: "Roles",
  status_col: "Status",
  actions_col: "Actions",
  active: "Active",
  disabled: "Disabled",
  disable: "Disable",
  enable: "Re-enable",
  no_users: "No users found.",
};

const ADMIN_LISTINGS = {
  title: "Listings",
  title_col: "Title",
  type_col: "Type",
  city_col: "City",
  host_col: "Host",
  status_col: "Status",
  actions_col: "Actions",
  disable: "Disable",
  enable: "Re-enable",
  no_listings: "No listings found.",
};

const LISTING_STATUS = {
  status_draft: "Draft",
  status_published: "Published",
  status_disabled: "Disabled",
};

const LISTING_TYPE = {
  type_property: "Property",
  type_workspace: "Workspace",
};

const OTHER_KEYS: Record<string, string> = {
  "error.generic.unexpected": "Something went wrong. Please try again.",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin copy is unchanged (NH-123)", () => {
  it("admin.users keys and values equal the baseline", () => {
    expect(en.admin.users).toEqual(ADMIN_USERS);
  });

  it("admin.listings keys and values equal the baseline", () => {
    expect(en.admin.listings).toEqual(ADMIN_LISTINGS);
  });

  it("host.listings.status_* values equal the baseline", () => {
    const actual = Object.fromEntries(
      Object.entries(en.host.listings).filter(([k]) => k.startsWith("status_")),
    );
    expect(actual).toEqual(LISTING_STATUS);
  });

  it("host.listings.type_property and type_workspace equal the baseline", () => {
    const actual = Object.fromEntries(
      Object.entries(en.host.listings).filter(([k]) => k.startsWith("type_")),
    );
    expect(actual).toEqual(LISTING_TYPE);
  });

  it("t() resolves every baseline literal to the same string", () => {
    const entries: [string, string][] = [
      ...Object.entries(ADMIN_USERS).map(([k, v]): [string, string] => [`admin.users.${k}`, v]),
      ...Object.entries(ADMIN_LISTINGS).map(([k, v]): [string, string] => [
        `admin.listings.${k}`,
        v,
      ]),
      ...Object.entries(LISTING_STATUS).map(([k, v]): [string, string] => [
        `host.listings.${k}`,
        v,
      ]),
      ...Object.entries(LISTING_TYPE).map(([k, v]): [string, string] => [`host.listings.${k}`, v]),
      ...Object.entries(OTHER_KEYS),
    ];
    for (const [key, value] of entries) {
      expect(t(key as LocaleKey)).toBe(value);
    }
  });

  it("every key the admin screens read exists in the dictionary", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const keys = new Set<string>();
    for (const source of [adminUsersSource, adminListingsSource]) {
      for (const match of source.matchAll(/\bt\(\s*"([a-z0-9_.]+)"\s*\)/g)) {
        keys.add(match[1] as string);
      }
    }
    expect(keys.size).toBeGreaterThan(15);
    for (const key of keys) {
      expect(t(key as LocaleKey), key).not.toMatch(/^<key-not-found/);
    }
    expect(warn).not.toHaveBeenCalled();
  });
});
