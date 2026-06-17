import { z } from "zod";

const isoDate = z.string().date();

export const CreateBookingSchema = z
  .object({
    listingId: z.string().uuid(),
    checkIn: isoDate,
    checkOut: isoDate,
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const CancelBookingSchema = z.object({
  cancellationReason: z.string().max(500).optional(),
});

export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;

export const BookingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type BookingListQuery = z.infer<typeof BookingListQuerySchema>;
