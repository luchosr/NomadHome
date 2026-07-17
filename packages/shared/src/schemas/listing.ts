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

export const UploadUrlRequestSchema = z.object({
  contentType: z.string().min(1, t("validation.required.field")),
});
export type UploadUrlRequestInput = z.infer<typeof UploadUrlRequestSchema>;

export const RegisterPhotoSchema = z.object({
  key: z.string().min(1, t("validation.required.field")),
  position: z.number().int().min(0, t("listings.photo.invalid_position")),
});
export type RegisterPhotoInput = z.infer<typeof RegisterPhotoSchema>;

export const UpdatePhotoPositionSchema = z.object({
  position: z.number().int().min(0, t("listings.photo.invalid_position")),
});
export type UpdatePhotoPositionInput = z.infer<typeof UpdatePhotoPositionSchema>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, t("listings.availability.invalid_date"))
  .refine((s) => !isNaN(new Date(s).getTime()), t("listings.availability.invalid_date"));

export const BlockDateRangeSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((d) => d.endDate > d.startDate, {
    message: t("listings.availability.end_before_start"),
    path: ["endDate"],
  });
export type BlockDateRangeInput = z.infer<typeof BlockDateRangeSchema>;
