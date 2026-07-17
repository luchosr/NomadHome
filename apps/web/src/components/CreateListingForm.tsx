import type { UseFormReturn } from "react-hook-form";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import type { CreateFormValues } from "../hooks/useCreateListing.js";
import { AMENITIES, COUNTRIES, CURRENCIES } from "../lib/listingData.js";
import { GroupedSelect } from "./GroupedSelect.js";

const SELECT_CLASS =
  "w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 focus-visible:border-forest-500 focus-visible:outline-none";

function FieldHint({ error, hint }: { error?: string; hint: string }) {
  if (error) return <p className="mt-1 text-xs text-danger">{error}</p>;
  return <p className="mt-1 text-xs text-fg-3">{hint}</p>;
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
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_title")}
        </label>
        <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
        <FieldHint error={errors.title?.message} hint={t("host.listings.hint_title")} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_description")}
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={4}
          aria-invalid={!!errors.description}
          className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 placeholder:text-fg-muted transition-colors duration-fast ease-out focus-visible:border-forest-500 focus-visible:outline-none"
        />
        <FieldHint error={errors.description?.message} hint={t("host.listings.hint_description")} />
      </div>

      <div>
        <label htmlFor="type" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_type")}
        </label>
        <select id="type" {...register("type")} className={SELECT_CLASS}>
          <option value="PROPERTY">{t("host.listings.type_property")}</option>
          <option value="WORKSPACE">{t("host.listings.type_workspace")}</option>
        </select>
        <FieldHint error={errors.type?.message} hint={t("host.listings.hint_type")} />
      </div>

      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_city")}
        </label>
        <Input id="city" {...register("city")} aria-invalid={!!errors.city} />
        <FieldHint error={errors.city?.message} hint={t("host.listings.hint_city")} />
      </div>

      <div>
        <label htmlFor="country" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_country")}
        </label>
        <GroupedSelect
          id="country"
          {...register("country")}
          aria-invalid={!!errors.country}
          className={SELECT_CLASS}
          groups={COUNTRIES}
          placeholder={t("host.listings.country_placeholder")}
        />
        <FieldHint error={errors.country?.message} hint={t("host.listings.hint_country")} />
      </div>

      <div>
        <label htmlFor="addressLine" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_address")}
        </label>
        <Input id="addressLine" {...register("addressLine")} aria-invalid={!!errors.addressLine} />
        <FieldHint error={errors.addressLine?.message} hint={t("host.listings.hint_address")} />
      </div>

      <div>
        <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_capacity")}
        </label>
        <Input
          id="capacity"
          type="number"
          min={1}
          {...register("capacity")}
          aria-invalid={!!errors.capacity}
        />
        <FieldHint error={errors.capacity?.message} hint={t("host.listings.hint_capacity")} />
      </div>

      <div>
        <label htmlFor="nightlyRate" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_rate")}
        </label>
        <Input
          id="nightlyRate"
          type="number"
          min={1}
          step={0.01}
          {...register("nightlyRate")}
          aria-invalid={!!errors.nightlyRate}
        />
        <FieldHint error={errors.nightlyRate?.message} hint={t("host.listings.hint_rate")} />
      </div>

      <div>
        <label htmlFor="currency" className="mb-1 block text-sm font-medium text-fg-2">
          {t("host.listings.field_currency")}
        </label>
        <GroupedSelect
          id="currency"
          {...register("currency")}
          aria-invalid={!!errors.currency}
          className={SELECT_CLASS}
          groups={CURRENCIES}
        />
        <FieldHint error={errors.currency?.message} hint={t("host.listings.hint_currency")} />
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-fg-2">
          {t("host.listings.field_amenities")}
        </legend>
        <p className="mb-2 text-xs text-fg-3">{t("host.listings.hint_amenities")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map(({ code, label }) => (
            <label key={code} className="flex items-center gap-2 text-sm text-fg-2">
              <input
                type="checkbox"
                checked={selectedAmenities.has(code)}
                onChange={() => toggleAmenity(code)}
                className="h-4 w-4 rounded border-muted accent-forest-700"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {serverError && (
        <p role="alert" className="text-sm text-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting || !isValid}>
        {isSubmitting ? t("host.listings.creating") : t("host.listings.create_title")}
      </Button>
    </form>
  );
}
