import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { hostApi } from "../api/host.js";
import { ApiError } from "../api/client.js";
import { ALL_COUNTRY_CODES, ALL_CURRENCY_CODES } from "../lib/listingData.js";

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

export type CreateFormValues = z.infer<typeof CreateListingSchema>;

function extractError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body;
    if (typeof body === "object" && body !== null && "error" in body) {
      const { error } = body as { error: unknown };
      if (typeof error === "string") return error;
    }
  }
  return t("error.generic.unexpected");
}

export function useCreateListing() {
  const navigate = useNavigate();
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateFormValues>({
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

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const listing = await hostApi.create({
        ...values,
        nightlyRateCents: Math.round(values.nightlyRate * 100),
        amenityCodes: Array.from(selectedAmenities),
      });
      void navigate(`/host/listings/${listing.id}/edit`);
    } catch (err) {
      setServerError(extractError(err));
    }
  });

  return {
    form,
    selectedAmenities,
    toggleAmenity,
    submit,
    serverError,
  };
}
