import { z } from "zod";

export const RecordPayoutSchema = z.object({
  hostId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  method: z.string().min(1).max(100),
  externalReference: z.string().min(1).max(255),
  bookingIds: z.array(z.string().uuid()).min(1),
});

export type RecordPayoutInput = z.infer<typeof RecordPayoutSchema>;
