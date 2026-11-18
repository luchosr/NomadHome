import type { UseFormReturn } from "react-hook-form";
import { t, type LocaleKey } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import type { ListingFormValues } from "../hooks/useEditListing.js";
import { AMENITIES } from "../lib/listingData.js";
import { AmenityCheckboxGrid } from "./AmenityCheckboxGrid.js";
import { ServerErrorAlert } from "./ServerErrorAlert.js";
import { CONTROL_CLASS, LABEL_CLASS } from "./listingFormStyles.js";

const FIELD_LABELS: Record<"title" | "city" | "country" | "addressLine" | "currency", LocaleKey> = {
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
          <label htmlFor={`edit-${field}`} className={LABEL_CLASS}>
            {t(FIELD_LABELS[field])}
          </label>
          <Input id={`edit-${field}`} {...register(field)} required />
        </div>
      ))}

      <div>
        <label htmlFor="edit-description" className={LABEL_CLASS}>
          {t("host.listings.field_description")}
        </label>
        <textarea
          id="edit-description"
          {...register("description")}
          required
          rows={4}
          className={CONTROL_CLASS}
        />
      </div>

      <div>
        <label htmlFor="edit-type" className={LABEL_CLASS}>
          {t("host.listings.field_type")}
        </label>
        <select id="edit-type" {...register("type")} required className={CONTROL_CLASS}>
          <option value="PROPERTY">{t("host.listings.type_property")}</option>
          <option value="WORKSPACE">{t("host.listings.type_workspace")}</option>
        </select>
      </div>

      <div>
        <label htmlFor="edit-capacity" className={LABEL_CLASS}>
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
        <label htmlFor="edit-nightlyRateCents" className={LABEL_CLASS}>
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
        <legend className={LABEL_CLASS}>{t("host.listings.field_amenities")}</legend>
        <AmenityCheckboxGrid
          amenities={AMENITIES}
          selected={selectedAmenities}
          onToggle={toggleAmenity}
        />
      </fieldset>

      <ServerErrorAlert error={saveError} />
      <Button type="submit" className="min-h-11" disabled={isSubmitting}>
        {t("host.listings.save")}
      </Button>
    </form>
  );
}
