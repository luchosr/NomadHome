import { z } from "zod";

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
