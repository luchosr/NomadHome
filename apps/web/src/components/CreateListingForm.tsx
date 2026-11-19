import type { UseFormReturn } from "react-hook-form";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import type { CreateFormValues } from "../hooks/useCreateListing.js";
import { AMENITIES, COUNTRIES, CURRENCIES } from "../lib/listingData.js";
import { GroupedSelect } from "./GroupedSelect.js";
import { AmenityCheckboxGrid } from "./AmenityCheckboxGrid.js";
import { FormField, errorIdFor } from "./FormField.js";
import { ServerErrorAlert } from "./ServerErrorAlert.js";
import { CONTROL_CLASS, HINT_CLASS, LABEL_CLASS } from "./listingFormStyles.js";

// The field error renders through FormField; the hint shows only while the field has no error.
function FieldHint({ error, hint }: { error?: string; hint: string }) {
  if (error) return null;
  return <p className={HINT_CLASS}>{hint}</p>;
}

function describedBy(id: string, error?: string) {
  return error ? errorIdFor(id) : undefined;
}

interface Props {
  form: UseFormReturn<CreateFormValues>;
  selectedAmenities: Set<string>;
  toggleAmenity: (code: string) => void;
  submit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  serverError: string | null;
}

export function CreateListingForm({
  form,
  selectedAmenities,
  toggleAmenity,
  submit,
  serverError,
}: Props) {
  const {
    register,
    formState: { isSubmitting, isValid, errors },
  } = form;

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5" noValidate>
      <FormField id="title" label={t("host.listings.field_title")} error={errors.title?.message}>
        <Input
          id="title"
          {...register("title")}
          aria-invalid={!!errors.title}
          aria-describedby={describedBy("title", errors.title?.message)}
        />
        <FieldHint error={errors.title?.message} hint={t("host.listings.hint_title")} />
      </FormField>

      <FormField
        id="description"
        label={t("host.listings.field_description")}
        error={errors.description?.message}
      >
        <textarea
          id="description"
          {...register("description")}
          rows={4}
          aria-invalid={!!errors.description}
          aria-describedby={describedBy("description", errors.description?.message)}
          className={CONTROL_CLASS}
        />
        <FieldHint error={errors.description?.message} hint={t("host.listings.hint_description")} />
      </FormField>

      <FormField id="type" label={t("host.listings.field_type")} error={errors.type?.message}>
        <select
          id="type"
          {...register("type")}
          aria-describedby={describedBy("type", errors.type?.message)}
          className={CONTROL_CLASS}
        >
          <option value="PROPERTY">{t("host.listings.type_property")}</option>
          <option value="WORKSPACE">{t("host.listings.type_workspace")}</option>
        </select>
        <FieldHint error={errors.type?.message} hint={t("host.listings.hint_type")} />
      </FormField>

      <FormField id="city" label={t("host.listings.field_city")} error={errors.city?.message}>
        <Input
          id="city"
          {...register("city")}
          aria-invalid={!!errors.city}
          aria-describedby={describedBy("city", errors.city?.message)}
        />
        <FieldHint error={errors.city?.message} hint={t("host.listings.hint_city")} />
      </FormField>

      <FormField
        id="country"
        label={t("host.listings.field_country")}
        error={errors.country?.message}
      >
        <GroupedSelect
          id="country"
          {...register("country")}
          aria-invalid={!!errors.country}
          aria-describedby={describedBy("country", errors.country?.message)}
          className={CONTROL_CLASS}
          groups={COUNTRIES}
          placeholder={t("host.listings.country_placeholder")}
        />
        <FieldHint error={errors.country?.message} hint={t("host.listings.hint_country")} />
      </FormField>

      <FormField
        id="addressLine"
        label={t("host.listings.field_address")}
        error={errors.addressLine?.message}
      >
        <Input
          id="addressLine"
          {...register("addressLine")}
          aria-invalid={!!errors.addressLine}
          aria-describedby={describedBy("addressLine", errors.addressLine?.message)}
        />
        <FieldHint error={errors.addressLine?.message} hint={t("host.listings.hint_address")} />
      </FormField>

      <FormField
        id="capacity"
        label={t("host.listings.field_capacity")}
        error={errors.capacity?.message}
      >
        <Input
          id="capacity"
          type="number"
          min={1}
          {...register("capacity")}
          aria-invalid={!!errors.capacity}
          aria-describedby={describedBy("capacity", errors.capacity?.message)}
        />
        <FieldHint error={errors.capacity?.message} hint={t("host.listings.hint_capacity")} />
      </FormField>

      <FormField
        id="nightlyRate"
        label={t("host.listings.field_rate")}
        error={errors.nightlyRate?.message}
      >
        <Input
          id="nightlyRate"
          type="number"
          min={1}
          step={0.01}
          {...register("nightlyRate")}
          aria-invalid={!!errors.nightlyRate}
          aria-describedby={describedBy("nightlyRate", errors.nightlyRate?.message)}
        />
        <FieldHint error={errors.nightlyRate?.message} hint={t("host.listings.hint_rate")} />
      </FormField>

      <FormField
        id="currency"
        label={t("host.listings.field_currency")}
        error={errors.currency?.message}
      >
        <GroupedSelect
          id="currency"
          {...register("currency")}
          aria-invalid={!!errors.currency}
          aria-describedby={describedBy("currency", errors.currency?.message)}
          className={CONTROL_CLASS}
          groups={CURRENCIES}
        />
        <FieldHint error={errors.currency?.message} hint={t("host.listings.hint_currency")} />
      </FormField>

      <fieldset>
        <legend className={LABEL_CLASS}>{t("host.listings.field_amenities")}</legend>
        <p className={`${HINT_CLASS} mb-3`}>{t("host.listings.hint_amenities")}</p>
        <AmenityCheckboxGrid
          amenities={AMENITIES}
          selected={selectedAmenities}
          onToggle={toggleAmenity}
        />
      </fieldset>

      <ServerErrorAlert error={serverError} />

      <Button type="submit" disabled={isSubmitting || !isValid}>
        {isSubmitting ? t("host.listings.creating") : t("host.listings.create_title")}
      </Button>
    </form>
  );
}
