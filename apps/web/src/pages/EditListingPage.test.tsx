import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditListingPage } from "./EditListingPage.js";
import { ApiError } from "../api/client.js";

const mockGetOne = vi.fn();
const mockUpdate = vi.fn();
const mockPublish = vi.fn();
const mockListPhotos = vi.fn();
const mockListAvailability = vi.fn();
const mockUnpublish = vi.fn();
const mockGetUploadUrl = vi.fn();
const mockBlock = vi.fn();

vi.mock("../api/host.js", () => ({
  hostApi: {
    getOne: (...args: unknown[]) => mockGetOne(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    publish: (...args: unknown[]) => mockPublish(...args),
    unpublish: (...args: unknown[]) => mockUnpublish(...args),
  },
}));
vi.mock("../api/photos.js", () => ({
  photoApi: {
    list: (...args: unknown[]) => mockListPhotos(...args),
    deletePhoto: vi.fn(),
    getUploadUrl: (...args: unknown[]) => mockGetUploadUrl(...args),
    register: vi.fn(),
  },
}));
vi.mock("../api/availability.js", () => ({
  availabilityApi: {
    list: (...args: unknown[]) => mockListAvailability(...args),
    block: (...args: unknown[]) => mockBlock(...args),
    deleteBlock: vi.fn(),
  },
}));
vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "h1", email: "host@test.com", roles: ["host"] },
    isLoading: false,
  }),
}));

const mockListing = {
  id: "l1",
  title: "Beach House",
  type: "PROPERTY" as const,
  city: "Porto",
  country: "PT",
  addressLine: "2 Sea Rd",
  description: "Lovely",
  capacity: 3,
  nightlyRateCents: 8000,
  currency: "USD",
  status: "DRAFT" as const,
  amenities: [],
};

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage(id = "l1") {
  return render(
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter initialEntries={[`/host/listings/${id}/edit`]}>
        <Routes>
          <Route path="/host/listings/:id/edit" element={<EditListingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EditListingPage", () => {
  beforeEach(() => {
    mockGetOne.mockReset();
    mockUpdate.mockReset();
    mockPublish.mockReset();
    mockListPhotos.mockReset();
    mockListAvailability.mockReset();
    mockUnpublish.mockReset();
    mockGetUploadUrl.mockReset();
    mockBlock.mockReset();
  });

  it("renders pre-filled listing title", async () => {
    mockGetOne.mockResolvedValue(mockListing);
    mockListPhotos.mockResolvedValue([]);
    mockListAvailability.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByDisplayValue("Beach House")).toBeInTheDocument();
  });

  it("calls hostApi.publish when Publish button clicked", async () => {
    mockGetOne.mockResolvedValue(mockListing);
    mockPublish.mockResolvedValue({ ...mockListing, status: "PUBLISHED" });
    mockListPhotos.mockResolvedValue([]);
    mockListAvailability.mockResolvedValue([]);
    renderPage();

    const publishBtn = await screen.findByRole("button", { name: /publish/i });
    fireEvent.click(publishBtn);

    await waitFor(() => expect(mockPublish).toHaveBeenCalledWith("l1"));
  });

  it("shows no photos text when photos list is empty", async () => {
    mockGetOne.mockResolvedValue(mockListing);
    mockListPhotos.mockResolvedValue([]);
    mockListAvailability.mockResolvedValue([]);
    renderPage();

    await screen.findByDisplayValue("Beach House");
    expect(await screen.findByText(/no photos yet/i)).toBeInTheDocument();
  });
});

// NH-122 identity tests (host-identity, task 1.6; ListingDetailsForm, photos and availability cards
// are covered through the page, and in their own files). jsdom does not compute Tailwind, so shape is
// asserted through class tokens. Selector assumptions:
//  - status tag = the single element whose own text is exactly the status label;
//  - form-level error = the single role="alert" element (ServerErrorAlert);
//  - not-found panel = the single role="alert" element holding the single h1.
// Tests marked GUARD pass before the restyle and must keep passing.

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

