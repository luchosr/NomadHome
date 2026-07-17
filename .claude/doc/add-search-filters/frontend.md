# Frontend Implementation Plan — add-search-filters

## Worktree

`/Users/luciano/Documents/IA4devs/nomadhome-worktrees/NH-search-filters`

## Files to change (allowlist)

| File                                     | Action                                                   |
| ---------------------------------------- | -------------------------------------------------------- |
| `apps/web/src/api/search.ts`             | Extend `SearchParams` + serialize filter fields          |
| `apps/web/src/pages/SearchPage.tsx`      | Extend schema, add filter UI, update onSubmit + URL sync |
| `apps/web/src/pages/SearchPage.test.tsx` | Add failing tests (TDD red), then confirm green          |
| `packages/shared/src/strings/en.ts`      | Add filter string keys under `search`                    |

---

## Critical architectural notes (read before touching anything)

### 1. `t()` is compile-time type-safe

`LocaleKey` is derived from `typeof en` via a recursive `Paths<T>` type. This means any `t("search.filter_title")` call in component code will fail TypeScript until that key exists in `en.ts` AND `@nomadhome/shared` has been rebuilt. The build order is:

1. Add keys to `packages/shared/src/strings/en.ts`
2. Run `pnpm --filter @nomadhome/shared build`
3. Only then write component code that calls `t("search.filter_*")`

Skipping step 2 will cause `pnpm typecheck` to error on every new `t()` call in the component.

### 2. Design tokens — use these, not raw Tailwind defaults

The existing `SearchPage.tsx` and `ListingCard.tsx` use `slate-*` classes. For new filter panel elements, align with the design system tokens defined in `packages/config/tailwind.preset.js` and `packages/ui/src/styles/globals.css`:

| Role                  | Token class                                             |
| --------------------- | ------------------------------------------------------- |
| Panel background      | `bg-inset` (sand-200)                                   |
| Elevated surface      | `bg-elevated` (white)                                   |
| Primary body text     | `text-fg-1`                                             |
| Secondary/label text  | `text-fg-2`                                             |
| Muted helper text     | `text-fg-3`                                             |
| Input border          | `border-muted`                                          |
| Strong border (focus) | `border-forest-500`                                     |
| Primary button fill   | `bg-forest-700` (already handled by `Button` component) |
| Danger/reset          | `text-terracotta-700`                                   |

Do **not** use `bg-gray-*`, `border-gray-*`, `text-gray-*` for new elements. The existing `slate-*` usage in the search form row is acceptable to maintain visual consistency with the unchanged fields, but do not extend that pattern further.

### 3. No shadcn Select — use native `<select>`

The `@nomadhome/ui` package exposes only: `Button`, `Input`, `Card`, `Badge`. There is no shadcn `Select` component available. Use a native `<select>` element for the Type filter, styled consistently with the `Input` component's border/radius/padding pattern.

### 4. Price conversion: dollars in form, cents to API

The API and backend schema (`SearchQuerySchema`) use integer cents for `minPrice` / `maxPrice`. The form collects dollars from the user. The conversion in `onSubmit` is:

```
minPriceCents = Math.round(dollarValue * 100)
```

Empty string or undefined form values must be omitted from `SearchParams` (not passed as `NaN`).

### 5. `SearchPage.test.tsx` already exists — append, do not replace

The file has 4 passing tests for the base city/date search flow. The new filter tests must be appended inside the existing `describe("SearchPage", ...)` block. Do not restructure or delete any existing tests.

### 6. `SearchQuerySchema` (shared) is already fully defined

`packages/shared/src/schemas/search.ts` already defines `type`, `amenities`, `minPrice`, `maxPrice`, `capacity` on `SearchQuerySchema`. You do not need to modify the shared schema. The frontend's local `SearchFormSchema` in `SearchPage.tsx` is a separate form-layer schema that maps user inputs to the API params — it can be looser (e.g., coerce empty strings to undefined).

---

## Step-by-step implementation

### STEP 0 — Establish execution order

