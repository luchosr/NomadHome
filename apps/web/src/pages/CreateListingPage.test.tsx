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
