import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
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
});
