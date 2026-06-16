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

/**
 * Login request shape. Only presence is validated here — the password policy is
 * not re-checked at login (an existing account may predate a policy change), and
 * credential correctness is verified server-side.
 */
export const LoginSchema = z.object({
  email: z.string().email(t("validation.email.invalid")),
  password: z.string().min(1, t("validation.required.field")),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/** Request shape for the refresh and logout endpoints — carries the opaque refresh token. */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, t("validation.required.field")),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

/**
 * Host onboarding form. The terms version is stamped server-side; the client
 * only acknowledges acceptance, so `acceptedTerms` must be exactly `true`.
 */
export const BecomeHostSchema = z.object({
  displayName: z.string().min(2, t("validation.required.field")),
  payoutEmail: z.string().email(t("validation.email.invalid")),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: t("identity.become_host.terms_required") }),
  }),
});

export type BecomeHostInput = z.infer<typeof BecomeHostSchema>;
