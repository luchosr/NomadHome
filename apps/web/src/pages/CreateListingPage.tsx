import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { hostApi } from "../api/host.js";
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

const COUNTRIES: { group: string; options: { code: string; label: string }[] }[] = [
  {
    group: "European Union",
    options: [
      { code: "AT", label: "Austria" },
      { code: "BE", label: "Belgium" },
      { code: "BG", label: "Bulgaria" },
      { code: "HR", label: "Croatia" },
      { code: "CY", label: "Cyprus" },
      { code: "CZ", label: "Czech Republic" },
      { code: "DK", label: "Denmark" },
      { code: "EE", label: "Estonia" },
      { code: "FI", label: "Finland" },
      { code: "FR", label: "France" },
      { code: "DE", label: "Germany" },
      { code: "GR", label: "Greece" },
      { code: "HU", label: "Hungary" },
      { code: "IE", label: "Ireland" },
      { code: "IT", label: "Italy" },
      { code: "LV", label: "Latvia" },
      { code: "LT", label: "Lithuania" },
      { code: "LU", label: "Luxembourg" },
      { code: "MT", label: "Malta" },
      { code: "NL", label: "Netherlands" },
      { code: "PL", label: "Poland" },
      { code: "PT", label: "Portugal" },
      { code: "RO", label: "Romania" },
      { code: "SK", label: "Slovakia" },
      { code: "SI", label: "Slovenia" },
      { code: "ES", label: "Spain" },
      { code: "SE", label: "Sweden" },
    ],
  },
  {
    group: "North America",
    options: [
      { code: "CA", label: "Canada" },
      { code: "CR", label: "Costa Rica" },
      { code: "GT", label: "Guatemala" },
      { code: "MX", label: "Mexico" },
      { code: "PA", label: "Panama" },
      { code: "US", label: "United States" },
    ],
  },
  {
    group: "South America",
    options: [
      { code: "AR", label: "Argentina" },
      { code: "BO", label: "Bolivia" },
      { code: "BR", label: "Brazil" },
      { code: "CL", label: "Chile" },
      { code: "CO", label: "Colombia" },
      { code: "EC", label: "Ecuador" },
      { code: "PY", label: "Paraguay" },
      { code: "PE", label: "Peru" },
      { code: "UY", label: "Uruguay" },
      { code: "VE", label: "Venezuela" },
    ],
  },
  {
    group: "Asia",
    options: [
      { code: "BD", label: "Bangladesh" },
      { code: "CN", label: "China" },
      { code: "IN", label: "India" },
      { code: "ID", label: "Indonesia" },
      { code: "JP", label: "Japan" },
      { code: "MY", label: "Malaysia" },
      { code: "NP", label: "Nepal" },
      { code: "PH", label: "Philippines" },
      { code: "SG", label: "Singapore" },
      { code: "KR", label: "South Korea" },
      { code: "LK", label: "Sri Lanka" },
      { code: "TW", label: "Taiwan" },
      { code: "TH", label: "Thailand" },
      { code: "VN", label: "Vietnam" },
    ],
  },
];

const ALL_COUNTRY_CODES = COUNTRIES.flatMap((g) => g.options.map((o) => o.code));

const CURRENCIES: { group: string; options: { code: string; label: string }[] }[] = [
  {
    group: "European Union",
    options: [
      { code: "EUR", label: "EUR — Euro" },
      { code: "BGN", label: "BGN — Bulgarian Lev" },
      { code: "CZK", label: "CZK — Czech Koruna" },
      { code: "DKK", label: "DKK — Danish Krone" },
      { code: "HUF", label: "HUF — Hungarian Forint" },
      { code: "PLN", label: "PLN — Polish Złoty" },
      { code: "RON", label: "RON — Romanian Leu" },
      { code: "SEK", label: "SEK — Swedish Krona" },
    ],
  },
  {
    group: "North America",
    options: [
      { code: "USD", label: "USD — US Dollar" },
      { code: "CAD", label: "CAD — Canadian Dollar" },
      { code: "MXN", label: "MXN — Mexican Peso" },
      { code: "CRC", label: "CRC — Costa Rican Colón" },
      { code: "GTQ", label: "GTQ — Guatemalan Quetzal" },
    ],
  },
  {
    group: "South America",
    options: [
      { code: "ARS", label: "ARS — Argentine Peso" },
      { code: "BOB", label: "BOB — Bolivian Boliviano" },
      { code: "BRL", label: "BRL — Brazilian Real" },
      { code: "CLP", label: "CLP — Chilean Peso" },
      { code: "COP", label: "COP — Colombian Peso" },
      { code: "PYG", label: "PYG — Paraguayan Guaraní" },
      { code: "PEN", label: "PEN — Peruvian Sol" },
      { code: "UYU", label: "UYU — Uruguayan Peso" },
    ],
  },
  {
    group: "Asia",
    options: [
      { code: "BDT", label: "BDT — Bangladeshi Taka" },
      { code: "CNY", label: "CNY — Chinese Yuan" },
      { code: "INR", label: "INR — Indian Rupee" },
      { code: "IDR", label: "IDR — Indonesian Rupiah" },
      { code: "JPY", label: "JPY — Japanese Yen" },
      { code: "MYR", label: "MYR — Malaysian Ringgit" },
      { code: "NPR", label: "NPR — Nepalese Rupee" },
      { code: "PHP", label: "PHP — Philippine Peso" },
      { code: "SGD", label: "SGD — Singapore Dollar" },
      { code: "KRW", label: "KRW — South Korean Won" },
      { code: "LKR", label: "LKR — Sri Lankan Rupee" },
      { code: "TWD", label: "TWD — New Taiwan Dollar" },
      { code: "THB", label: "THB — Thai Baht" },
      { code: "VND", label: "VND — Vietnamese Đồng" },
    ],
  },
];

