import { z } from "zod";
import { t } from "../t.js";

export const LISTING_TYPES = ["PROPERTY", "WORKSPACE"] as const;

/**
 * Create-listing request shape — the single source of truth for the API and the
 * web form. A photo is NOT required to create a draft (it is a publish-time
 * gate); at least one amenity is required.
 */
export const CreateListingSchema = z.object({
  title: z.string().min(1, t("validation.required.field")),
  description: z.string().min(1, t("validation.required.field")),
  type: z.enum(LISTING_TYPES, { errorMap: () => ({ message: t("listings.create.invalid_type") }) }),
  city: z.string().min(1, t("validation.required.field")),
  country: z.string().min(2, t("listings.create.invalid_country")),
  addressLine: z.string().min(1, t("validation.required.field")),
  capacity: z.number().int().min(1, t("listings.create.invalid_capacity")),
  nightlyRateCents: z.number().int().positive(t("listings.create.invalid_rate")),
  currency: z.string().length(3).default("USD"),
  amenityCodes: z.array(z.string().min(1)).min(1, t("listings.create.amenities_required")),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

/** Update is a partial of the create shape — any subset of fields may change. */
export const UpdateListingSchema = CreateListingSchema.partial();

export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;
