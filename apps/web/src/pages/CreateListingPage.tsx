import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { hostApi, type CreateListingInput } from "../api/host.js";
import { ApiError } from "../api/client.js";

const AMENITIES = [
  { code: "wifi", label: "Wi-Fi" },
  { code: "kitchen", label: "Kitchen" },
  { code: "workspace_desk", label: "Dedicated desk" },
  { code: "meeting_room", label: "Meeting room" },
  { code: "phone_booth", label: "Phone booth" },
  { code: "laundry", label: "Laundry" },
  { code: "air_conditioning", label: "Air conditioning" },
  { code: "heating", label: "Heating" },
  { code: "parking", label: "Parking" },
  { code: "coffee", label: "Coffee" },
];

type FormValues = Omit<CreateListingInput, "amenityCodes">;

export function CreateListingPage() {
  const navigate = useNavigate();
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { currency: "USD" },
  });

  const toggleAmenity = (code: string) => {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const listing = await hostApi.create({
        ...values,
        capacity: Number(values.capacity),
        nightlyRateCents: Number(values.nightlyRateCents),
        amenityCodes: Array.from(selectedAmenities),
      });
      void navigate(`/host/listings/${listing.id}/edit`);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string } | null;
        setServerError(body?.error ?? t("error.generic.unexpected"));
      } else {
        setServerError(t("error.generic.unexpected"));
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-fg-1">{t("host.listings.create_title")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_title")}
          </label>
          <Input id="title" {...register("title")} required />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_description")}
          </label>
          <textarea
            id="description"
            {...register("description")}
            required
            rows={4}
            className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 placeholder:text-fg-muted transition-colors duration-fast ease-out focus-visible:border-forest-500 focus-visible:outline-none"
          />
        </div>

        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_type")}
          </label>
          <select
            id="type"
            {...register("type")}
            required
            className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 focus-visible:border-forest-500 focus-visible:outline-none"
          >
            <option value="PROPERTY">{t("host.listings.type_property")}</option>
            <option value="WORKSPACE">{t("host.listings.type_workspace")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_city")}
          </label>
          <Input id="city" {...register("city")} required />
        </div>

        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_country")}
          </label>
          <Input id="country" {...register("country")} required maxLength={2} />
        </div>

        <div>
          <label htmlFor="addressLine" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_address")}
          </label>
          <Input id="addressLine" {...register("addressLine")} required />
        </div>

        <div>
          <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_capacity")}
          </label>
          <Input
            id="capacity"
            type="number"
            {...register("capacity", { valueAsNumber: true })}
            required
            min={1}
          />
        </div>

        <div>
          <label htmlFor="nightlyRateCents" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_rate")}
          </label>
          <Input
            id="nightlyRateCents"
            type="number"
            {...register("nightlyRateCents", { valueAsNumber: true })}
            required
            min={1}
          />
        </div>

        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_currency")}
          </label>
          <Input id="currency" {...register("currency")} required />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg-2">
            {t("host.listings.field_amenities")}
          </legend>
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : t("host.listings.create_title")}
        </Button>
      </form>
    </div>
  );
}