```
1. Add en.ts strings
2. Build @nomadhome/shared
3. Write failing tests (TDD red) — commit
4. Extend search.ts SearchParams
5. Extend SearchPage.tsx schema + UI + onSubmit
6. Run tests until green — commit
7. Run all quality gates — fix and commit any issues
```

---

### STEP 1 — Add string keys to `packages/shared/src/strings/en.ts`

Inside the existing `search: { ... }` object (after the `per_night` key, before the closing brace), add:

```ts
filter_title: "Filters",
filter_type_label: "Type",
filter_type_all: "All types",
filter_type_property: "Property",
filter_type_workspace: "Workspace",
filter_amenities_label: "Amenities",
filter_min_price_label: "Min price ($/night)",
filter_max_price_label: "Max price ($/night)",
filter_capacity_label: "Min guests",
filter_reset: "Reset filters",
```

After adding, run:

```bash
pnpm --filter @nomadhome/shared build
```

This regenerates the TypeScript declaration file so `LocaleKey` includes all new `search.filter_*` keys.

---

### STEP 2 — Write failing tests (TDD red)

Append inside `describe("SearchPage", () => { ... })` in `apps/web/src/pages/SearchPage.test.tsx`:

**Test: filter panel renders**

```ts
it("renders filter panel with type select, price inputs, and capacity input", () => {
  renderSearch();
  // Type filter — native select
  expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  // Price inputs
  expect(screen.getByLabelText(/min price/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/max price/i)).toBeInTheDocument();
  // Capacity input
  expect(screen.getByLabelText(/min guests/i)).toBeInTheDocument();
});
```

**Test: type filter passes type to API**

```ts
it("calls searchApi.search with type=WORKSPACE when workspace type is selected", async () => {
  mockSearch.mockResolvedValue(mockSearchResult);
  renderSearch();

  await userEvent.type(screen.getByLabelText(/city/i), "Lisbon");
  // Select type
  await userEvent.selectOptions(screen.getByLabelText(/type/i), "WORKSPACE");
  await userEvent.click(screen.getByRole("button", { name: /search/i }));

  await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
  expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ type: "WORKSPACE" }));
});
```

**Test: price range converts dollars to cents**

```ts
it("converts dollar min/max price inputs to cents before calling API", async () => {
  mockSearch.mockResolvedValue(mockSearchResult);
  renderSearch();

  await userEvent.type(screen.getByLabelText(/city/i), "Lisbon");
  fireEvent.change(screen.getByLabelText(/min price/i), { target: { value: "50" } });
  fireEvent.change(screen.getByLabelText(/max price/i), { target: { value: "150" } });
  await userEvent.click(screen.getByRole("button", { name: /search/i }));

  await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
  expect(mockSearch).toHaveBeenCalledWith(
    expect.objectContaining({ minPrice: 5000, maxPrice: 15000 }),
  );
});
```

**Test: capacity filter**

```ts
it("calls searchApi.search with capacity=2 when capacity is set to 2", async () => {
  mockSearch.mockResolvedValue(mockSearchResult);
  renderSearch();

  await userEvent.type(screen.getByLabelText(/city/i), "Lisbon");
  fireEvent.change(screen.getByLabelText(/min guests/i), { target: { value: "2" } });
  await userEvent.click(screen.getByRole("button", { name: /search/i }));

  await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
  expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ capacity: 2 }));
});
```

**Test: shareable URL restores filter state**

```ts
it("restores filter state from URL params on mount", () => {
  renderSearch(["/search?city=Lisbon&type=WORKSPACE&minPrice=50"]);
  const typeSelect = screen.getByLabelText(/type/i) as HTMLSelectElement;
  expect(typeSelect.value).toBe("WORKSPACE");
  const minPriceInput = screen.getByLabelText(/min price/i) as HTMLInputElement;
  expect(minPriceInput.value).toBe("50");
});
```

Commit message: `test(search): red tests for add-search-filters`

---

### STEP 3 — Extend `apps/web/src/api/search.ts`

**New `SearchParams` interface:**