const ALL_CURRENCY_CODES = CURRENCIES.flatMap((g) => g.options.map((o) => o.code));

const CreateListingSchema = z.object({
  title: z.string().min(5, "At least 5 characters required"),
  description: z.string().min(20, "At least 20 characters required"),
  type: z.enum(["PROPERTY", "WORKSPACE"]),
  city: z.string().min(2, "City name is required"),
  country: z.enum(ALL_COUNTRY_CODES as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a country" }),
  }),
  addressLine: z.string().min(5, "Full street address is required"),
  capacity: z.coerce.number().int().min(1, "At least 1 guest required"),
  nightlyRate: z.coerce.number().positive("Must be greater than 0").min(1, "Minimum is 1.00"),
  currency: z.enum(ALL_CURRENCY_CODES as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a currency" }),
  }),
});

type FormValues = z.infer<typeof CreateListingSchema>;

const selectClass =
  "w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 focus-visible:border-forest-500 focus-visible:outline-none";

function FieldHint({ error, hint }: { error?: string; hint: string }) {
  if (error) return <p className="mt-1 text-xs text-danger">{error}</p>;
  return <p className="mt-1 text-xs text-fg-3">{hint}</p>;
}

export function CreateListingPage() {
  const navigate = useNavigate();
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isValid, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateListingSchema),
    mode: "onChange",
    defaultValues: { currency: "EUR", type: "PROPERTY" },
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
        nightlyRateCents: Math.round(values.nightlyRate * 100),
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-fg-1">{t("host.listings.create_title")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_title")}
          </label>
          <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
          <FieldHint
            error={errors.title?.message}
            hint="Give your space a clear, catchy name (min 5 characters)."
          />
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
          <FieldHint
            error={errors.description?.message}
            hint="Describe amenities, vibe, and what makes your space unique (min 20 characters)."
          />
        </div>

        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_type")}
          </label>
          <select id="type" {...register("type")} className={selectClass}>
            <option value="PROPERTY">{t("host.listings.type_property")}</option>
            <option value="WORKSPACE">{t("host.listings.type_workspace")}</option>
          </select>
          <FieldHint
            error={errors.type?.message}
            hint="Property = a place to sleep and live. Workspace = a desk or office."
          />
        </div>

        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_city")}
          </label>
          <Input id="city" {...register("city")} aria-invalid={!!errors.city} />
          <FieldHint
            error={errors.city?.message}
            hint="The city where guests will stay (e.g. Madrid, Lisbon)."
          />
        </div>

        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_country")}
          </label>
          <select
            id="country"
            {...register("country")}
            aria-invalid={!!errors.country}
            className={selectClass}
          >
            <option value="">Select a country…</option>
            {COUNTRIES.map(({ group, options }) => (
              <optgroup key={group} label={group}>
                {options.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <FieldHint
            error={errors.country?.message}
            hint="Select the country where your listing is located."
          />
        </div>

        <div>
          <label htmlFor="addressLine" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_address")}
          </label>
          <Input
            id="addressLine"
            {...register("addressLine")}
            aria-invalid={!!errors.addressLine}
          />
          <FieldHint
            error={errors.addressLine?.message}
            hint="Street name and number (e.g. Calle del Pez 12, Malasaña)."
          />
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
          <FieldHint
            error={errors.capacity?.message}
            hint="Maximum number of guests the space can accommodate."
          />
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
          <FieldHint
            error={errors.nightlyRate?.message}
            hint="Price per night in the selected currency (e.g. 75 for €75.00)."
          />
        </div>

        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.listings.field_currency")}
          </label>
          <select
            id="currency"
            {...register("currency")}
            aria-invalid={!!errors.currency}
            className={selectClass}
          >
            {CURRENCIES.map(({ group, options }) => (
              <optgroup key={group} label={group}>
                {options.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <FieldHint
            error={errors.currency?.message}
            hint="Select the currency you want to charge guests in."
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-fg-2">
            {t("host.listings.field_amenities")}
          </legend>
          <p className="mb-2 text-xs text-fg-3">
            Select all that apply — guests can filter by these.
          </p>
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
          {isSubmitting ? "Creating…" : t("host.listings.create_title")}
        </Button>
      </form>
    </div>
  );
}
