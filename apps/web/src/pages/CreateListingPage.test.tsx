import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    mockCreate.mockResolvedValue({ id: "new-l1", title: "Test" });
    renderPage();

    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: "Test Listing" } });
    fireEvent.change(screen.getByLabelText(/^description$/i), {
      target: { value: "A description" },
    });
    fireEvent.change(screen.getByLabelText(/^city$/i), { target: { value: "Lisbon" } });
    fireEvent.change(screen.getByLabelText(/^country/i), { target: { value: "PT" } });
    fireEvent.change(screen.getByLabelText(/^address/i), { target: { value: "1 Main St" } });
    fireEvent.change(screen.getByLabelText(/^capacity/i), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(/^nightly rate/i), { target: { value: "10000" } });

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledOnce());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/host/listings/new-l1/edit"));
  });
});
