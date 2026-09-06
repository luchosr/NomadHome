import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { t } from "@nomadhome/shared";
import { Input } from "@nomadhome/ui";
import type { SearchFormValues } from "../hooks/useSearchPage.js";
import { AMENITY_OPTIONS } from "../lib/searchData.js";

interface Props {
  register: UseFormRegister<SearchFormValues>;
  errors: FieldErrors<SearchFormValues>;
  onReset: () => void;
}

export function SearchFilterPanel({ register, errors, onReset }: Props) {
  return (
    <div className="rounded-xl border border-subtle bg-inset p-4">
      <p className="mb-3 text-sm font-semibold text-fg-2">{t("search.filter_title")}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-fg-2">
            {t("search.filter_type_label")}
          </label>
          <select
            id="type"
            className="w-full rounded-md border border-muted bg-elevated px-3 py-2 text-sm text-fg-1 focus:outline-none focus:ring-2 focus:ring-forest-600"
            {...register("type")}
          >
            <option value="">{t("search.filter_type_all")}</option>
            <option value="PROPERTY">{t("search.filter_type_property")}</option>
            <option value="WORKSPACE">{t("search.filter_type_workspace")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="minPrice" className="mb-1 block text-sm font-medium text-fg-2">
            {t("search.filter_min_price_label")}
          </label>
          <Input id="minPrice" type="number" min="0" placeholder="0" {...register("minPrice")} />
        </div>
        <div>
          <label htmlFor="maxPrice" className="mb-1 block text-sm font-medium text-fg-2">
            {t("search.filter_max_price_label")}
          </label>
          <Input
            id="maxPrice"
            type="number"
            min="0"
            placeholder={t("search.filter_any")}
            {...register("maxPrice")}
          />
        </div>
        <div>
          <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-fg-2">
            {t("search.filter_capacity_label")}
          </label>
          <Input
            id="capacity"
            type="number"
            min="1"
            placeholder={t("search.filter_any")}
            {...register("capacity")}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-fg-2">{t("search.filter_amenities_label")}</p>
        <div className="flex flex-wrap gap-3">
          {AMENITY_OPTIONS.map(({ code, labelKey }) => (
            <label
              key={code}
              className="flex cursor-pointer items-center gap-1.5 text-sm text-fg-2"
            >
              <input
                type="checkbox"
                value={code}
                {...register("amenities")}
                className="accent-forest-600"
              />
              {t(labelKey)}
            </label>
          ))}
        </div>
      </div>

      {errors.checkOut && <p className="mt-2 text-xs text-danger">{errors.checkOut.message}</p>}

      <button
        type="button"
        onClick={onReset}
        className="mt-3 text-xs text-fg-3 underline hover:text-fg-1"
      >
        {t("search.filter_reset")}
      </button>
    </div>
  );
}