const GENERIC = "Something went wrong. Please try again.";

function load(overrides: Record<string, unknown> = {}) {
  mockGetOne.mockResolvedValue({ ...mockListing, ...overrides });
  mockListPhotos.mockResolvedValue([]);
  mockListAvailability.mockResolvedValue([]);
  return renderPage();
}

function expectSharedAlert(alert: HTMLElement) {
  expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
  required(alert.querySelector('[aria-hidden="true"]'), "decorative tile");
}

describe("EditListingPage identity: heading and status row", () => {
  beforeEach(() => {
    mockGetOne.mockReset();
    mockPublish.mockReset();
    mockUnpublish.mockReset();
    mockListPhotos.mockReset();
    mockListAvailability.mockReset();
  });

  it("has exactly one black h1 and no ember surface", async () => {
    const { container } = load();
    await screen.findByDisplayValue("Beach House");
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Edit listing");
    expect(h1s[0]).toHaveClass("font-black", "text-fg");
    expect(container.innerHTML).not.toMatch(/ember/);
  });

  it("GUARD: Draft and Published each match exactly one element", async () => {
    load();
    await screen.findByDisplayValue("Beach House");
    expect(screen.getAllByText("Draft")).toHaveLength(1);
    expect(screen.queryByText("Published")).toBeNull();
  });

  it("GUARD: Published matches exactly one element for a published listing", async () => {
    load({ status: "PUBLISHED" });
    await screen.findByDisplayValue("Beach House");
    expect(screen.getAllByText("Published")).toHaveLength(1);
  });

  it("the draft tag is dashed, never a pill", async () => {
    load();
    await screen.findByDisplayValue("Beach House");
    const tag = screen.getByText("Draft");
    expect(tag).toHaveClass("border-2", "border-dashed");
    expect(tag).not.toHaveClass("rounded-pill");
  });

  it("the published tag is solid ink with an aria-hidden marker", async () => {
    load({ status: "PUBLISHED" });
    await screen.findByDisplayValue("Beach House");
    const tag = screen.getByText("Published");
    expect(tag).toHaveClass("border-2", "border-border");
    expect(tag).not.toHaveClass("border-dashed");
    required(tag.querySelector('[aria-hidden="true"]'), "published marker");
  });

  it("the tag comes before Publish, which is a primary button", async () => {
    load();
    const publish = await screen.findByRole("button", { name: "Publish" });
    const tag = screen.getByText("Draft");
    expect(tag.compareDocumentPosition(publish) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(publish).toHaveClass("bg-action");
  });

  it("Unpublish is a secondary button with the flat 2px edge and keeps its handler", async () => {
    mockUnpublish.mockResolvedValue({ ...mockListing, status: "DRAFT" });
    load({ status: "PUBLISHED" });
    const unpublish = await screen.findByRole("button", { name: "Unpublish" });
    expect(unpublish).toHaveClass("border-2", "text-fg");
    expect(unpublish).not.toHaveClass("bg-action");
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
    await userEvent.click(unpublish);
    await waitFor(() => expect(mockUnpublish).toHaveBeenCalledWith("l1"));
  });
});

describe("EditListingPage identity: errors", () => {
  beforeEach(() => {
    mockGetOne.mockReset();
    mockUpdate.mockReset();
    mockPublish.mockReset();
    mockListPhotos.mockReset();
    mockListAvailability.mockReset();
    mockGetUploadUrl.mockReset();
    mockBlock.mockReset();
  });

  it("a publish error renders one shared alert with the same text", async () => {
    mockPublish.mockRejectedValue(new ApiError(422, { error: "Add at least one photo." }));
    load();
    await userEvent.click(await screen.findByRole("button", { name: "Publish" }));
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Add at least one photo.");
    expectSharedAlert(alert);
  });

  it("a save error renders one shared alert with the same text", async () => {
    mockUpdate.mockRejectedValue(new Error("boom"));
    load();
    await screen.findByDisplayValue("Beach House");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent(GENERIC);
    expectSharedAlert(alert);
  });

  it("an upload error renders one shared alert with the same text and no red paragraph", async () => {
    mockGetUploadUrl.mockRejectedValue(new Error("Upload failed (500)"));
    const { container } = load();
    await screen.findByDisplayValue("Beach House");
    const input = required(container.querySelector<HTMLInputElement>('input[type="file"]'), "file");
    await userEvent.upload(input, new File(["x"], "a.png", { type: "image/png" }));
    expect(await screen.findByText("Upload failed (500)")).toBeInTheDocument();
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Upload failed (500)");
    expectSharedAlert(alert);
    expect(container.innerHTML).not.toMatch(/text-red-600/);
  });

  it("a block error renders one shared alert with the same text", async () => {
    mockBlock.mockRejectedValue(new ApiError(409, { error: "Dates are not available." }));
    load();
    await screen.findByDisplayValue("Beach House");
    fireEvent.change(await screen.findByLabelText("Start date"), {
      target: { value: "2099-01-01" },
    });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2099-01-05" } });
    await userEvent.click(screen.getByRole("button", { name: "Block dates" }));
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Dates are not available.");
    expectSharedAlert(alert);
  });
});

describe("EditListingPage identity: states and fields", () => {
  beforeEach(() => {
    mockGetOne.mockReset();
    mockListPhotos.mockReset();
    mockListAvailability.mockReset();
  });

  it("not found: one alert holding one h1 with the generic text, solid danger edge and a filled tile", async () => {
    mockGetOne.mockRejectedValue(new Error("404"));
    mockListPhotos.mockResolvedValue([]);
    mockListAvailability.mockResolvedValue([]);
    renderPage();
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    const h1 = within(alert).getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(GENERIC);
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    expect(required(alert.querySelector('[aria-hidden="true"]'), "danger tile")).toHaveClass(
      "bg-danger",
    );
  });

  it("loading: aria-busy, no h1 and no pill, rounded or shadow block", () => {
    mockGetOne.mockReturnValue(new Promise(() => {}));
    mockListPhotos.mockReturnValue(new Promise(() => {}));
    mockListAvailability.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const busy = required(container.querySelector('[aria-busy="true"]'), "aria-busy container");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    const classes = [busy, ...Array.from(busy.querySelectorAll("*"))].flatMap((el) =>
      Array.from(el.classList),
    );
    expect(classes.filter((c) => /^(rounded-(pill|md|lg|xl|full)|shadow.*)$/.test(c))).toEqual([]);
  });

  it("select and textarea have the 2px edge and no rounded-md, and labels are bold ink", async () => {
    const { container } = load();
    await screen.findByDisplayValue("Beach House");
    for (const id of ["edit-description", "edit-type"]) {
      const control = required(container.querySelector<HTMLElement>(`#${id}`), id);
      expect(control, id).toHaveClass("border-2", "border-border");
      expect(control, id).not.toHaveClass("rounded-md");
    }
    for (const id of ["edit-title", "edit-description", "edit-type", "edit-capacity"]) {
      const label = required(container.querySelector<HTMLElement>(`label[for="${id}"]`), id);
      expect(label, id).toHaveClass("font-bold", "text-fg");
    }
  });

  it("GUARD: the form adds no aria-describedby", async () => {
    const { container } = load();
    await screen.findByDisplayValue("Beach House");
    expect(container.querySelector("[aria-describedby]")).toBeNull();
  });

  it("Save is a 44px target and keeps being enabled", async () => {
    load();
    await screen.findByDisplayValue("Beach House");
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toHaveClass("min-h-11");
    expect(save).toBeEnabled();
  });
});