```ts
export interface SearchParams {
  city: string;
  checkIn?: string;
  checkOut?: string;
  page?: number;
  // Filter fields
  type?: "PROPERTY" | "WORKSPACE";
  amenities?: string[];
  minPrice?: number; // in cents
  maxPrice?: number; // in cents
  capacity?: number;
}
```

**Updated `search()` method** — serialize all filter fields into `URLSearchParams`:

```ts
search(params: SearchParams): Promise<SearchResponse> {
  const q = new URLSearchParams({ city: params.city, page: String(params.page ?? 1) });
  if (params.checkIn) q.set("checkIn", params.checkIn);
  if (params.checkOut) q.set("checkOut", params.checkOut);
  if (params.type) q.set("type", params.type);
  if (params.amenities && params.amenities.length > 0) q.set("amenities", params.amenities.join(","));
  if (params.minPrice !== undefined) q.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) q.set("maxPrice", String(params.maxPrice));
  if (params.capacity !== undefined) q.set("capacity", String(params.capacity));
  return apiFetch(`/search?${q.toString()}`);
},
```

---

### STEP 4 — Update `apps/web/src/pages/SearchPage.tsx`

#### 4a. Extend `SearchFormSchema`

Replace the existing schema definition with:

```ts
const LISTING_TYPES = ["", "PROPERTY", "WORKSPACE"] as const;
const AMENITY_CODES = ["wifi", "parking", "pool", "gym", "kitchen", "ac"] as const;

const SearchFormSchema = z
  .object({
    city: z.string().min(1, t("validation.required.field")),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    // Filter fields
    type: z.enum(LISTING_TYPES).default(""),
    amenities: z.array(z.string()).default([]),
    minPrice: z.coerce.number().min(0).optional().or(z.literal("")),
    maxPrice: z.coerce.number().min(0).optional().or(z.literal("")),
    capacity: z.coerce.number().int().min(1).optional().or(z.literal("")),
  })
  .refine((d) => !d.checkIn || !d.checkOut || d.checkOut > d.checkIn, {
    message: t("search.error.end_before_start"),
    path: ["checkOut"],
  });

type SearchFormInput = z.infer<typeof SearchFormSchema>;
```

Note on `z.literal("")`: Using `.or(z.literal(""))` allows number fields to accept empty string (what HTML number inputs produce when cleared) without failing validation. The `onSubmit` handler then checks for `""` and omits those fields.

#### 4b. Extend `activeSearch` init state — read filter params from URL

```ts
const [activeSearch, setActiveSearch] = useState<SearchParams | null>(() => {
  const city = searchParams.get("city");
  if (!city) return null;
  const checkIn = searchParams.get("checkIn") ?? undefined;
  const checkOut = searchParams.get("checkOut") ?? undefined;
  const type = searchParams.get("type") as "PROPERTY" | "WORKSPACE" | null;
  const minPriceRaw = searchParams.get("minPrice");
  const maxPriceRaw = searchParams.get("maxPrice");
  const capacityRaw = searchParams.get("capacity");
  return {
    city,
    checkIn,
    checkOut,
    type: type ?? undefined,
    minPrice: minPriceRaw ? Number(minPriceRaw) * 100 : undefined,
    maxPrice: maxPriceRaw ? Number(maxPriceRaw) * 100 : undefined,
    capacity: capacityRaw ? Number(capacityRaw) : undefined,
  };
});
```

Note on URL param convention: the URL stores price in **dollars** (human-readable, shareable). The `activeSearch` state stores price in **cents** (what the API expects). This matches the conversion in `onSubmit` below.

#### 4c. Extend `useForm` defaultValues — restore from URL

```ts
const {
  register,
  handleSubmit,
  reset,
  formState: { errors, isSubmitting },
} = useForm<SearchFormInput>({
  resolver: zodResolver(SearchFormSchema),
  defaultValues: {
    city: searchParams.get("city") ?? "",
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    type: (searchParams.get("type") as "" | "PROPERTY" | "WORKSPACE") ?? "",
    amenities: searchParams.get("amenities")?.split(",").filter(Boolean) ?? [],
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : "",
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : "",
    capacity: searchParams.get("capacity") ? Number(searchParams.get("capacity")) : "",
  },
});
```

