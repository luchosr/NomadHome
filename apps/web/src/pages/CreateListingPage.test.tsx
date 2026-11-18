import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateListingPage } from "./CreateListingPage.js";

const mockCreate = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../api/host.js", () => ({
  hostApi: { create: (...args: unknown[]) => mockCreate(...args) },
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "h1", email: "host@test.com", roles: ["host"] },
    isLoading: false,
  }),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter>
        <CreateListingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CreateListingPage", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockNavigate.mockReset();
  });

  it("renders all required form fields", () => {
    renderPage();
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^description$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^city$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^country/i)).toBeInTheDocument();
  });

  it("calls hostApi.create and navigates to edit page on submit", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ id: "new-l1", title: "Test" });
    renderPage();

    await user.type(screen.getByLabelText(/^title$/i), "Test Listing");
    await user.type(
      screen.getByLabelText(/^description$/i),
      "A long enough description for the listing",
    );
    await user.type(screen.getByLabelText(/^city$/i), "Lisbon");
    await user.selectOptions(screen.getByLabelText(/^country/i), "PT");
    await user.type(screen.getByLabelText(/^address/i), "1 Main St");
    await user.clear(screen.getByLabelText(/^capacity/i));
    await user.type(screen.getByLabelText(/^capacity/i), "2");
    await user.clear(screen.getByLabelText(/^nightly rate/i));
    await user.type(screen.getByLabelText(/^nightly rate/i), "100");

    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledOnce());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/host/listings/new-l1/edit"));
  });
});

// NH-122 identity tests (host-identity, task 1.5; they also cover CreateListingForm). jsdom does not
// compute Tailwind, so shape is asserted through class tokens. Selector assumptions:
//  - label = label[for=<field id>]; control = the element with that id;
//  - field error = the element with id "<field id>-error" (FormField convention, errorIdFor);
//  - hint = the element holding the hint text; form-level error = the single role="alert" element.
// Tests marked GUARD pass before the restyle and must keep passing.

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

const HINT_TITLE = "Give your space a clear, catchy name (min 5 characters).";
const ERROR_TITLE = "At least 5 characters required";

type User = ReturnType<typeof userEvent.setup>;

async function fillValid(user: User) {
  await user.type(screen.getByLabelText(/^title$/i), "Test Listing");
  await user.type(
    screen.getByLabelText(/^description$/i),
    "A long enough description for the listing",
  );
  await user.type(screen.getByLabelText(/^city$/i), "Lisbon");
  await user.selectOptions(screen.getByLabelText(/^country/i), "PT");
  await user.type(screen.getByLabelText(/^address/i), "1 Main St");
  await user.clear(screen.getByLabelText(/^capacity/i));
  await user.type(screen.getByLabelText(/^capacity/i), "2");
  await user.clear(screen.getByLabelText(/^nightly rate/i));
  await user.type(screen.getByLabelText(/^nightly rate/i), "100");
}

function labelFor(container: HTMLElement, id: string): HTMLElement {
  return required(container.querySelector<HTMLElement>(`label[for="${id}"]`), `label ${id}`);
}

describe("CreateListingPage identity: heading, labels and controls", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockNavigate.mockReset();
  });

  it("has exactly one black h1", () => {
    renderPage();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Create a new listing");
    expect(h1s[0]).toHaveClass("font-black", "text-fg");
  });

  it("every label is bold ink, and so is the amenities legend", () => {
    const { container } = renderPage();
    for (const id of [
      "title",
      "description",
      "type",
      "city",
      "country",
      "addressLine",
      "capacity",
      "nightlyRate",
      "currency",
    ]) {
      expect(labelFor(container, id), id).toHaveClass("font-bold", "text-fg");
    }
    expect(screen.getByText("Amenities", { selector: "legend" })).toHaveClass(
      "font-bold",
      "text-fg",
    );
  });

  it("select and textarea controls have the 2px ink edge and no rounded-md", () => {
    const { container } = renderPage();
    for (const id of ["description", "type", "country", "currency"]) {
      const control = required(container.querySelector<HTMLElement>(`#${id}`), `control ${id}`);
      expect(control, id).toHaveClass("border-2", "border-border");
      expect(control, id).not.toHaveClass("rounded-md");
    }
  });

  it("each hint renders with a muted left bar while its field is valid", () => {
    renderPage();
    const hint = screen.getByText(HINT_TITLE);
    expect(hint).toHaveClass("border-l-4", "border-border-muted");
    expect(screen.getByLabelText(/^title$/i)).not.toHaveAttribute("aria-describedby");
  });

  it("an invalid field keeps aria-invalid and shows the danger bar error instead of the hint", async () => {
    const user = userEvent.setup();
    renderPage();
    const title = screen.getByLabelText(/^title$/i);
    await user.type(title, "ab");

    const error = await screen.findByText(ERROR_TITLE);
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(HINT_TITLE)).toBeNull();
    expect(error).toHaveClass("border-l-4", "border-danger", "font-bold", "text-danger");
  });

  it("an invalid control links to its error element with aria-describedby", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    const title = screen.getByLabelText(/^title$/i);
    await user.type(title, "ab");

    const error = await screen.findByText(ERROR_TITLE);
    expect(error.id).not.toBe("");
    expect(container.querySelector(`#${error.id}`)).toBe(error);
    expect(title).toHaveAttribute("aria-describedby", error.id);
  });

  it("GUARD: a field that becomes valid again drops aria-describedby and shows its hint", async () => {
    const user = userEvent.setup();
    renderPage();
    const title = screen.getByLabelText(/^title$/i);
    await user.type(title, "ab");
    await screen.findByText(ERROR_TITLE);
    await user.type(title, "cdef");
    await waitFor(() => expect(screen.queryByText(ERROR_TITLE)).toBeNull());
    expect(title).not.toHaveAttribute("aria-describedby");
    expect(screen.getByText(HINT_TITLE)).toBeInTheDocument();
  });
});

describe("CreateListingPage identity: submit and errors", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockNavigate.mockReset();
  });

  it("the submit button is a 44px target and disabled while the form is invalid", () => {
    renderPage();
    const submit = screen.getByRole("button", { name: "Create a new listing" });
    expect(submit).toHaveClass("min-h-11");
    expect(submit).toBeDisabled();
  });

  it("GUARD: the submit button is enabled once valid and the payload is unchanged", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ id: "new-l1", title: "Test" });
    renderPage();
    await fillValid(user);
    const submit = screen.getByRole("button", { name: "Create a new listing" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    await waitFor(() => expect(mockCreate).toHaveBeenCalledOnce());
    expect(mockCreate).toHaveBeenCalledWith({
      title: "Test Listing",
      description: "A long enough description for the listing",
      type: "PROPERTY",
      city: "Lisbon",
      country: "PT",
      addressLine: "1 Main St",
      capacity: 2,
      nightlyRate: 100,
      currency: "EUR",
      nightlyRateCents: 10000,
      amenityCodes: [],
    });
  });

  it("GUARD: the submit button is disabled while submitting", async () => {
    const user = userEvent.setup();
    mockCreate.mockReturnValue(new Promise(() => {}));
    renderPage();
    await fillValid(user);
    const submit = screen.getByRole("button", { name: "Create a new listing" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    expect(await screen.findByRole("button", { name: "Creating…" })).toBeDisabled();
  });

  it("a server error renders exactly one shared alert with the same text", async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValue(new Error("boom"));
    renderPage();
    await fillValid(user);
    const submit = screen.getByRole("button", { name: "Create a new listing" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Something went wrong. Please try again.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    required(alert.querySelector('[aria-hidden="true"]'), "decorative tile");
  });
});
