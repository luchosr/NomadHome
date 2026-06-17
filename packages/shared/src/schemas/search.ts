import { z } from "zod";
import { t } from "../t.js";

export const SearchQuerySchema = z
  .object({
    city: z.string().min(1),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    type: z.enum(["PROPERTY", "WORKSPACE"]).optional(),
    amenities: z
      .string()
      .optional()
      .transform((v) =>
        v
          ? v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      ),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: t("search.error.end_before_start"),
    path: ["checkOut"],
  });

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const SearchResultItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["PROPERTY", "WORKSPACE"]),
  city: z.string(),
  country: z.string(),
  nightlyRateCents: z.number().int(),
  currency: z.string(),
  totalCents: z.number().int(),
  primaryPhotoUrl: z.string().nullable(),
});

export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

export const SearchResponseSchema = z.object({
  data: z.array(SearchResultItemSchema),
  pagination: z.object({
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    hasMore: z.boolean(),
  }),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;