#### 4d. Update `onSubmit`

```ts
const onSubmit = (values: SearchFormInput) => {
  const minPriceDollars = values.minPrice !== "" ? Number(values.minPrice) : undefined;
  const maxPriceDollars = values.maxPrice !== "" ? Number(values.maxPrice) : undefined;
  const capacityVal = values.capacity !== "" ? Number(values.capacity) : undefined;

  const params: SearchParams = {
    city: values.city,
    checkIn: values.checkIn || undefined,
    checkOut: values.checkOut || undefined,
    type: values.type || undefined,
    amenities: values.amenities.length > 0 ? values.amenities : undefined,
    minPrice: minPriceDollars !== undefined ? Math.round(minPriceDollars * 100) : undefined,
    maxPrice: maxPriceDollars !== undefined ? Math.round(maxPriceDollars * 100) : undefined,
    capacity: capacityVal,
  };

  // URL stores prices in dollars (human-readable)
  const sp: Record<string, string> = { city: values.city };
  if (params.checkIn) sp.checkIn = params.checkIn;
  if (params.checkOut) sp.checkOut = params.checkOut;
  if (values.type) sp.type = values.type;
  if (values.amenities.length > 0) sp.amenities = values.amenities.join(",");
  if (minPriceDollars !== undefined) sp.minPrice = String(minPriceDollars);
  if (maxPriceDollars !== undefined) sp.maxPrice = String(maxPriceDollars);
  if (capacityVal !== undefined) sp.capacity = String(capacityVal);

  setSearchParams(sp);
  setActiveSearch(params);
};
```

#### 4e. Add a `useState` for filter panel open/closed

```ts
const [filtersOpen, setFiltersOpen] = useState(true);
```

#### 4f. Add filter panel JSX — insert after the existing `</form>` closing tag, before the results section

```tsx
{
  /* Filter panel */
}
<div className="mb-8">
  <button
    type="button"
    onClick={() => setFiltersOpen((o) => !o)}
    className="flex items-center gap-2 text-sm font-medium text-fg-2 hover:text-fg-1 transition-colors duration-fast"
  >
    <span>{t("search.filter_title")}</span>
    <span className="text-fg-muted">{filtersOpen ? "▲" : "▼"}</span>
  </button>

  {filtersOpen && (
    <div className="mt-3 rounded-md border border-muted bg-elevated p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {/* Type */}
      <div>
        <label htmlFor="type" className="mb-1 block text-sm font-medium text-fg-2">
          {t("search.filter_type_label")}
        </label>
        <select
          id="type"
          className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 transition-colors duration-fast ease-out focus-visible:border-forest-500 focus-visible:outline-none"
          {...register("type")}
        >
          <option value="">{t("search.filter_type_all")}</option>
          <option value="PROPERTY">{t("search.filter_type_property")}</option>
          <option value="WORKSPACE">{t("search.filter_type_workspace")}</option>
        </select>
      </div>

      {/* Min price */}
      <div>
        <label htmlFor="minPrice" className="mb-1 block text-sm font-medium text-fg-2">
          {t("search.filter_min_price_label")}
        </label>
        <Input
          id="minPrice"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          {...register("minPrice")}
        />
      </div>

      {/* Max price */}
      <div>
        <label htmlFor="maxPrice" className="mb-1 block text-sm font-medium text-fg-2">
          {t("search.filter_max_price_label")}
        </label>
        <Input
          id="maxPrice"
          type="number"
          min="0"
          step="1"
          placeholder="Any"
          {...register("maxPrice")}
        />
      </div>

      {/* Capacity */}
      <div>
        <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-fg-2">
          {t("search.filter_capacity_label")}
        </label>
        <Input
          id="capacity"
          type="number"
          min="1"
          step="1"
          placeholder="Any"
          {...register("capacity")}
        />
      </div>

      {/* Amenities */}
      <div>
        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-fg-2">
            {t("search.filter_amenities_label")}
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(["wifi", "parking", "pool", "gym", "kitchen", "ac"] as const).map((code) => (
              <label
                key={code}
                className="flex items-center gap-1 text-sm text-fg-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={code}
                  className="accent-forest-700"
                  {...register("amenities")}
                />
                {code.charAt(0).toUpperCase() + code.slice(1)}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )}
</div>;
```

