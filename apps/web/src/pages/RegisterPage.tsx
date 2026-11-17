import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { useRegister } from "../hooks/useRegister.js";
import { AuthShell } from "../components/AuthShell.js";
import { FormField, errorIdFor } from "../components/FormField.js";
import { ServerErrorAlert } from "../components/ServerErrorAlert.js";

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    onSubmit,
    formState: { errors, isSubmitting, isValid },
    serverError,
  } = useRegister();

  return (
    <AuthShell
      title={t("auth.register.title")}
      titleId="auth-title"
      subtitle={t("auth.register.subtitle")}
      footer={
        <p className="m-0">
          {t("auth.register.have_account")}{" "}
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center font-bold text-fg underline underline-offset-4"
          >
            {t("auth.register.login_link")}
          </Link>
        </p>
      }
    >
      <form
        aria-labelledby="auth-title"
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="space-y-5"
      >
        <FormField id="email" label={t("auth.register.email_label")} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!errors.email}
            aria-required="true"
            aria-describedby={errors.email ? errorIdFor("email") : undefined}
            {...register("email")}
          />
        </FormField>

        <FormField
          id="password"
          label={t("auth.register.password_label")}
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-required="true"
            aria-describedby={errors.password ? errorIdFor("password") : undefined}
            {...register("password")}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label={t("auth.register.confirm_password_label")}
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-required="true"
            aria-describedby={errors.confirmPassword ? errorIdFor("confirmPassword") : undefined}
            {...register("confirmPassword")}
          />
        </FormField>

        <ServerErrorAlert error={serverError} />

        <Button type="submit" className="w-full" disabled={isSubmitting || !isValid}>
          {t("auth.register.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
