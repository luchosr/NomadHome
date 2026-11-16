import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { UseFormRegister } from "react-hook-form";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import type { SearchFormValues } from "../hooks/useSearchPage.js";
import { AMENITY_OPTIONS } from "../lib/searchData.js";

interface Props {
  id: string;
  register: UseFormRegister<SearchFormValues>;
  onReset: () => void;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** True while the panel is laid out as a sheet (below the md breakpoint). */
function isSheet(): boolean {
  return (
    typeof window.matchMedia === "function" && !window.matchMedia("(min-width: 768px)").matches
  );
}

const fieldLabel = "mb-1 block text-sm font-bold text-fg";

/**
 * One filter container: a sheet over the page below md, a sticky side panel from md up.
 * Rendered only while open. Focus moves into it on open; Escape closes it.
 */
export function SearchFilterPanel({ id, register, onReset, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    // Below md the panel is a modal sheet over the page: keep Tab inside it.
    if (e.key !== "Tab" || !isSheet() || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-action/60 md:hidden"
      />
      <aside
        ref={panelRef}
        id={id}
        tabIndex={-1}
        aria-label={t("search.filter_title")}
        onKeyDown={onKeyDown}
        className="fixed inset-x-0 bottom-0 z-40 max-h-[85dvh] overflow-y-auto border-t-2 border-border bg-surface p-5 focus:outline-none md:sticky md:inset-x-auto md:bottom-auto md:top-20 md:z-auto md:max-h-none md:w-72 md:shrink-0 md:self-start md:overflow-visible md:border-2"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="m-0 font-display text-2xl font-black leading-solid">
            {t("search.filter_title")}
          </h2>
          <Button type="button" variant="secondary" className="px-3 py-2" onClick={onClose}>
            {t("search.filter_close")}
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="type" className={fieldLabel}>
              {t("search.filter_type_label")}
            </label>
            <select
              id="type"
              className="w-full rounded-sm border-2 border-border bg-surface-raised px-4 py-3 text-base text-fg focus-visible:bg-surface"
              {...register("type")}
            >
              <option value="">{t("search.filter_type_all")}</option>
              <option value="PROPERTY">{t("search.filter_type_property")}</option>
              <option value="WORKSPACE">{t("search.filter_type_workspace")}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="minPrice" className={fieldLabel}>
                {t("search.filter_min_price_label")}
              </label>
              <Input
                id="minPrice"
                type="number"
                min="0"
                placeholder="0"
                {...register("minPrice")}
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className={fieldLabel}>
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
          </div>
          <div>
            <label htmlFor="capacity" className={fieldLabel}>
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

        <fieldset className="m-0 mt-5 border-0 p-0">
          <legend className="mb-2 p-0 text-sm font-bold text-fg">
            {t("search.filter_amenities_label")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map(({ code, labelKey }) => (
              <label key={code} className="cursor-pointer">
                <input
                  type="checkbox"
                  value={code}
                  {...register("amenities")}
                  className="peer sr-only"
                />
                {/* Selected = solid black panel with a check glyph; unselected = outlined panel. */}
                <span className="inline-flex items-center gap-2 border-2 border-border bg-surface px-3 py-2 text-sm font-bold text-fg transition-colors duration-fast ease-out hover:bg-ember peer-checked:bg-action peer-checked:text-action-fg peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-border peer-checked:[&>svg]:block">
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="hidden size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="square"
                  >
                    <path d="M2 8.5l4 4 8-9" />
                  </svg>
                  {t(labelKey)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex flex-col gap-3 border-t-2 border-border pt-5">
          <Button type="submit" className="w-full">
            {t("search.filter_apply")}
          </Button>
          <Button type="button" variant="tertiary" className="self-start" onClick={onReset}>
            {t("search.filter_reset")}
          </Button>
        </div>
      </aside>
    </>
  );
}