The filter panel must appear **between** the `</form>` and the results section (loading skeleton / error / no-results / listing cards). Restructure the return JSX accordingly.

Also, add a "Reset filters" button inside the panel footer (after the grid):

```tsx
<div className="mt-3 flex justify-end">
  <button
    type="button"
    onClick={() =>
      reset({
        city: searchParams.get("city") ?? "",
        checkIn: searchParams.get("checkIn") ?? "",
        checkOut: searchParams.get("checkOut") ?? "",
        type: "",
        amenities: [],
        minPrice: "",
        maxPrice: "",
        capacity: "",
      })
    }
    className="text-sm text-terracotta-700 hover:underline"
  >
    {t("search.filter_reset")}
  </button>
</div>
```

Note: `reset` must be destructured from `useForm`. Add it to the `useForm` destructure alongside `register`, `handleSubmit`, `formState`.

---

### STEP 5 — Shareable URL test: implementation detail

The test `renderSearch(["/search?city=Lisbon&type=WORKSPACE&minPrice=50"])` verifies that when the page mounts with those URL params, the `type` select shows "WORKSPACE" and the `minPrice` input shows "50". This is driven by the `useForm` `defaultValues` reading from `searchParams.get(...)`.

The test must assert on the DOM element's `.value` directly:

```ts
const typeSelect = screen.getByLabelText(/type/i) as HTMLSelectElement;
expect(typeSelect.value).toBe("WORKSPACE");
const minPriceInput = screen.getByLabelText(/min price/i) as HTMLInputElement;
expect(minPriceInput.value).toBe("50");
```

---

## Import additions for `SearchPage.tsx`

The only new import needed is `useState` from React — it is already imported. No other new imports are required.

```ts
// Already present:
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { searchApi, type SearchParams } from "../api/search.js";
import { ListingCard } from "../components/ListingCard.js";
import { PageWrapper } from "../components/PageWrapper.js";
// No new imports needed
```

---

## Quality gate commands (run in this order)

```bash
# 1. Build shared package first (required for t() type safety)
pnpm --filter @nomadhome/shared build

# 2. Lint
pnpm lint

# 3. Typecheck
pnpm typecheck

# 4. Tests (web only)
pnpm --filter @nomadhome/web test run -- --reporter=verbose
```

All must be zero-error / all-green before declaring done.

---

## Commit sequence

1. `test(search): red tests for add-search-filters` — after STEP 2
2. `feat(search): implement filter panel UI (add-search-filters)` — after STEP 3-4 make tests green
3. `fix(search): <description>` — for any quality gate fixes, one commit per logical fix

---

## Decisions worth noting in design.md

1. **Price in URL vs. price in API**: URL params store dollars (human-readable, pasteable), `SearchParams` stores cents (API contract). The conversion happens in `onSubmit` only. This keeps URLs shareable without requiring the user to understand cent amounts.

2. **Native `<select>` for type filter**: `@nomadhome/ui` does not expose a shadcn Select. Using a native `<select>` styled to match `Input` is simpler and avoids adding a new dependency. The visual gap is acceptable for MVP.

3. **Filter panel open by default**: Setting `filtersOpen` initial state to `true` ensures filters are immediately visible on the search results page. This is an opinionated MVP choice — if UX feedback suggests the panel clutters the page, it can be changed to `false`.

4. **Amenities as checkboxes with hardcoded list**: The MVP amenity list (`wifi`, `parking`, `pool`, `gym`, `kitchen`, `ac`) is hardcoded in the frontend. Post-MVP, this could be driven by an API endpoint that returns all distinct amenities from published listings.

5. **`z.literal("")` union on number fields**: React Hook Form with `type="number"` inputs returns an empty string (`""`) when the field is cleared, not `undefined`. The union `.or(z.literal(""))` in the Zod schema handles this without needing `valueAsNumber` (which would coerce empty to `NaN`). The `onSubmit` handler checks `!== ""` before converting to number.
