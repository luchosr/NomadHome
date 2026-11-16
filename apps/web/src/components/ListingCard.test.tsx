import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { t } from "@nomadhome/shared";
import { ListingCard } from "./ListingCard.js";
import type { SearchResultItem } from "@nomadhome/shared";

const mockListing: SearchResultItem = {
  id: "listing-abc",
  title: "Cozy Lisbon Loft",
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  nightlyRateCents: 8500,
  currency: "EUR",
  totalCents: 59500,
  primaryPhotoUrl: "https://example.com/photo.jpg",
};

function renderCard(listing: SearchResultItem = mockListing) {
  return render(
    <MemoryRouter>
      <ListingCard listing={listing} />
    </MemoryRouter>,
  );
}

describe("ListingCard", () => {
  it("renders the listing title", () => {
    renderCard();
    expect(screen.getByText("Cozy Lisbon Loft")).toBeInTheDocument();
  });

  it("renders city and country", () => {
    renderCard();
    expect(screen.getByText("Lisbon, PT")).toBeInTheDocument();
  });

  it("renders the nightly rate formatted as currency", () => {
    renderCard();
    // €85.00 formatted via Intl.NumberFormat
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it("renders a link pointing to the listing detail page", () => {
    renderCard();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/listings/listing-abc");
  });

  it("renders the primary photo when provided", () => {
    renderCard();
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "Cozy Lisbon Loft");
  });

  it("does not render an img when primaryPhotoUrl is null", () => {
    renderCard({ ...mockListing, primaryPhotoUrl: null });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows WORKSPACE type label for workspace listings", () => {
    renderCard({ ...mockListing, type: "WORKSPACE" });
    expect(screen.getByText(/workspace/i)).toBeInTheDocument();
  });

  // Spec: "Listing cards are comparable" (photo, type, nightly USD price, 2-3 amenities, same positions).
  describe("comparable anatomy", () => {
    // `amenities` (codes) is not on SearchResultItem yet; the green phase adds it to the shared schema.
    const withAmenities = (amenities: string[]) =>
      ({ ...mockListing, currency: "USD", amenities }) as unknown as SearchResultItem;

    it("renders the nightly price in USD", () => {
      renderCard(withAmenities(["wifi", "kitchen"]));
      expect(screen.getByText(/\$85\.00/)).toBeInTheDocument();
    });

    it("renders at most three amenity labels, resolved through t()", () => {
      renderCard(withAmenities(["wifi", "kitchen", "pool", "gym", "ac"]));
      expect(screen.getByText(t("search.filter_amenity_wifi"))).toBeInTheDocument();
      expect(screen.getByText(t("search.filter_amenity_kitchen"))).toBeInTheDocument();
      expect(screen.getByText(t("search.filter_amenity_pool"))).toBeInTheDocument();
      expect(screen.queryByText(t("search.filter_amenity_gym"))).not.toBeInTheDocument();
      expect(screen.queryByText(t("search.filter_amenity_ac"))).not.toBeInTheDocument();
    });

    it("places photo, type, price and amenities in the same order every time", () => {
      renderCard(withAmenities(["wifi", "kitchen"]));
      const photo = screen.getByRole("img");
      const type = screen.getByText(t("host.listings.type_property"));
      const price = screen.getByText(/\$85\.00/);
      const amenity = screen.getByText(t("search.filter_amenity_wifi"));
      const before = (a: Node, b: Node) =>
        Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      expect(before(photo, type)).toBe(true);
      expect(before(type, price)).toBe(true);
      expect(before(price, amenity)).toBe(true);
    });
  });
});
