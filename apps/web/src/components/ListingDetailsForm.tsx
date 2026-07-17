import type { UseFormReturn } from "react-hook-form";
import { t, type LocaleKey } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import type { ListingFormValues } from "../hooks/useEditListing.js";
import { AMENITIES } from "../lib/listingData.js";

const FIELD_LABELS: Record<"title" | "city" | "country" | "addressLine" | "currency", LocaleKey> =
  {
    title: "host.listings.field_title",
    city: "host.listings.field_city",
    country: "host.listings.field_country",
    addressLine: "host.listings.field_address",
    currency: "host.listings.field_currency",
  };

interface Props {
  form: UseFormReturn<ListingFormValues>;
  selectedAmenities: Set<string>;
  toggleAmenity: (code: string) => void;
  onSubmit: React.FormEventHandler;
  saveError: string | null;
}

export function ListingDetailsForm({
  form,
  selectedAmenities,
  toggleAmenity,
  onSubmit,
  saveError,
}: Props) {
  const {
    register,
    formState: { isSubmitting },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {(["title", "city", "country", "addressLine", "currency"] as const).map((field) => (
        <div key={field}>
          <label htmlFor={`edit-${field}`} className="mb-1 block text-sm font-medium text-fg-2">
            {t(FIELD_LABELS[field])}
          </label>
          <Input id={`edit-${field}`} {...register(field)} required />
        </div>
      ))}

      <div>
        <label htmlFor="edit-description" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_description")}
        </label>
        <textarea
          id="edit-description"
          {...register("description")}
          required
          rows={4}
          className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 placeholder:text-fg-muted transition-colors duration-fast ease-out focus-visible:border-forest-500 focus-visible:outline-none"
        />
      </div>

      <div>
        <label htmlFor="edit-type" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_type")}
        </label>
        <select
          id="edit-type"
          {...register("type")}
          required
          className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 focus-visible:border-forest-500 focus-visible:outline-none"
        >
          <option value="PROPERTY">{t("host.listings.type_property")}</option>
          <option value="WORKSPACE">{t("host.listings.type_workspace")}</option>
        </select>
      </div>

      <div>
        <label htmlFor="edit-capacity" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_capacity")}
        </label>
        <Input
          id="edit-capacity"
          type="number"
          {...register("capacity", { valueAsNumber: true })}
          required
          min={1}
        />
      </div>

      <div>
        <label htmlFor="edit-nightlyRateCents" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_rate")}
        </label>
        <Input
          id="edit-nightlyRateCents"
          type="number"
          {...register("nightlyRateCents", { valueAsNumber: true })}
          required
          min={1}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg-2">
          {t("host.listings.field_amenities")}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map(({ code, labelKey }) => (
            <label key={code} className="flex items-center gap-2 text-sm text-fg-2">
              <input
                type="checkbox"
                checked={selectedAmenities.has(code)}
                onChange={() => toggleAmenity(code)}
                className="h-4 w-4 rounded border-muted accent-forest-700"
              />
              {t(labelKey)}
            </label>
          ))}
        </div>
      </fieldset>

      {saveError && (
        <p role="alert" className="text-sm text-danger">
          {saveError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {t("host.listings.save")}
      </Button>
    </form>
  );
}
