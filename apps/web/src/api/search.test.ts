import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchApi, type SearchParams } from "./search.js";

const mockApiFetch = vi.fn();

vi.mock("./client.js", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

function lastQuery(): URLSearchParams {
  const url = mockApiFetch.mock.calls.at(-1)?.[0] as string;
  expect(url.startsWith("/search?")).toBe(true);
  return new URLSearchParams(url.slice("/search?".length));
}

beforeEach(() => {
  mockApiFetch.mockReset();
  mockApiFetch.mockResolvedValue({ data: [], pagination: {} });
});

describe("searchApi.search", () => {
  it("sends only page=1 when no params are given (URL shape unchanged)", async () => {
    await searchApi.search({});
    expect(mockApiFetch).toHaveBeenCalledWith("/search?page=1");
  });

  it("keeps the existing filter params and does not add pageSize", async () => {
    await searchApi.search({ city: "Lisbon", page: 2, type: "WORKSPACE", amenities: ["wifi"] });
    const q = lastQuery();
    expect(q.get("page")).toBe("2");
    expect(q.get("city")).toBe("Lisbon");
    expect(q.get("type")).toBe("WORKSPACE");
    expect(q.get("amenities")).toBe("wifi");
    expect(q.has("pageSize")).toBe(false);
  });

  it("sends pageSize when provided", async () => {
    // Built as a variable (not a fresh literal) so this red test typechecks before
    // SearchParams gains the optional pageSize field.
    const params: SearchParams & { pageSize?: number } = { page: 1, pageSize: 3 };
    await searchApi.search(params);
    const q = lastQuery();
    expect(q.get("page")).toBe("1");
    expect(q.get("pageSize")).toBe("3");
  });
});
