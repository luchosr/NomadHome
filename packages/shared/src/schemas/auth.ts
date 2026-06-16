import { z } from "zod";
import { t } from "../t.js";

/**
 * Registration request shape — the single source of truth shared by the API
 * (runtime validation) and the web app (type inference + form validation).
 *
 * Password policy (identity spec): ≥10 chars, ≥1 letter, ≥1 digit.
 */
export const RegisterSchema = z.object({
  email: z.string().email(t("validation.email.invalid")),
  password: z
    .string()
    .min(10, t("validation.password.too_short"))
    .regex(/[A-Za-z]/, t("validation.password.needs_letter"))
    .regex(/[0-9]/, t("validation.password.needs_digit")),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
